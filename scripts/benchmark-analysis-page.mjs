import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";

// Execute the actual page with fixture queries delayed by 8 ms; no live DB or browser.
const require = createRequire(import.meta.url);
const { resolveAnalysisSelection, analysisPeriodOptions } = require("../lib/analysis-navigation.ts");
const source = readFileSync(process.argv[2] ?? "app/analysis/page.tsx", "utf8");
const results = { measurement: "analysis-page-fixture-8ms-per-query", views: {} };
for (const view of ["monthly", "weekly", "daily", "yearly"]) {
  const samples = [];
  const hashes = new Set();
  let maxConcurrent = 0, queries = 0;
  for (let iteration = 0; iteration < 7; iteration++) {
    let active = 0, maximum = 0, count = 0;
    const query = (value) => async () => {
      active++; count++; maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 8));
      active--;
      return structuredClone(value);
    };
    const data = {
      getTransactionDateBounds: query({ earliest: "2025-12-01", latest: "2026-11-07" }),
      getMonthlySummary: query({ income: 10000, expense: 2500, balance: 7500, reimbursement: 0 }),
      getCategoryBreakdown: query([{ name: "食費", amount: 2500, color: "#123456" }]),
      getDailySpendingTrend: query([{ date: "2026-11-01", amount: 2500 }]),
      getWeekSummaryForDates: query({ income: 10000, expense: 2500, reimbursement: 0, effectiveExpense: 2500, categories: [] }),
      getDailyData: query(Array.from({ length: 12 }, (_, index) => ({ month: index + 1, days: [] }))),
    };
    const imports = { "react/jsx-runtime": require("react/jsx-runtime"), "@/lib/data": data, "@/lib/analysis-navigation": { resolveAnalysisSelection, analysisPeriodOptions } };
    const modules = new Map();
    const loaded = { exports: {} };
    const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2017, jsx: JsxEmit.ReactJSX, esModuleInterop: true } });
    new Function("require", "module", "exports", outputText)((name) => {
      if (name in imports) return imports[name];
      assert.ok(name.startsWith("@/components/"), `Unexpected import ${name}`);
      if (!modules.has(name)) modules.set(name, { __esModule: true, default: name, ...Object.fromEntries(["Card", "CardContent", "CardHeader", "CardTitle"].map((key) => [key, `${name}:${key}`])) });
      return modules.get(name);
    }, loaded, loaded.exports);
    const period = view === "weekly" ? "2026-11-02" : view === "yearly" ? "2026" : "2026-11";
    const started = performance.now();
    const page = await loaded.exports.default({ searchParams: Promise.resolve({ view, period }) });
    samples.push(performance.now() - started);
    // UI components themselves are not executed; hashes cover the page's element tree and props.
    hashes.add(createHash("sha256").update(JSON.stringify(page)).digest("hex"));
    maxConcurrent = Math.max(maxConcurrent, maximum); queries = count;
  }
  assert.equal(hashes.size, 1, "page props changed across repeated fixture runs");
  samples.sort((a, b) => a - b);
  results.views[view] = { queryCalls: queries, maxConcurrent, medianMs: Number(samples[3].toFixed(3)), outputHash: [...hashes][0] };
}
if (process.argv[3]) writeFileSync(process.argv[3], `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import { ModuleKind, JsxEmit, ScriptTarget, transpileModule } from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(process.argv[2] ?? ".");
const outputFile = process.argv[3];
const source = (name) => readFileSync(resolve(root, name), "utf8");
function load(name, imports) {
  const { outputText } = transpileModule(source(name), { fileName: name, compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX, target: ScriptTarget.ES2017 } });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)((key) => {
    if (!(key in imports)) throw new Error(`Unexpected dependency: ${key}`);
    return imports[key];
  }, loaded, loaded.exports);
  return loaded.exports;
}

function fixture() {
  const rows = Array.from({ length: 180 }, (_, i) => ({
    id: i + 1, date: `${i < 60 ? "2025-12" : "2026-10"}-${String(i % 28 + 1).padStart(2, "0")}`,
    type: i % 4 ? "expense" : "income", amount: 100 + i, pay_method: i % 2 ? "Cash" : "Credit",
    category_id: i % 3 + 1, categories: { offset_category_id: i % 16 === 0 ? 1 : null },
    content: "fixture".repeat(60), store: "test store", created_at: "2026-10-01T00:00:00Z",
  }));
  const tables = { transactions: rows, credit_settlements: [{ id: 1, year: 2025, month: 12, amount: 1200, settlement_date: "2025-12-27" }, { id: 2, year: 2026, month: 10, amount: 2500, settlement_date: "2026-10-27" }] };
  const stats = { queries: 0, maxConcurrent: 0, payloadBytes: 0 };
  let active = 0;
  const client = { from(table) {
    const filters = [];
    let columns = "*";
    let from = 0;
    let to = Infinity;
    const execute = async () => {
      stats.queries++;
      active++;
      stats.maxConcurrent = Math.max(stats.maxConcurrent, active);
      await new Promise((done) => setTimeout(done, 8));
      active--;
      let data = tables[table].filter((row) => filters.every((filter) => filter(row))).slice(from, to + 1);
      if (columns !== "*") {
        const fields = columns.split(/,(?![^()]*\))/).map((field) => field.trim().split("(")[0]);
        data = data.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
      }
      stats.payloadBytes += Buffer.byteLength(JSON.stringify(data));
      return { data, error: null };
    };
    const query = {
      select(value) { columns = value; return query; }, order() { return query; },
      lt(key, value) { filters.push((row) => row[key] < value); return query; },
      lte(key, value) { filters.push((row) => row[key] <= value); return query; },
      gte(key, value) { filters.push((row) => row[key] >= value); return query; },
      eq(key, value) { filters.push((row) => row[key] === value); return query; },
      range(start, end) { from = start; to = end; return execute(); },
      then(onFulfilled, onRejected) { return execute().then(onFulfilled, onRejected); },
    };
    return query;
  } };
  // This cache is scoped to one synthetic render, not a persistent application cache.
  const requestCache = (fn) => {
    const values = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (!values.has(key)) values.set(key, fn(...args));
      return values.get(key);
    };
  };
  const data = load("lib/data.ts", {
    "@/utils/supabase/server": { createClient: async () => client },
    "@/lib/dateUtils": { getJapanToday: () => ({ date: "2026-11-06" }) },
    react: { cache: requestCache },
  });
  return { data, stats };
}

async function runData(name) {
  const times = [];
  let result;
  for (let run = 0; run < 7; run++) {
    const { data, stats } = fixture();
    let operation;
    if (name === "daily") operation = () => data.getDailyData(2026);
    if (name === "balance") operation = () => data.getCurrentBalance();
    if (name === "yearly-screen") {
      const noop = () => null;
      const component = load("components/analysis/YearlyAnalysis.tsx", {
        "react/jsx-runtime": require("react/jsx-runtime"),
        "@/components/ui/card": { Card: "card", CardHeader: "header", CardContent: "content", CardTitle: "title" },
        "@/components/dashboard/SummaryCards": { default: noop },
        "@/components/dashboard/MonthlyBarChart": { default: noop },
        "@/lib/data": data,
      }).default;
      operation = () => component({ year: 2026 });
    }
    const start = performance.now();
    const value = await operation();
    times.push(performance.now() - start);
    const serialized = JSON.stringify(value, (key, field) => typeof field === "function" ? "component" : field);
    result = { ...stats, resultHash: createHash("sha256").update(serialized).digest("hex") };
  }
  return { ...result, medianSyntheticMs: Number(times.sort((a, b) => a - b)[3].toFixed(3)) };
}

async function runDuplicates() {
  const existing = Array.from({ length: 10000 }, (_, i) => ({ date: `2026-10-${String(i % 28 + 1).padStart(2, "0")}`, amount: i % 900, store: i % 3 ? `store${i % 100}` : null }));
  const rows = existing.slice(0, 2000).map((row, i) => ({ ...row, store: i % 7 ? row.store : "different" }));
  let build;
  if (existsSync(resolve(root, "lib/import-duplicates.ts"))) {
    const helper = load("lib/import-duplicates.ts", {});
    build = () => {
      const index = helper.buildDuplicateIndex(existing);
      return (row) => helper.getDuplicateLevel(index, row);
    };
  } else {
    const text = source("components/import/CsvImportForm.tsx");
    const start = text.indexOf("  function getDuplicateLevel(");
    const end = text.indexOf("\n  const indexedRows", start);
    const { outputText } = transpileModule(text.slice(start, end), { compilerOptions: { target: ScriptTarget.ES2017 } });
    build = () => new Function("existingTx", `${outputText}; return getDuplicateLevel;`)(existing);
  }
  const times = [];
  let output;
  for (let run = 0; run < 9; run++) {
    const start = performance.now();
    const lookup = build(); // Include index construction in the timed work.
    output = rows.map(lookup);
    times.push(performance.now() - start);
  }
  return { incomingRows: rows.length, existingRows: existing.length, medianLocalMs: Number(times.sort((a, b) => a - b)[4].toFixed(3)), resultHash: createHash("sha256").update(JSON.stringify(output)).digest("hex") };
}

const result = { measurement: "synthetic-db-8ms-per-query-and-local-cpu; not production latency", daily: await runData("daily"), balance: await runData("balance"), yearly: await runData("yearly-screen"), duplicates: await runDuplicates() };
if (outputFile) writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

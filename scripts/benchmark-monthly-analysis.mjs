import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

// Actual readers; request-scoped cache and capped query results are simulated.
// No credentials, network requests, browser rendering, or live data.
export function monthlyFixture(source, { size = 180, failIncome = false, failShared = false } = {}) {
  const stats = { queryCalls: 0, payloadBytes: 0, maxConcurrent: 0 };
  let active = 0;
  const transactions = Array.from({ length: size }, (_, index) => ({
    date: `2024-02-${String(index % 29 + 1).padStart(2, "0")}`,
    type: index % 4 ? "expense" : "income", amount: index % 37 + 10,
    category_id: index % 5 === 0 ? null : index % 2 + 1,
    categories: index % 5 === 0 ? null : { name: `category${index % 2 + 1}`, color: index % 2 ? "#123456" : null, offset_category_id: index % 8 === 0 ? 2 : null },
  }));
  // Exercise pre-month and post-month exclusion, including leap day.
  transactions.unshift({ ...transactions[1], date: "2024-01-31" });
  transactions.push({ ...transactions[1], date: "2024-03-01" });
  const client = { from(table) {
    assert.equal(table, "transactions");
    const filters = [];
    let columns, incomeOnly = false;
    const execute = async () => {
      stats.queryCalls++;
      stats.maxConcurrent = Math.max(stats.maxConcurrent, ++active);
      await new Promise((done) => setTimeout(done, 8));
      active--;
      if ((failIncome && incomeOnly) || (failShared && !incomeOnly && columns.includes("type"))) return { data: null, error: { message: "fixture error" } };
      const fields = columns.split(/,(?![^()]*\))/).map((field) => field.trim());
      const data = transactions.filter((row) => filters.every((filter) => filter(row))).slice(0, 1000).map((row) => Object.fromEntries(fields.map((field) => {
        const name = field.split("(")[0];
        return [name, name === "categories" && row.categories ? Object.fromEntries(field.slice(field.indexOf("(") + 1, -1).split(",").map((key) => [key.trim(), row.categories[key.trim()]])) : row[name]];
      })));
      stats.payloadBytes += Buffer.byteLength(JSON.stringify(data));
      return { data, error: null };
    };
    const query = {
      select(value) { columns = value; return query; },
      eq(key, value) { if (key === "type" && value === "income") incomeOnly = true; filters.push((row) => row[key] === value); return query; },
      gte(key, value) { filters.push((row) => row[key] >= value); return query; },
      lt(key, value) { filters.push((row) => row[key] < value); return query; },
      lte(key, value) { filters.push((row) => row[key] <= value); return query; },
      then(onFulfilled, onRejected) { return execute().then(onFulfilled, onRejected); },
    };
    return query;
  } };
  const cache = (fn) => {
    const entries = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (!entries.has(key)) entries.set(key, fn(...args));
      return entries.get(key);
    };
  };
  const imports = { react: { cache }, "@/utils/supabase/server": { createClient: async () => client }, "@/lib/dateUtils": {} };
  const loaded = { exports: {} };
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2017 } });
  new Function("require", "module", "exports", outputText)((name) => { assert.ok(name in imports, name); return imports[name]; }, loaded, loaded.exports);
  return { data: loaded.exports, stats };
}

async function benchmark(root) {
  const source = readFileSync(resolve(root, "lib/data.ts"), "utf8");
  const results = {};
  for (const size of [180, 2400]) {
    const times = [], hashes = new Set();
    let stats;
    for (let iteration = 0; iteration < 7; iteration++) {
      const db = monthlyFixture(source, { size });
      const start = performance.now();
      const output = await Promise.all([db.data.getMonthlySummary(2024, 2), db.data.getCategoryBreakdown(2024, 2), db.data.getDailySpendingTrend(2024, 2)]);
      times.push(performance.now() - start);
      hashes.add(createHash("sha256").update(JSON.stringify(output)).digest("hex"));
      stats = db.stats;
    }
    assert.equal(hashes.size, 1);
    times.sort((a, b) => a - b);
    results[size] = { ...stats, medianMs: Number(times[3].toFixed(3)), outputHash: [...hashes][0] };
  }
  return { measurement: "monthly-analysis-8ms-query-fixture-with-1000-row-cap", results };
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const output = await benchmark(process.argv[2] ?? ".");
  if (process.argv[4]) {
    const before = JSON.parse(readFileSync(process.argv[4], "utf8"));
    for (const size of Object.keys(output.results)) assert.equal(output.results[size].outputHash, before.results[size].outputHash, `Results changed for ${size} transactions`);
  }
  if (process.argv[3]) writeFileSync(process.argv[3], `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

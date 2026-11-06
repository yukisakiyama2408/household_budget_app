import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { getWeekBudgetPeriods } from "./dateUtils";

type Row = Record<string, unknown>;

function fixture(failingTable?: string) {
  const tables: Record<string, Row[]> = {
    categories: [{ id: 1, name: "食費", type: "expense" }, { id: 2, name: "給与", type: "income" }],
    budgets: [{ year: 2025, month: 12, category_id: 1, amount: 400 }, { year: 2026, month: 1, category_id: 1, amount: 600 }],
    weekly_budget_periods: [{ period_start: "2025-12-29", period_end: "2025-12-31", category_id: 1, amount: 100 }],
    transactions: [
      { date: "2025-12-31", type: "expense", pay_method: "Cash", category_id: 1, amount: 100, categories: null },
      { date: "2026-01-01", type: "expense", pay_method: "Credit", category_id: 1, amount: 80, categories: null },
      { date: "2026-01-02", type: "income", category_id: 2, amount: 20, categories: { offset_category_id: 1 } },
      { date: "2026-01-02", type: "income", category_id: 2, amount: 30, categories: null },
    ],
    credit_settlements: [{ year: 2026, month: 1, amount: 40, settlement_date: "2026-01-27" }],
    analysis_results: [
      { id: 1, analysis_view: "monthly", date_from: "2025-12-01", date_to: "2025-12-31", created_at: "2026-01-01", analysis_advices: [] },
      { id: 2, analysis_view: "monthly", date_from: "2025-12-01", date_to: "2025-12-31", created_at: "2026-01-02", analysis_advices: [{ display_order: 2 }, { display_order: 1 }] },
      { id: 3, analysis_view: "monthly", date_from: "2026-01-01", date_to: "2026-01-31", created_at: "2026-02-01", analysis_advices: [] },
    ],
  };
  const calls: { table: string; columns: string; limit: number }[] = [];
  let active = 0, maxConcurrent = 0;
  const client = { from(table: string) {
    const filters: ((row: Row) => boolean)[] = [];
    const sorts: { key: string; ascending: boolean }[] = [];
    let columns = "*", limit = Infinity, from = 0, to = Infinity;
    const execute = async () => {
      calls.push({ table, columns, limit });
      maxConcurrent = Math.max(maxConcurrent, ++active);
      await new Promise<void>((done) => setImmediate(done));
      active--;
      if (table === failingTable) return { data: null, error: { message: "fixture error" } };
      let data = tables[table].filter((row) => filters.every((filter) => filter(row)));
      data.sort((a, b) => {
        for (const sort of sorts) {
          const result = String(a[sort.key]).localeCompare(String(b[sort.key]));
          if (result) return sort.ascending ? result : -result;
        }
        return 0;
      });
      data = data.slice(from, Math.min(to + 1, limit));
      if (!columns.startsWith("*")) {
        const fields = columns.split(/,(?![^()]*\))/).map((field) => field.trim().split("(")[0]);
        data = data.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
      }
      return { data, error: null };
    };
    const query = {
      select(value: string) { columns = value; return query; },
      order(key: string, { ascending = true } = {}) { sorts.push({ key, ascending }); return query; },
      eq(key: string, value: unknown) { filters.push((row) => row[key] === value); return query; },
      lt(key: string, value: string | number) { filters.push((row) => (row[key] as string | number) < value); return query; },
      lte(key: string, value: string | number) { filters.push((row) => (row[key] as string | number) <= value); return query; },
      gte(key: string, value: string | number) { filters.push((row) => (row[key] as string | number) >= value); return query; },
      limit(value: number) { limit = value; return query; },
      range(start: number, end: number) { from = start; to = end; return execute(); },
      async maybeSingle() { const result = await execute(); return { ...result, data: result.data?.[0] ?? null }; },
      then(resolve: (result: Awaited<ReturnType<typeof execute>>) => unknown) { return execute().then(resolve); },
    };
    return query;
  } };
  // Fresh scope per fixture models the React request cache, not cross-request persistence.
  const cache = (fn: (...args: unknown[]) => unknown) => {
    const values = new Map<string, unknown>();
    return (...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (!values.has(key)) values.set(key, fn(...args));
      return values.get(key);
    };
  };
  const imports: Record<string, unknown> = {
    react: { cache },
    "@/utils/supabase/server": { createClient: async () => client },
    "@/lib/dateUtils": { getWeekBudgetPeriods, getJapanToday: () => ({ date: "2026-02-01" }) },
  };
  const { outputText } = transpileModule(readFileSync(new URL("./data.ts", import.meta.url), "utf8"), { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2017 } });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)((key: string) => { assert.ok(key in imports); return imports[key]; }, loaded, loaded.exports);
  return { data: loaded.exports as typeof import("./data"), calls, maxConcurrent: () => maxConcurrent };
}

test("daily fetches overlap while preserving opening balance, cash, credit and settlements", async () => {
  const db = fixture();
  const months = await db.data.getDailyData(2026);
  assert.equal(db.calls.length, 4);
  assert.equal(db.maxConcurrent(), 4);
  assert.equal(months[0].startBalance, -100);
  assert.equal(months[0].totalIncome, 50);
  assert.equal(months[0].totalCreditExpense, 80);
  assert.equal(months[0].totalCashExpense, 0);
  assert.equal(months[1].startBalance, -90);
  assert.ok(db.calls.filter((call) => call.table === "transactions").every((call) => !call.columns.includes("*")));
});

test("monthly and year-crossing weekly budgets preserve actuals, explicit amounts and derivation", async () => {
  const db = fixture();
  const [monthly, weekly] = await Promise.all([db.data.getBudgetData(2026, 1), db.data.getWeeklyBudgetData(2026, 1, "2025-12-29", "2026-01-04")]);
  assert.equal(monthly[0].actualAmount, 60);
  assert.equal(monthly[0].budgetAmount, 600);
  assert.equal(weekly[0].periods[0].budget, 100);
  assert.equal(weekly[0].periods[1].budgetDerived, 120);
  assert.equal(weekly[0].weeklyActual, 180, JSON.stringify({ weekly, calls: db.calls }));
  assert.equal(weekly[0].weeklyBudget, 220);
  assert.equal(db.calls.filter((call) => call.table === "categories").length, 1);
  assert.equal(db.calls.filter((call) => call.table === "budgets").length, 2);
  const freshRequest = fixture();
  await freshRequest.data.getCategories();
  assert.equal(freshRequest.calls.length, 1);
});

test("a yearly trend supplies identical summary totals without additional requests", async () => {
  const db = fixture();
  const trend = await db.data.getYearlyTrend(2026);
  assert.deepEqual(db.data.summarizeYearlyTrend(trend), { income: 50, expense: 80, reimbursement: 20, effectiveExpense: 60, balance: -30 });
  assert.equal(db.calls.length, 2);
  assert.deepEqual(await fixture().data.getYearlySummary(2026), db.data.summarizeYearlyTrend(trend));
});

test("budget analysis lookup returns the same newest result and sorted advice as full history", async () => {
  const db = fixture();
  const history = await db.data.getAnalysisResults();
  const selected = await db.data.getAnalysisResultForPeriod("monthly", "2025-12-01", "2025-12-31");
  assert.deepEqual(selected, history.find((item) => item.date_from === "2025-12-01"));
  assert.equal(selected?.id, 2);
  assert.equal(db.calls.at(-1)?.limit, 1);
  assert.equal(await db.data.getAnalysisResultForPeriod("weekly", "2025-12-29", "2026-01-04"), null);
});

test("parallel query failures still propagate to the caller", async () => {
  await assert.rejects(fixture("credit_settlements").data.getDailyData(2026), /fixture error/);
  await assert.rejects(fixture("categories").data.getBudgetData(2026, 1), /fixture error/);
});

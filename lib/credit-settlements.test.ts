import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, transpileModule } from "typescript";
import { creditSettlementsHref, validateCreditSettlement } from "./credit-settlements";

test("settlement links preserve past months and year boundaries", () => {
  assert.equal(creditSettlementsHref("2025-12"), "/transactions/settlements?month=2025-12");
  assert.equal(creditSettlementsHref("2026-01"), "/transactions/settlements?month=2026-01");
  assert.equal(creditSettlementsHref("all"), "/transactions/settlements");
});

test("amounts and actual calendar dates must be valid for the selected month", () => {
  assert.doesNotThrow(() => validateCreditSettlement(2024, 2, 0, "2024-02-29"));
  assert.doesNotThrow(() => validateCreditSettlement(2025, 12, 10000, "2025-12-31"));
  for (const amount of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateCreditSettlement(2026, 2, amount, "2026-02-27"));
  }
  for (const date of ["", "2026-02-29", "2026-02-31", "2026-03-01", "2026-2-01"]) {
    assert.throws(() => validateCreditSettlement(2026, 2, 10000, date));
  }
  assert.throws(() => validateCreditSettlement(2026, 13, 10000, "2026-12-27"));
});

// Execute the actual data readers and server action with an in-memory database.
// Only their infrastructure imports are replaced; no live household data is read or written.
function loadModule<T>(file: string, imports: Record<string, unknown>): T {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const loadedModule = { exports: {} };
  const requireMock = (name: string) => {
    assert.ok(name in imports, `Unexpected dependency: ${name}`);
    return imports[name];
  };
  new Function("require", "module", "exports", outputText)(requireMock, loadedModule, loadedModule.exports);
  return loadedModule.exports as T;
}

type Row = Record<string, string | number>;

function databaseFixture() {
  const tables: Record<string, Row[]> = {
    transactions: [
      { date: "2025-12-01", type: "income", amount: 100000 },
      { date: "2025-12-02", type: "expense", pay_method: "Cash", amount: 20000 },
      { date: "2025-12-03", type: "expense", pay_method: "Credit", amount: 6000 },
      { date: "2026-10-01", type: "income", amount: 200000 },
      { date: "2026-10-02", type: "expense", pay_method: "Cash", amount: 30000 },
      { date: "2026-10-03", type: "expense", pay_method: "Credit", amount: 25000 },
      { date: "2026-11-02", type: "expense", pay_method: "Credit", amount: 12000 },
      { date: "2026-11-03", type: "expense", pay_method: "Cash", amount: 5000 },
    ],
    credit_settlements: [
      { id: 1, year: 2025, month: 12, amount: 5000, settlement_date: "2025-12-27" },
      { id: 2, year: 2026, month: 10, amount: 15000, settlement_date: "2026-10-27" },
      { id: 3, year: 2026, month: 11, amount: 20000, settlement_date: "2026-11-27" },
    ],
  };
  const writes: string[] = [];
  const client = {
    from(table: string) {
      const filters: ((row: Row) => boolean)[] = [];
      const result = () => ({ data: tables[table].filter((row) => filters.every((filter) => filter(row))), error: null });
      const query = {
        select() { return query; },
        order() { return query; },
        eq(field: string, value: string | number) { filters.push((row) => row[field] === value); return query; },
        lt(field: string, value: string | number) { filters.push((row) => row[field] < value); return query; },
        lte(field: string, value: string | number) { filters.push((row) => row[field] <= value); return query; },
        gte(field: string, value: string | number) { filters.push((row) => row[field] >= value); return query; },
        range(from: number, to: number) { return Promise.resolve({ ...result(), data: result().data.slice(from, to + 1) }); },
        then(resolve: (value: ReturnType<typeof result>) => unknown) { return Promise.resolve(result()).then(resolve); },
        async upsert(row: Row, options: { onConflict: string }) {
          assert.equal(options.onConflict, "year,month");
          writes.push(table);
          const existing = tables[table].find((item) => item.year === row.year && item.month === row.month);
          if (existing) Object.assign(existing, row);
          else tables[table].push({ id: 100, ...row });
          return { error: null };
        },
      };
      return query;
    },
  };
  return { client, tables, writes };
}

test("saving and correcting an amount preserves balance accounting and never duplicates purchase expenses", async () => {
  const { client, tables, writes } = databaseFixture();
  const paths: string[] = [];
  const server = { createClient: async () => client };
  const data = loadModule<Pick<typeof import("./data"), "getDailyData" | "getCurrentBalance">>("./data.ts", {
    "@/utils/supabase/server": server,
    "@/lib/dateUtils": { getJapanToday: () => ({ date: "2026-11-06" }) },
  });
  const actions = loadModule<Pick<typeof import("./actions"), "upsertCreditSettlement">>("./actions.ts", {
    "@/utils/supabase/server": server,
    "next/cache": { revalidatePath: (path: string) => paths.push(path) },
    "next/navigation": {},
    "@/lib/fixed-expenses": {},
    "@/lib/fixed-expense-navigation": {},
    "@/lib/credit-settlements": { validateCreditSettlement },
  });
  const originalTransactions = structuredClone(tables.transactions);
  const before = await data.getDailyData(2026);
  assert.equal(before[0].startBalance, 75000);
  assert.equal(before[10].startBalance, 230000);
  assert.equal(before[10].totalCashExpense, 5000);
  assert.equal(before[10].totalCreditExpense, 12000);
  assert.equal(before[11].startBalance, 205000);
  assert.equal(await data.getCurrentBalance(), 225000); // Future Nov 27 withdrawal is excluded.

  await actions.upsertCreditSettlement(2026, 11, 10000, "2026-11-05");
  const after = await data.getDailyData(2026);
  assert.equal(await data.getCurrentBalance(), 215000);
  assert.equal(after[11].startBalance, 215000);
  assert.equal(after[10].settlementDay, 5);
  assert.equal(after[10].totalCashExpense, before[10].totalCashExpense);
  assert.equal(after[10].totalCreditExpense, before[10].totalCreditExpense);
  assert.equal(tables.credit_settlements.length, 3); // Same month is updated, not inserted again.
  assert.deepEqual(tables.transactions, originalTransactions);
  assert.deepEqual(writes, ["credit_settlements"]);
  for (const path of ["/transactions/settlements", "/", "/daily", "/monthly"]) assert.ok(paths.includes(path));

  await actions.upsertCreditSettlement(2026, 11, 0, "2026-11-05");
  assert.equal(await data.getCurrentBalance(), 225000);
  assert.equal(tables.credit_settlements.length, 3);
  await assert.rejects(actions.upsertCreditSettlement(2026, 11, -1, "2026-11-05"));
  assert.deepEqual(writes, ["credit_settlements", "credit_settlements"]);

  await actions.upsertCreditSettlement(2026, 12, 7000, "2026-12-27");
  assert.equal(tables.credit_settlements.length, 4);
  assert.equal((await data.getDailyData(2026))[11].creditSettlement, 7000);
  assert.equal((await data.getDailyData(2027))[0].startBalance, 218000);
  assert.equal(await data.getCurrentBalance(), 225000);
  assert.deepEqual(tables.transactions, originalTransactions);
});

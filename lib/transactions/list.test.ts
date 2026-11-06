import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, transpileModule } from "typescript";
import { createClient } from "@supabase/supabase-js";
import { parseTransactionFilters, transactionFilterParams, transactionMonthOptions } from "./filters";
import type { getTransactionPage, validateTransactionCursor } from "./list";

test("no month defaults to all data; old links and repeated multi-select values round-trip", () => {
  assert.deepEqual(parseTransactionFilters({}).months, []);
  assert.deepEqual(parseTransactionFilters({ month: "all" }).months, []);
  const filters = parseTransactionFilters({ month: ["2026-01", "2025-12", "2026-01"], category_id: ["2", "1"], type: "expense", q: "  昼食  " });
  assert.deepEqual(filters.months, ["2025-12", "2026-01"]);
  assert.deepEqual(parseTransactionFilters(transactionFilterParams(filters)), filters);
  assert.deepEqual(parseTransactionFilters({ month: ["2026-13", "wrong"], category_id: "1),id.gt.0", type: "bad" }).categoryIds, []);
});

test("month choices include year boundaries, past data and selected months outside the bounds", () => {
  assert.deepEqual(transactionMonthOptions({ earliest: "2025-12-01", latest: "2026-02-01" }, ["2020-01"]), ["2026-02", "2026-01", "2025-12", "2020-01"]);
  assert.deepEqual(transactionMonthOptions(null, []), []);
  assert.equal(parseTransactionFilters({ dateFrom: "2026-02-30", dateTo: "2026-03-01" }).dateFrom, undefined);
});

type Row = Record<string, string | number | null>;

// Interpret the PostgREST expressions sent by the real SDK against in-memory rows.
function split(expression: string): string[] {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let start = 0;
  const parts: string[] = [];
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (escaped) { escaped = false; continue; }
    if (quoted && char === "\\") { escaped = true; continue; }
    if (char === '"') quoted = !quoted;
    if (!quoted) {
      if (char === "(") depth++;
      if (char === ")") depth--;
      if (char === "," && depth === 0) { parts.push(expression.slice(start, i)); start = i + 1; }
    }
  }
  assert.equal(depth, 0);
  assert.equal(quoted, false);
  parts.push(expression.slice(start));
  return parts;
}

function matches(row: Row, expression: string): boolean {
  for (const group of ["and", "or"]) {
    if (expression.startsWith(`${group}(`)) {
      const parts = split(expression.slice(group.length + 1, -1));
      return group === "and" ? parts.every((part) => matches(row, part)) : parts.some((part) => matches(row, part));
    }
  }
  const match = expression.match(/^(\w+)\.(eq|lt|lte|gte|in|is|ilike)\.(.*)$/);
  assert.ok(match, expression);
  const [, field, operator, raw] = match;
  const actual = row[field];
  if (operator === "is") return raw === "null" && actual === null;
  if (operator === "in") return split(raw.slice(1, -1)).includes(String(actual));
  const value = raw.startsWith('"') ? JSON.parse(raw) as string : raw;
  if (operator === "ilike") {
    let pattern = "";
    for (let i = 0; i < value.length; i++) {
      let char = value[i];
      if (char === "\\") char = value[++i];
      else if (char === "%") { pattern += ".*"; continue; }
      else if (char === "_") { pattern += "."; continue; }
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    return actual != null && new RegExp(`^${pattern}$`, "iu").test(String(actual));
  }
  if (actual == null) return false;
  const expected = typeof actual === "number" ? Number(value) : value;
  if (operator === "eq") return actual === expected;
  if (operator === "lt") return actual < expected;
  if (operator === "lte") return actual <= expected;
  return actual >= expected;
}

function fixture() {
  const rows: Row[] = Array.from({ length: 130 }, (_, i) => ({
    id: i + 1, date: i < 50 ? "2025-12-31" : i < 100 ? "2026-01-31" : "2026-03-01",
    created_at: "2026-03-01T01:00:00+00:00", content: i % 2 ? "昼食" : "給与", amount: 100,
    type: i % 2 ? "expense" : "income", category_id: i % 5 ? i % 3 + 1 : null,
    pay_method: i % 2 ? "Cash" : "Credit", store: i % 7 ? "店舗" : null,
  }));
  const requests: URL[] = [];
  let authenticated = true;
  let fail = false;
  const sdk = createClient("https://example.invalid", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      if (fail) return new Response(JSON.stringify({ message: "test failure" }), { status: 500 });
      assert.equal(url.searchParams.get("limit"), "51");
      assert.equal(url.searchParams.get("order"), "date.desc,created_at.desc,id.desc");
      const filtered = rows.filter((row) => [...url.searchParams].every(([key, value]) => {
        if (key === "select" || key === "order" || key === "limit") return true;
        if (key === "or") return split(value.slice(1, -1)).some((part) => matches(row, part));
        return matches(row, `${key}.${value}`);
      })).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.created_at).localeCompare(String(a.created_at)) || Number(b.id) - Number(a.id));
      return new Response(JSON.stringify(filtered.slice(0, 51)), { headers: { "Content-Type": "application/json" } });
    } },
  });
  const source = readFileSync(new URL("./list.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const loaded = { exports: {} };
  const mockRequire = (name: string) => {
    assert.equal(name, "@/utils/supabase/server");
    return { createClient: async () => ({ from: sdk.from.bind(sdk), auth: { getClaims: async () => ({ data: { claims: authenticated ? { sub: "test-user" } : null } }) } }) };
  };
  new Function("require", "module", "exports", outputText)(mockRequire, loaded, loaded.exports);
  return { rows, requests, setAuthenticated: (value: boolean) => { authenticated = value; }, setFail: () => { fail = true; }, ...loaded.exports as { getTransactionPage: typeof getTransactionPage; validateTransactionCursor: typeof validateTransactionCursor } };
}

test("50-row pages cover all records with stable ties, a concurrent insert and no duplicates", async () => {
  const db = fixture();
  const filters = parseTransactionFilters({});
  db.rows.forEach((row, index) => {
    if (row.date === "2026-01-31" && index % 3 === 0) row.created_at = "2026-03-01T02:00:00+00:00";
  });
  const first = await db.getTransactionPage(filters);
  assert.equal(first.transactions.length, 50);
  assert.ok(first.nextCursor);
  db.rows.push({ ...db.rows[0], id: 999, date: "2026-04-01" });
  const second = await db.getTransactionPage(filters, first.nextCursor);
  const third = await db.getTransactionPage(filters, second.nextCursor);
  assert.equal(second.transactions.length, 50);
  assert.equal(third.transactions.length, 30);
  assert.equal(third.nextCursor, null);
  const ids = [...first.transactions, ...second.transactions, ...third.transactions].map((item) => item.id);
  assert.equal(new Set(ids).size, 130);
  assert.equal(ids.includes(999), false);
  assert.equal(db.requests.length, 3);
});

test("exact page boundaries stop at 50 and continue at 51", async () => {
  for (const count of [0, 50, 51]) {
    const db = fixture();
    db.rows.splice(count);
    const page = await db.getTransactionPage(parseTransactionFilters({}));
    assert.equal(page.transactions.length, Math.min(count, 50));
    assert.equal(page.nextCursor !== null, count > 50);
  }
});

test("multiple months and categories use OR within fields and AND across fields", async () => {
  const db = fixture();
  const filters = parseTransactionFilters({ month: ["2025-12", "2026-03"], category_id: ["1", "2"], type: "expense", pay_method: "Cash", q: "昼食" });
  const page = await db.getTransactionPage(filters);
  const expected = db.rows.filter((row) => ["2025-12", "2026-03"].includes(String(row.date).slice(0, 7)) && [1, 2].includes(Number(row.category_id)) && row.type === "expense");
  assert.equal(page.transactions.length, expected.length);
  assert.equal(page.nextCursor, null);
});

test("missing-field selections are ORed, a date range wins over month, and quoted search stays literal", async () => {
  const db = fixture();
  const page = await db.getTransactionPage(parseTransactionFilters({ month: "2025-12", dateFrom: "2026-03-01", dateTo: "2026-03-01", needs: ["category", "store"] }));
  const expected = db.rows.filter((row) => row.date === "2026-03-01" && (row.category_id === null || (row.store === null && row.type === "expense")));
  assert.equal(page.transactions.length, expected.length);
  db.rows[0].content = '昼食, ("特別") 100%_\\';
  const special = await db.getTransactionPage(parseTransactionFilters({ q: '昼食, ("特別") 100%_\\' }));
  assert.deepEqual(special.transactions.map((row) => row.id), [1]);
});

test("empty results, failures, authentication and unsafe cursors are handled", async () => {
  const db = fixture();
  const empty = await db.getTransactionPage(parseTransactionFilters({ q: "存在しない" }));
  assert.equal(empty.transactions.length, 0);
  assert.equal(empty.nextCursor, null);
  assert.throws(() => db.validateTransactionCursor({ date: "2026-03-01),id.gt.0", createdAt: "2026-03-01T00:00:00Z", id: 1 }));
  db.setAuthenticated(false);
  await assert.rejects(db.getTransactionPage(parseTransactionFilters({})), /ログイン/);
  db.setAuthenticated(true);
  db.setFail();
  await assert.rejects(db.getTransactionPage(parseTransactionFilters({})), /読み込めませんでした/);
});

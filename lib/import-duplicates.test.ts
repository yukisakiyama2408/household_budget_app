import assert from "node:assert/strict";
import test from "node:test";
import { buildDuplicateIndex, getDuplicateLevel } from "./import-duplicates";

type Row = { date: string; amount: number; store: string | null };
const previousLookup = (existing: Row[], row: Row) => {
  const matches = existing.filter((item) => item.date === row.date && item.amount === row.amount);
  return matches.length === 0 ? null : matches.some((item) => item.store && row.store && item.store === row.store) ? "high" : "low";
};

test("indexed duplicate detection matches previous behavior for dates, amounts and missing stores", () => {
  const existing: Row[] = Array.from({ length: 300 }, (_, i) => ({ date: `2026-10-${i % 28 + 1}`, amount: i % 50, store: i % 3 ? `store${i % 10}` : null }));
  existing.push({ date: "2026-10-1", amount: 0, store: "" }, { date: "2026-10-1", amount: NaN, store: "store" });
  const index = buildDuplicateIndex(existing);
  for (const row of [...existing, ...existing.map((item) => ({ ...item, store: "different" })), { date: "2025-01-01", amount: 0, store: null }]) {
    assert.equal(getDuplicateLevel(index, row), previousLookup(existing, row));
  }
});

test("an unchanged index is reusable without mutating records or absorbing later edits", () => {
  const existing = [{ date: "2026-10-01", amount: 100, store: "store" }];
  const index = buildDuplicateIndex(existing);
  existing[0].store = "edited";
  assert.equal(getDuplicateLevel(index, { date: "2026-10-01", amount: 100, store: "store" }), "high");
  assert.equal(getDuplicateLevel(index, existing[0]), "low");
  assert.equal(getDuplicateLevel(buildDuplicateIndex(existing), existing[0]), "high");
});

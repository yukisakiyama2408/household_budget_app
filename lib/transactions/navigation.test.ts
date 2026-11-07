import assert from "node:assert/strict";
import test from "node:test";
import { transactionEntryHref, transactionReturnTo } from "./navigation";

test("entry links preserve multi-value filters and Japanese search through a round trip", () => {
  const target = "/transactions?month=2025-12&month=2026-01&category_id=2&category_id=4&q=ランチ&needs=store";
  const link = transactionEntryHref(12, target);
  const returned = transactionReturnTo(new URL(link, "https://app.invalid").searchParams.get("returnTo"));
  const params = new URL(returned, "https://app.invalid").searchParams;
  assert.deepEqual(params.getAll("month"), ["2025-12", "2026-01"]);
  assert.deepEqual(params.getAll("category_id"), ["2", "4"]);
  assert.equal(params.get("q"), "ランチ");
});

test("return destinations reject external URLs, unknown pages, and unvalidated filters", () => {
  for (const target of ["https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "/transactions/new", "/settings", null]) assert.equal(transactionReturnTo(target), "/transactions");
  assert.equal(transactionReturnTo("/transactions?category_id=bad&month=2026-99&evil=1"), "/transactions");
  assert.equal(transactionReturnTo("/budget?year=2025&month=12"), "/budget?view=monthly&period=2025-12");
  assert.equal(transactionReturnTo("/"), "/");
});

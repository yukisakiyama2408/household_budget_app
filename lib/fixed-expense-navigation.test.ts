import assert from "node:assert/strict";
import test from "node:test";
import LegacyFixedExpensesPage from "../app/fixed/page";
import LegacyNewFixedExpensePage from "../app/fixed/new/page";
import LegacyEditFixedExpensePage from "../app/fixed/[id]/edit/page";
import {
  fixedExpensesHref,
  fixedExpensesReturnTo,
  legacyFixedExpenseMonth,
  normalizeMonth,
} from "./fixed-expense-navigation";

test("past months and year boundaries are preserved", () => {
  for (const month of ["2020-01", "2025-12", "2026-01", "2027-01"]) {
    assert.equal(normalizeMonth(month), month);
    assert.equal(fixedExpensesReturnTo(fixedExpensesHref(month)), `/transactions/fixed?month=${month}`);
  }
});

test("invalid month values cannot become application targets", () => {
  for (const value of [undefined, null, 2026, "all", "2026-00", "2026-13", "0000-01", "2026-1", "2026-01-01"]) {
    assert.equal(normalizeMonth(value), undefined);
  }
  assert.equal(fixedExpensesHref("2026-13"), "/transactions/fixed");
});

test("old budget year/month pairs are converted without losing the selected month", () => {
  assert.equal(legacyFixedExpenseMonth("2025", "12"), "2025-12");
  assert.equal(legacyFixedExpenseMonth("2026", "1"), "2026-01");
  assert.equal(legacyFixedExpenseMonth(undefined, "2020-03"), "2020-03");
  assert.equal(legacyFixedExpenseMonth("2026", "13"), undefined);
  assert.equal(legacyFixedExpenseMonth("2026", "1extra"), undefined);
  assert.equal(legacyFixedExpenseMonth(["2026"], "1"), undefined);
});

test("return URLs cannot send create, update or delete flows outside the fixed-expense list", () => {
  for (const value of [
    undefined, "https://example.com", "//example.com", "/transactions", "/transactions/fixed/new",
    "/transactions/fixed/../new?month=2026-10", "/transactions/fixed?month=2026-13",
    "/transactions/fixed?returnTo=https://example.com",
  ]) {
    assert.equal(fixedExpensesReturnTo(value), "/transactions/fixed");
  }
  assert.equal(
    fixedExpensesReturnTo("/transactions/fixed?month=2025-12&returnTo=https://example.com&tab=fixed"),
    "/transactions/fixed?month=2025-12",
  );
});

test("legacy list, create and edit routes redirect with their month and record preserved", async () => {
  const returnTo = "/transactions/fixed?month=2025-12";
  const query = `?returnTo=${encodeURIComponent(returnTo)}`;
  const cases: [() => Promise<never>, string][] = [
    [() => LegacyFixedExpensesPage({ searchParams: Promise.resolve({ year: "2025", month: "12" }) }), returnTo],
    [() => LegacyNewFixedExpensePage({ searchParams: Promise.resolve({ month: "2025-12" }) }), `/transactions/fixed/new${query}`],
    [() => LegacyEditFixedExpensePage({ params: Promise.resolve({ id: "42" }), searchParams: Promise.resolve({ returnTo }) }), `/transactions/fixed/42/edit${query}`],
  ];
  for (const [navigate, expected] of cases) {
    await assert.rejects(navigate, (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.ok(String(error.digest).includes(`;${expected};`));
      return true;
    });
  }
});

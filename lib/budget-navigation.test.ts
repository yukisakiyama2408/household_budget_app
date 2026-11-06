import assert from "node:assert/strict";
import test from "node:test";
import LegacyGoalsPage from "../app/goals/page";
import LegacyManageGoalsPage from "../app/goals/manage/page";
import { budgetSectionHref } from "./budget-navigation";

test("a past budget month survives a round trip through goal management", () => {
  const context = { year: "2025", month: "12", view: "monthly" };
  const goals = budgetSectionHref("goals", context);
  assert.equal(goals, "/budget/goals?year=2025&month=12");
  const returnedContext = Object.fromEntries(new URL(goals, "https://example.invalid").searchParams);
  assert.equal(budgetSectionHref("budget", returnedContext), "/budget?year=2025&month=12");
});

test("a week spanning months or years retains its displayed month and start date", () => {
  for (const context of [
    { year: "2026", month: "11", view: "weekly", weekStart: "2026-10-26" },
    { year: "2026", month: "1", view: "weekly", weekStart: "2025-12-29" },
  ]) {
    const query = `year=${context.year}&month=${context.month}&view=weekly&weekStart=${context.weekStart}`;
    assert.equal(budgetSectionHref("goals", context), `/budget/goals?${query}`);
    assert.equal(budgetSectionHref("budget", context), `/budget?${query}`);
  }
});

test("only supported period parameters can enter section navigation", () => {
  assert.equal(budgetSectionHref("goals"), "/budget/goals");
  assert.equal(budgetSectionHref("budget", { year: "0000", month: "13", view: "yearly", weekStart: "https://example.com" }), "/budget");
  assert.equal(budgetSectionHref("goals", { year: ["2025", "2026"], month: "02", view: "weekly", weekStart: "2026-02-30" }), "/budget/goals?month=2&view=weekly");
  assert.equal(budgetSectionHref("goals", { view: "weekly", weekStart: "2026-11-03" }), "/budget/goals?view=weekly");
});

test("both legacy goal URLs redirect directly to the new page with the period retained", async () => {
  for (const page of [LegacyGoalsPage, LegacyManageGoalsPage]) {
    await assert.rejects(() => page({ searchParams: Promise.resolve({ year: "2025", month: "12" }) }), (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.ok(String(error.digest).includes(";/budget/goals?year=2025&month=12;"));
      return true;
    });
  }
});

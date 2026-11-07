import assert from "node:assert/strict";
import test from "node:test";
import LegacyGoalsPage from "../app/goals/page";
import LegacyManageGoalsPage from "../app/goals/manage/page";
import { budgetSectionHref, resolveBudgetSelection, budgetHrefForAnalysis } from "./budget-navigation";
import { getCurrentWeekStart } from "./dateUtils";
import { resolveAnalysisSelection } from "./analysis-navigation";

const today = "2026-11-07";
test("a past budget month survives a round trip through goals using canonical parameters", () => {
  const goals = budgetSectionHref("goals", { year: "2025", month: "12" });
  assert.equal(goals, "/budget/goals?view=monthly&period=2025-12");
  assert.equal(budgetSectionHref("budget", Object.fromEntries(new URL(goals, "https://app.invalid").searchParams)), "/budget?view=monthly&period=2025-12");
});

test("cross-month and cross-year weeks retain their interval and picker month", () => {
  for (const [year, month, weekStart, end] of [["2026", "11", "2026-10-26", "2026-11-01"], ["2026", "1", "2025-12-29", "2026-01-04"]]) {
    const selected = resolveBudgetSelection({ year, month, view: "weekly", weekStart }, today);
    assert.equal(selected.dateFrom, weekStart);
    assert.equal(selected.dateTo, end);
    assert.equal(selected.month, Number(month));
    const url = budgetSectionHref("goals", { year, month, view: "weekly", weekStart });
    const returned = resolveBudgetSelection(Object.fromEntries(new URL(url, "https://app.invalid").searchParams), today);
    assert.deepEqual(returned, selected);
  }
});

test("valid new periods override legacy values; invalid input cannot create invalid intervals", () => {
  assert.equal(resolveBudgetSelection({ period: "2024-02", year: "2025", month: "12" }, today).dateTo, "2024-02-29");
  const selected = resolveBudgetSelection({ view: "weekly", period: "2026-10-26", month: "2026-12", weekStart: "2026-11-02" }, today);
  assert.equal(selected.displayMonth, "2026-10");
  assert.equal(selected.dateTo, "2026-11-01");
  assert.equal(resolveBudgetSelection({ period: "2026-02-30", year: "0000", month: "13" }, today).period, "2026-11");
  assert.equal(resolveBudgetSelection({ view: "weekly", weekStart: "2026-02-30" }, today).period, "2026-11-02");
  assert.equal(resolveBudgetSelection({ view: "weekly", period: "2026-11-04" }, today).period, "2026-11-02");
});

test("analysis to budget keeps the weekly interval and monthly anchor", () => {
  assert.equal(budgetHrefForAnalysis(resolveAnalysisSelection({ view: "weekly", period: "2025-12-29" })), "/budget?view=weekly&period=2025-12-29&month=2025-12");
  assert.equal(budgetHrefForAnalysis(resolveAnalysisSelection({ view: "daily", period: "2025-12" })), "/budget?view=monthly&period=2025-12");
});

test("legacy goals redirect directly with the selected month", async () => {
  for (const page of [LegacyGoalsPage, LegacyManageGoalsPage]) {
    await assert.rejects(() => page({ searchParams: Promise.resolve({ year: "2025", month: "12" }) }), (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.ok(String(error.digest).includes(";/budget/goals?view=monthly&period=2025-12;"));
      return true;
    });
  }
});

test("current week uses Japan's Monday even while UTC is still Sunday", () => {
  assert.equal(getCurrentWeekStart(new Date("2026-11-01T14:59:59Z")), "2026-10-26");
  assert.equal(getCurrentWeekStart(new Date("2026-11-01T15:00:00Z")), "2026-11-02");
  assert.equal(getCurrentWeekStart(new Date("2025-12-31T15:00:00Z")), "2025-12-29");
});

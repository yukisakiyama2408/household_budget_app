import assert from "node:assert/strict";
import test from "node:test";
import MonthlyPage from "../app/monthly/page";
import DailyPage from "../app/daily/page";
import YearlyPage from "../app/yearly/page";
import InsightsPage from "../app/insights/page";
import CheckinPage from "../app/checkin/page";
import { getJapanToday } from "./dateUtils";
import { analysisHref, analysisPeriodOptions, legacyAnalysisHref, resolveAnalysisSelection, switchAnalysisView } from "./analysis-navigation";

const today = "2026-11-06";

test("default periods use the calendar date in Japan and handle an empty dataset", () => {
  const japanDate = getJapanToday(new Date("2026-10-31T16:00:00Z")).date;
  const selected = resolveAnalysisSelection({}, "stats", japanDate);
  assert.equal(selected.period, "2026-11");
  assert.equal(resolveAnalysisSelection({}, "checkin", japanDate).period, "2026-10-26");
  assert.equal(analysisPeriodOptions(selected, null, japanDate)[0].value, "2026-11");
});

test("week boundaries cross months and years without truncating or picking another week", () => {
  const selected = resolveAnalysisSelection({ view: "weekly", period: "2025-12-31" }, "stats", today);
  assert.equal(selected.dateFrom, "2025-12-29");
  assert.equal(selected.dateTo, "2026-01-04");
  assert.equal(analysisHref("checkin", selected), "/analysis/reviews/checkin?view=weekly&period=2025-12-29");
});

test("monthly targets cover leap days and preserve a valid period without transactions", () => {
  const selected = resolveAnalysisSelection({ period: "2024-02" }, "stats", today);
  assert.equal(selected.dateTo, "2024-02-29");
  const options = analysisPeriodOptions(selected, { earliest: "2026-10-01", latest: "2026-11-01" }, today);
  assert.ok(options.some((option) => option.value === "2024-02"));
  assert.equal(resolveAnalysisSelection({ period: "2026-99", view: ["weekly"] }, "stats", today).period, "2026-11");
});

test("switching view or section retains the selected period's anchor", () => {
  const month = resolveAnalysisSelection({ period: "2025-12" }, "stats", today);
  assert.equal(switchAnalysisView(month, "yearly").period, "2025");
  assert.equal(switchAnalysisView(month, "weekly").period, "2025-12-01");
  const daily = resolveAnalysisSelection({ view: "daily", period: "2025-12" }, "stats", today);
  assert.equal(analysisHref("reviews", daily), "/analysis/reviews?view=monthly&period=2025-12");
  assert.equal(resolveAnalysisSelection({ view: "daily", period: "2025-12" }, "reviews", today).view, "monthly");
});

test("legacy URLs translate month, year, week and review tabs with new period taking precedence", () => {
  assert.equal(legacyAnalysisHref("monthly", { view: "weekly", week: "2025-12-29", tab: "insights" }, today), "/analysis/reviews?view=weekly&period=2025-12-29");
  assert.equal(legacyAnalysisHref("daily", { month: "2025-12" }, today), "/analysis?view=daily&period=2025-12");
  assert.equal(legacyAnalysisHref("daily", { year: "2025" }, today), "/analysis?view=daily&period=2025-01");
  assert.equal(legacyAnalysisHref("daily", { year: "2026" }, today), "/analysis?view=daily&period=2026-11");
  assert.equal(legacyAnalysisHref("yearly", { year: "2025" }, today), "/analysis?view=yearly&period=2025");
  assert.equal(legacyAnalysisHref("monthly", { period: "2025-12", year: "2026", month: "2" }, today), "/analysis?view=monthly&period=2025-12");
  assert.equal(legacyAnalysisHref("monthly", { view: "weekly", month: "2025-12", week: "5" }, today), "/analysis?view=weekly&period=2025-12-29");
  assert.equal(legacyAnalysisHref("insights", { period: "2025-12", returnTo: "https://example.com" }, today), "/analysis/reviews?view=monthly&period=2025-12");
});

test("all five legacy pages redirect directly to the new destination", async () => {
  const cases = [
    [MonthlyPage, { period: "2025-12", tab: "insights" }, "/analysis/reviews?view=monthly&period=2025-12"],
    [DailyPage, { month: "2025-12" }, "/analysis?view=daily&period=2025-12"],
    [YearlyPage, { year: "2025" }, "/analysis?view=yearly&period=2025"],
    [InsightsPage, { period: "2025-12" }, "/analysis/reviews?view=monthly&period=2025-12"],
    [CheckinPage, { period: "2025-12-29" }, "/analysis/reviews/checkin?view=weekly&period=2025-12-29"],
  ] as const;
  for (const [page, params, destination] of cases) {
    await assert.rejects(() => page({ searchParams: Promise.resolve(params) }), (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.ok(String(error.digest).includes(`;${destination};`));
      return true;
    });
  }
});

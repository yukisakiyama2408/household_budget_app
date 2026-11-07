import { analysisWeekStart, resolveAnalysisSelection, validAnalysisDate, type AnalysisSelection } from "./analysis-navigation";
import { getJapanToday, getWeeksOfMonth } from "./dateUtils";
import { normalizeMonth } from "./fixed-expense-navigation";

export type BudgetNavigationContext = Record<string, string | string[] | undefined>;
export type BudgetSelection = AnalysisSelection & { view: "monthly" | "weekly"; year: number; month: number; displayMonth: string; weekStart: string };

/** Period controls the actual interval; month only controls the weekly month picker. */
export function resolveBudgetSelection(params: BudgetNavigationContext = {}, today = getJapanToday().date): BudgetSelection {
  const view = params.view === "weekly" ? "weekly" : "monthly";
  const legacyMonth = typeof params.year === "string" && /^(?!0000)\d{4}$/.test(params.year) && typeof params.month === "string" && /^(0?[1-9]|1[0-2])$/.test(params.month)
    ? `${params.year}-${params.month.padStart(2, "0")}` : undefined;
  const month = normalizeMonth(params.month) ?? legacyMonth;
  let selection: AnalysisSelection;
  if (view === "weekly") {
    const supplied = validAnalysisDate(params.period) ? params.period : validAnalysisDate(params.weekStart) ? params.weekStart : undefined;
    const weeks = month ? getWeeksOfMonth(Number(month.slice(0, 4)), Number(month.slice(5))) : [];
    const period = supplied ?? weeks.find((week) => week.start === analysisWeekStart(today))?.start ?? weeks[0]?.start ?? today;
    selection = resolveAnalysisSelection({ view, period }, "stats", today);
  } else {
    selection = resolveAnalysisSelection({ view, period: normalizeMonth(params.period) ?? month, year: params.year }, "stats", today);
  }
  const proposedMonth = view === "weekly" ? month : undefined;
  const displayMonth = proposedMonth && selection.dateFrom.slice(0, 7) <= proposedMonth && proposedMonth <= selection.dateTo.slice(0, 7) ? proposedMonth : selection.period.slice(0, 7);
  return { ...selection, view, year: Number(displayMonth.slice(0, 4)), month: Number(displayMonth.slice(5)), displayMonth, weekStart: view === "weekly" ? selection.period : analysisWeekStart(selection.dateFrom) };
}

export function budgetSectionHref(section: "budget" | "goals", context: BudgetNavigationContext = {}): string {
  const path = section === "goals" ? "/budget/goals" : "/budget";
  if (!Object.keys(context).length) return path;
  const selection = resolveBudgetSelection(context);
  const params = new URLSearchParams({ view: selection.view, period: selection.period });
  if (selection.view === "weekly") params.set("month", selection.displayMonth);
  return `${path}?${params}`;
}

export function budgetHrefForAnalysis(selection: AnalysisSelection): string {
  return budgetSectionHref("budget", { view: selection.view === "weekly" ? "weekly" : "monthly", period: selection.view === "weekly" ? selection.period : selection.dateFrom.slice(0, 7) });
}

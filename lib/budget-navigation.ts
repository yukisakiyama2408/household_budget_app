export type BudgetNavigationContext = {
  year?: string | string[];
  month?: string | string[];
  view?: string | string[];
  weekStart?: string | string[];
};

/** Keep the selected budget period when entering and leaving goal management. */
export function budgetSectionHref(section: "budget" | "goals", context: BudgetNavigationContext = {}): string {
  const params = new URLSearchParams();
  if (typeof context.year === "string" && /^(?!0000)\d{4}$/.test(context.year)) params.set("year", context.year);
  if (typeof context.month === "string" && /^(0?[1-9]|1[0-2])$/.test(context.month)) params.set("month", String(Number(context.month)));
  if (context.view === "weekly") {
    params.set("view", "weekly");
    if (typeof context.weekStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(context.weekStart)) {
      const date = new Date(`${context.weekStart}T00:00:00Z`);
      if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === context.weekStart && date.getUTCDay() === 1) {
        params.set("weekStart", context.weekStart);
      }
    }
  }
  const path = section === "goals" ? "/budget/goals" : "/budget";
  return params.size ? `${path}?${params}` : path;
}

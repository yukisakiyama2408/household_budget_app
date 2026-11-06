export const FIXED_EXPENSES_PATH = "/transactions/fixed";

export function normalizeMonth(value: unknown): string | undefined {
  return typeof value === "string" && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : undefined;
}

export function fixedExpensesHref(month?: string): string {
  const validMonth = normalizeMonth(month);
  return validMonth ? `${FIXED_EXPENSES_PATH}?month=${validMonth}` : FIXED_EXPENSES_PATH;
}

/** Only the fixed-expense list and its validated month may be used as a return URL. */
export function fixedExpensesReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith(`${FIXED_EXPENSES_PATH}?`)) {
    return FIXED_EXPENSES_PATH;
  }
  const params = new URLSearchParams(value.slice(FIXED_EXPENSES_PATH.length + 1));
  return fixedExpensesHref(params.get("month") ?? undefined);
}

/** Accept both the old budget year/month pair and the new YYYY-MM month. */
export function legacyFixedExpenseMonth(year: unknown, month: unknown): string | undefined {
  const validMonth = normalizeMonth(month);
  if (validMonth) return validMonth;
  if (typeof year !== "string" || typeof month !== "string" || !/^\d{1,2}$/.test(month)) return;
  return normalizeMonth(`${year}-${month.padStart(2, "0")}`);
}

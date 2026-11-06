import { normalizeMonth } from "../fixed-expense-navigation";

export type TransactionSearchParams = Record<string, string | string[] | undefined>;
export type TransactionFiltersValue = {
  months: string[];
  types: string[];
  categoryIds: string[];
  payMethods: string[];
  needs: string[];
  q: string;
  dateFrom?: string;
  dateTo?: string;
};

function validDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseTransactionFilters(input: TransactionSearchParams | URLSearchParams): TransactionFiltersValue {
  const values = (key: string) => {
    const value = input instanceof URLSearchParams ? input.getAll(key) : input[key];
    return [...new Set((Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")))];
  };
  const single = (key: string) => input instanceof URLSearchParams ? input.get(key) ?? undefined : Array.isArray(input[key]) ? input[key][0] : input[key];
  const dateFrom = single("dateFrom");
  const dateTo = single("dateTo");
  const validRange = validDate(dateFrom) && validDate(dateTo) && dateFrom <= dateTo;
  return {
    months: values("month").filter((value) => normalizeMonth(value)).sort(),
    types: values("type").filter((value) => ["income", "expense"].includes(value)).sort(),
    categoryIds: values("category_id").filter((value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))).sort(),
    payMethods: values("pay_method").filter((value) => ["Cash", "Credit"].includes(value)).sort(),
    needs: values("needs").filter((value) => ["category", "store"].includes(value)).sort(),
    q: (single("q") ?? "").trim().slice(0, 200),
    ...(validRange ? { dateFrom, dateTo } : {}),
  };
}

export function transactionFilterParams(filters: TransactionFiltersValue): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, values] of [
    ["month", filters.months], ["type", filters.types], ["category_id", filters.categoryIds],
    ["pay_method", filters.payMethods], ["needs", filters.needs],
  ] as const) {
    for (const value of values) params.append(key, value);
  }
  if (filters.q) params.set("q", filters.q);
  if (filters.dateFrom && filters.dateTo) {
    params.set("dateFrom", filters.dateFrom);
    params.set("dateTo", filters.dateTo);
  }
  return params;
}

export function transactionMonthOptions(bounds: { earliest: string; latest: string } | null, selected: string[]): string[] {
  const months = new Set(selected);
  if (bounds) {
    const [firstYear, firstMonth] = bounds.earliest.split("-").map(Number);
    const [lastYear, lastMonth] = bounds.latest.split("-").map(Number);
    for (let index = lastYear * 12 + lastMonth - 1; index >= firstYear * 12 + firstMonth - 1; index--) {
      months.add(`${String(Math.floor(index / 12)).padStart(4, "0")}-${String(index % 12 + 1).padStart(2, "0")}`);
    }
  }
  return [...months].sort().reverse();
}

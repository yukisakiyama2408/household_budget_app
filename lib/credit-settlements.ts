import { normalizeMonth } from "./fixed-expense-navigation";

export const CREDIT_SETTLEMENTS_PATH = "/transactions/settlements";

export function creditSettlementsHref(month?: string): string {
  const validMonth = normalizeMonth(month);
  return validMonth ? `${CREDIT_SETTLEMENTS_PATH}?month=${validMonth}` : CREDIT_SETTLEMENTS_PATH;
}

export function validateCreditSettlement(year: number, month: number, amount: number, date: string): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("対象月が不正です。");
  }
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("金額は0以上の整数で入力してください。");
  }
  const targetMonth = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("正しい引落日を入力してください。");
  }
  if (!date.startsWith(`${targetMonth}-`)) {
    throw new Error("引落日は対象月内の日付を選択してください。");
  }
}

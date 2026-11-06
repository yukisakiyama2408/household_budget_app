import { createClient } from "@/utils/supabase/server";
import type { TransactionWithCategory } from "@/types/database";
import type { TransactionFiltersValue } from "./filters";

export const TRANSACTION_PAGE_SIZE = 50;
export type TransactionCursor = { date: string; createdAt: string; id: number };
export type TransactionPage = { transactions: TransactionWithCategory[]; nextCursor: TransactionCursor | null };

export function validateTransactionCursor(cursor: unknown): TransactionCursor {
  if (!cursor || typeof cursor !== "object") throw new Error("読み込み位置が不正です。");
  const { date, createdAt, id } = cursor as TransactionCursor;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || typeof createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(createdAt)
    || !Number.isFinite(Date.parse(createdAt)) || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error("読み込み位置が不正です。");
  }
  return { date, createdAt, id };
}

export async function getTransactionPage(filters: TransactionFiltersValue, cursor?: unknown): Promise<TransactionPage> {
  const position = cursor == null ? undefined : validateTransactionCursor(cursor);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) throw new Error("ログインしてから再度お試しください。");
  let query = supabase.from("transactions").select("*, categories(name, color)")
    .order("date", { ascending: false }).order("created_at", { ascending: false }).order("id", { ascending: false });
  const groups: string[] = [];
  if (filters.dateFrom && filters.dateTo) {
    query = query.gte("date", filters.dateFrom).lte("date", filters.dateTo);
  } else if (filters.months.length) {
    groups.push(filters.months.map((month) => {
      const [year, number] = month.split("-").map(Number);
      const next = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, "0")}`;
      return `and(date.gte.${month}-01,date.lt.${next}-01)`;
    }).join(","));
  }
  if (filters.types.length) query = query.in("type", filters.types);
  if (filters.categoryIds.length) query = query.in("category_id", filters.categoryIds.map(Number));
  if (filters.payMethods.length) query = query.in("pay_method", filters.payMethods);
  if (filters.needs.length) {
    groups.push(filters.needs.map((need) => need === "category" ? "category_id.is.null" : "and(store.is.null,type.eq.expense)").join(","));
  }
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    groups.push(`content.ilike."${pattern}",store.ilike."${pattern}"`);
  }
  if (position) {
    const { date, createdAt, id } = position;
    groups.push(`date.lt.${date},and(date.eq.${date},created_at.lt.${createdAt}),and(date.eq.${date},created_at.eq.${createdAt},id.lt.${id})`);
  }
  if (groups.length) query = query.or(`and(${groups.map((group) => `or(${group})`).join(",")})`);
  const { data, error } = await query.limit(TRANSACTION_PAGE_SIZE + 1);
  if (error) throw new Error("取引を読み込めませんでした。もう一度お試しください。");
  const rows = (data ?? []) as TransactionWithCategory[];
  const transactions = rows.slice(0, TRANSACTION_PAGE_SIZE);
  const last = transactions.at(-1);
  return {
    transactions,
    nextCursor: rows.length > TRANSACTION_PAGE_SIZE && last ? { date: last.date, createdAt: last.created_at, id: last.id } : null,
  };
}

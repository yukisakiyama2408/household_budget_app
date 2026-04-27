import { createClient } from "@/utils/supabase/server";
import type { Category, Transaction } from "@/types/database";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getTransactions({
  month,
  type,
  categoryId,
}: {
  month?: string;
  type?: string;
  categoryId?: string;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end =
      m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    query = query.gte("date", start).lt("date", end);
  }
  if (type && (type === "income" || type === "expense")) {
    query = query.eq("type", type);
  }
  if (categoryId) {
    query = query.eq("category_id", parseInt(categoryId));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TransactionWithCategory[];
}

export async function getTransactionById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Transaction;
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function getMonthlySummary(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", start)
    .lt("date", end);

  if (error) throw error;

  const rows = (data ?? []) as Transaction[];
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

type TransactionWithCategory = Transaction & {
  categories: { name: string; color: string | null } | null;
};

export async function getCategoryBreakdown(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .eq("type", "expense")
    .gte("date", start)
    .lt("date", end);

  if (error) throw error;

  const rows = (data ?? []) as TransactionWithCategory[];
  const map = new Map<string, { amount: number; color: string }>();

  for (const t of rows) {
    const name = t.categories?.name ?? "その他";
    const color = t.categories?.color ?? "#B3B3B3";
    const prev = map.get(name) ?? { amount: 0, color };
    map.set(name, { amount: prev.amount + t.amount, color });
  }

  return Array.from(map.entries())
    .map(([name, { amount, color }]) => ({ name, amount, color }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getYearlyTrend(year: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", `${year}-01-01`)
    .lt("date", `${year + 1}-01-01`)
    .order("date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as Transaction[];
  const map = new Map<string, { income: number; expense: number }>();

  // 1〜12月分を初期化（データなしの月も表示するため）
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    map.set(key, { income: 0, expense: 0 });
  }

  for (const t of rows) {
    const key = t.date.slice(0, 7);
    const prev = map.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") prev.income += t.amount;
    else prev.expense += t.amount;
    map.set(key, prev);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => ({ month, income, expense }));
}

export async function getYearlySummary(year: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", `${year}-01-01`)
    .lt("date", `${year + 1}-01-01`);

  if (error) throw error;

  const rows = (data ?? []) as Transaction[];
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

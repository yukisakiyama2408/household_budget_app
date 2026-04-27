import { createClient } from "@/utils/supabase/server";
import type { Transaction } from "@/types/database";

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

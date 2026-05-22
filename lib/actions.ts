"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { applyFixedExpenses } from "@/lib/fixed-expenses";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const categoryId = formData.get("category_id") as string;
  const amount = formData.get("amount") as string;
  const payMethod = formData.get("pay_method") as string;
  const store = formData.get("store") as string;

  const { error } = await supabase.from("transactions").insert({
    date,
    content,
    type,
    category_id: categoryId ? parseInt(categoryId) : null,
    amount: parseInt(amount),
    pay_method: payMethod || null,
    store: store || null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function updateTransaction(id: number, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const categoryId = formData.get("category_id") as string;
  const amount = formData.get("amount") as string;
  const payMethod = formData.get("pay_method") as string;
  const store = formData.get("store") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any)
    .update({
      date,
      content,
      type,
      category_id: categoryId ? parseInt(categoryId) : null,
      amount: parseInt(amount),
      pay_method: payMethod || null,
      store: store || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function deleteTransaction(id: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function upsertYearlyBudget(year: number, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("yearly_budgets") as any)
    .upsert({ year, amount }, { onConflict: "year" });

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
}

export async function upsertBudget(year: number, month: number, categoryId: number, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("budgets") as any)
    .upsert({ year, month, category_id: categoryId, amount }, { onConflict: "year,month,category_id" });

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
}

export async function upsertWeeklyBudget(weekStart: string, categoryId: number, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("weekly_budgets") as any)
    .upsert({ week_start: weekStart, category_id: categoryId, amount }, { onConflict: "week_start,category_id" });

  if (error && error.code !== "42P01") throw new Error(error.message);

  revalidatePath("/budget");
}

export async function upsertMonthlyTotalBudget(year: number, month: number, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("monthly_total_budgets") as any)
    .upsert({ year, month, amount }, { onConflict: "year,month" });

  if (error && error.code !== "42P01") throw new Error(error.message);

  revalidatePath("/budget");
}

export async function upsertWeeklyTotalBudget(weekStart: string, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("weekly_total_budgets") as any)
    .upsert({ week_start: weekStart, amount }, { onConflict: "week_start" });

  if (error && error.code !== "42P01") throw new Error(error.message);

  revalidatePath("/budget");
}

export async function upsertCreditSettlement(year: number, month: number, amount: number, settlementDate: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_settlements") as any)
    .upsert({ year, month, amount, settlement_date: settlementDate }, { onConflict: "year,month" });

  if (error) throw new Error(error.message);

  revalidatePath("/daily");
}

export async function createFixedExpense(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const amount = formData.get("amount") as string;
  const categoryId = formData.get("category_id") as string;
  const payMethod = formData.get("pay_method") as string;
  const store = formData.get("store") as string;
  const dayOfMonth = formData.get("day_of_month") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("fixed_expenses") as any).insert({
    name,
    type,
    amount: parseInt(amount),
    category_id: categoryId ? parseInt(categoryId) : null,
    pay_method: payMethod || null,
    store: store || null,
    day_of_month: parseInt(dayOfMonth),
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/fixed");
  redirect("/fixed");
}

export async function updateFixedExpense(id: number, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const amount = formData.get("amount") as string;
  const categoryId = formData.get("category_id") as string;
  const payMethod = formData.get("pay_method") as string;
  const store = formData.get("store") as string;
  const dayOfMonth = formData.get("day_of_month") as string;
  const isActive = formData.get("is_active") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("fixed_expenses") as any)
    .update({
      name,
      type,
      amount: parseInt(amount),
      category_id: categoryId ? parseInt(categoryId) : null,
      pay_method: payMethod || null,
      store: store || null,
      day_of_month: parseInt(dayOfMonth),
      is_active: isActive === "true",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/fixed");
  redirect("/fixed");
}

export async function deleteFixedExpense(id: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("fixed_expenses")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/fixed");
  redirect("/fixed");
}

export async function fetchTransactionsForDuplicateCheck(
  startDate: string,
  endDate: string
): Promise<{ date: string; amount: number; store: string | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, store")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw new Error(error.message);
  return (data ?? []) as { date: string; amount: number; store: string | null }[];
}

export async function importTransactions(
  records: {
    date: string;
    content: string;
    amount: number;
    type: "income" | "expense";
    category_id: number | null;
    pay_method: "Cash" | "Credit" | null;
    store: string | null;
  }[]
): Promise<{ imported: number }> {
  const supabase = await createClient();

  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("transactions").insert(batch as any);
    if (error) throw new Error(error.message);
    imported += batch.length;
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  return { imported };
}

export type RecentTransaction = {
  id: number;
  date: string;
  content: string;
  amount: number;
  type: string;
  category_name: string | null;
  category_color: string | null;
};

export async function fetchRecentTransactions(limit = 5, payMethod?: "Cash" | "Credit"): Promise<RecentTransaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("id, date, content, amount, type, categories(name, color)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (payMethod) query = query.eq("pay_method", payMethod);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((t) => ({
    id: t.id,
    date: t.date,
    content: t.content,
    amount: t.amount,
    type: t.type,
    category_name: t.categories?.name ?? null,
    category_color: t.categories?.color ?? null,
  }));
}

export async function fetchCategoryByStores(
  stores: string[]
): Promise<Record<string, number | null>> {
  if (stores.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("store, category_id")
    .in("store", stores)
    .not("category_id", "is", null);
  if (error) throw new Error(error.message);

  const countMap = new Map<string, Map<number, number>>();
  for (const row of (data ?? []) as { store: string; category_id: number }[]) {
    if (!row.store || row.category_id == null) continue;
    const inner = countMap.get(row.store) ?? new Map<number, number>();
    inner.set(row.category_id, (inner.get(row.category_id) ?? 0) + 1);
    countMap.set(row.store, inner);
  }

  const result: Record<string, number | null> = {};
  for (const store of stores) {
    const inner = countMap.get(store);
    if (!inner) { result[store] = null; continue; }
    let best: number | null = null;
    let max = 0;
    for (const [catId, count] of inner) {
      if (count > max) { max = count; best = catId; }
    }
    result[store] = best;
  }
  return result;
}

export async function applyFixedExpensesAction(
  year: number,
  month: number
): Promise<{ applied: number; skipped: number }> {
  const result = await applyFixedExpenses(year, month);
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/fixed");
  return result;
}


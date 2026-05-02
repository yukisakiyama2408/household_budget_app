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

export async function upsertCreditSettlement(year: number, month: number, amount: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_settlements") as any)
    .upsert({ year, month, amount }, { onConflict: "year,month" });

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


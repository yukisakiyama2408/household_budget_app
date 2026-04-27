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
  const startYear = parseInt(formData.get("start_year") as string);
  const startMonth = parseInt(formData.get("start_month") as string);
  const endYearRaw = formData.get("end_year") as string;
  const endMonthRaw = formData.get("end_month") as string;
  const endYear = endYearRaw ? parseInt(endYearRaw) : null;
  const endMonth = endMonthRaw ? parseInt(endMonthRaw) : null;

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
    start_year: startYear,
    start_month: startMonth,
    end_year: endYear,
    end_month: endMonth,
  });

  if (error) throw new Error(error.message);

  // 登録時点で start_month から現在月まで自動適用
  const now = new Date();
  const currentYM = now.getFullYear() * 100 + (now.getMonth() + 1);
  const endYM = endYear && endMonth
    ? Math.min(endYear * 100 + endMonth, currentYM)
    : currentYM;

  let ym = startYear * 100 + startMonth;
  while (ym <= endYM) {
    const y = Math.floor(ym / 100);
    const m = ym % 100;
    try {
      await applyFixedExpenses(y, m);
    } catch (e) {
      console.error(`applyFixedExpenses(${y}, ${m}) failed:`, e);
    }
    ym = m === 12 ? (y + 1) * 100 + 1 : y * 100 + (m + 1);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
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
  const startYear = formData.get("start_year") as string;
  const startMonth = formData.get("start_month") as string;
  const endYear = formData.get("end_year") as string;
  const endMonth = formData.get("end_month") as string;

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
      start_year: parseInt(startYear),
      start_month: parseInt(startMonth),
      end_year: endYear ? parseInt(endYear) : null,
      end_month: endMonth ? parseInt(endMonth) : null,
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


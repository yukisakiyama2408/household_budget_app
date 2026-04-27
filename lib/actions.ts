"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

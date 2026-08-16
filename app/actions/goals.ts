"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentBalance } from "@/lib/data";

function goalValues(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount"));
  const deadline = String(formData.get("deadline") ?? "") || null;
  const rawCategoryId = String(formData.get("category_id") ?? "");
  const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
  if (!(["savings", "expense"].includes(type)) || !title || !Number.isInteger(targetAmount) || targetAmount <= 0) {
    throw new Error("目標の入力内容が不正です。");
  }
  if (type === "expense" && (!Number.isInteger(categoryId) || Number(categoryId) <= 0)) {
    throw new Error("支出カテゴリを選択してください。");
  }
  return { type, title, targetAmount, deadline, categoryId };
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { type, title, targetAmount, deadline, categoryId } = goalValues(formData);
  const startBalance = type === "savings" ? await getCurrentBalance() : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).insert({
    title,
    type,
    target_amount: targetAmount,
    deadline,
    category_id: categoryId,
    start_balance: startBalance,
    is_active: true,
  });
  if (error) throw error;
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateGoal(id: number, formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount"));
  const deadline = String(formData.get("deadline") ?? "") || null;
  const rawCategoryId = String(formData.get("category_id") ?? "");
  const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
  if (!title || !Number.isInteger(targetAmount) || targetAmount <= 0) throw new Error("目標の入力内容が不正です。");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .update({ title, target_amount: targetAmount, deadline, category_id: categoryId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/goals");
  revalidatePath("/");
}

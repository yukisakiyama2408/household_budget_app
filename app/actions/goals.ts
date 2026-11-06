"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { GoalType } from "@/types/database";

function goalValues(formData: FormData) {
  const type = String(formData.get("type") ?? "") as GoalType;
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount"));
  const savedAmount = type === "savings" ? Number(formData.get("saved_amount") ?? 0) : 0;
  const deadline = String(formData.get("deadline") ?? "") || null;
  const rawCategoryId = String(formData.get("category_id") ?? "");
  const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
  if (!(["savings", "expense"] satisfies GoalType[]).includes(type) || !title || !Number.isInteger(targetAmount) || targetAmount <= 0) {
    throw new Error("目標の入力内容が不正です。");
  }
  if (!Number.isInteger(savedAmount) || savedAmount < 0) {
    throw new Error("現在の貯蓄額を正しく入力してください。");
  }
  if (type === "expense" && (!Number.isInteger(categoryId) || Number(categoryId) <= 0)) {
    throw new Error("支出カテゴリを選択してください。");
  }
  return { type, title, targetAmount, savedAmount, deadline, categoryId };
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { type, title, targetAmount, savedAmount, deadline, categoryId } = goalValues(formData);
  // Supabase's hand-written schema type cannot infer mutations for this related table.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).insert({
    title,
    type,
    target_amount: targetAmount,
    saved_amount: savedAmount,
    deadline,
    category_id: categoryId,
    start_balance: 0,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget/goals");
  revalidatePath("/");
}

export async function updateGoal(id: number, formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount"));
  const rawSavedAmount = formData.get("saved_amount");
  const savedAmount = rawSavedAmount == null ? undefined : Number(rawSavedAmount);
  const deadline = String(formData.get("deadline") ?? "") || null;
  const rawCategoryId = String(formData.get("category_id") ?? "");
  const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
  if (!title || !Number.isInteger(targetAmount) || targetAmount <= 0) throw new Error("目標の入力内容が不正です。");
  if (savedAmount !== undefined && (!Number.isInteger(savedAmount) || savedAmount < 0)) throw new Error("現在の貯蓄額を正しく入力してください。");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .update({ title, target_amount: targetAmount, ...(savedAmount !== undefined ? { saved_amount: savedAmount } : {}), deadline, category_id: categoryId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget/goals");
  revalidatePath("/");
}

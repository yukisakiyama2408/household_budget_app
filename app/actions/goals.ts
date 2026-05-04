"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const type = formData.get("type") as string;
  const title = (formData.get("title") as string).trim();
  const targetAmount = parseInt(formData.get("target_amount") as string);
  const deadline = (formData.get("deadline") as string) || null;
  const rawCategoryId = formData.get("category_id") as string;
  const categoryId = rawCategoryId ? parseInt(rawCategoryId) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).insert({
    title,
    type,
    target_amount: targetAmount,
    deadline,
    category_id: categoryId,
  });
  if (error) throw error;
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function updateGoal(id: number, formData: FormData) {
  const supabase = await createClient();
  const title = (formData.get("title") as string).trim();
  const targetAmount = parseInt(formData.get("target_amount") as string);
  const deadline = (formData.get("deadline") as string) || null;
  const rawCategoryId = formData.get("category_id") as string;
  const categoryId = rawCategoryId ? parseInt(rawCategoryId) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .update({ title, target_amount: targetAmount, deadline, category_id: categoryId })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/budget");
  revalidatePath("/");
}

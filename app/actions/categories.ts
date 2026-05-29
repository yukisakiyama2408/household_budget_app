"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string).trim();
  const type = formData.get("type") as string;
  const color = (formData.get("color") as string) || null;
  const offsetRaw = formData.get("offset_category_id") as string | null;
  const offset_category_id = offsetRaw ? parseInt(offsetRaw) : null;

  const { data: existing } = await supabase.from("categories").select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = existing && existing.length > 0 ? (existing[0] as { display_order: number }).display_order + 1 : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).insert({ name, type, color, display_order: nextOrder, offset_category_id });
  if (error) throw error;
  revalidatePath("/budget");
}

export async function updateCategory(id: number, formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string).trim();
  const type = formData.get("type") as string;
  const color = (formData.get("color") as string) || null;
  const offsetRaw = formData.get("offset_category_id") as string | null;
  const offset_category_id = offsetRaw ? parseInt(offsetRaw) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).update({ name, type, color, offset_category_id }).eq("id", id);
  if (error) throw error;
  revalidatePath("/budget");
  revalidatePath("/transactions");
}

export async function deleteCategory(id: number) {
  const supabase = await createClient();

  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count && count > 0) throw new Error(`このカテゴリには${count}件の取引があるため削除できません`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/budget");
  revalidatePath("/transactions");
}

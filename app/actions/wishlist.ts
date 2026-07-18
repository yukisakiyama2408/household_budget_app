"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { WishlistItem, WishlistPriority } from "@/types/database";

const priorities: WishlistPriority[] = ["", "next", "high", "medium", "low"];

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("ログインが必要です。");
  return supabase;
}

function parseWishlistForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("price"));
  const url = String(formData.get("url") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const rawPriority = String(formData.get("priority") ?? "");
  const priority = priorities.includes(rawPriority as WishlistPriority)
    ? rawPriority as WishlistPriority
    : "";

  if (!title || title.length > 120) throw new Error("タイトルは1〜120文字で入力してください。");
  if (!Number.isInteger(price) || price <= 0) throw new Error("金額を正しく入力してください。");
  if (!/^https?:\/\//i.test(url) || url.length > 2000) throw new Error("URLを正しく入力してください。");
  if (memo.length > 300) throw new Error("メモは300文字以内で入力してください。");

  return { title, price, url, memo, priority };
}

function revalidateWishlist() {
  revalidatePath("/wishlist");
  revalidatePath("/");
}

export async function createWishlistItem(formData: FormData) {
  const values = parseWishlistForm(formData);
  const supabase = await authenticatedClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("wishlist_items") as any)
    .insert(values)
    .select("*")
    .single();
  if (error) throw error;
  revalidateWishlist();
  return data as WishlistItem;
}

export async function updateWishlistItem(id: number, formData: FormData) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("IDが不正です。");
  const values = parseWishlistForm(formData);
  const supabase = await authenticatedClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("wishlist_items") as any)
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("purchased_at", null)
    .select("*")
    .single();
  if (error) throw error;
  revalidateWishlist();
  return data as WishlistItem;
}

export async function markWishlistItemPurchased(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("IDが不正です。");
  const supabase = await authenticatedClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("wishlist_items") as any)
    .update({ purchased_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidateWishlist();
}

export async function restoreWishlistItem(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("IDが不正です。");
  const supabase = await authenticatedClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("wishlist_items") as any)
    .update({ purchased_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidateWishlist();
}

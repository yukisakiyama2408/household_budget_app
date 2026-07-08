"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { FeatureRequestCategory } from "@/types/database";

const allowedCategories: FeatureRequestCategory[] = [
  "収支入力",
  "予算",
  "分析",
  "通知",
  "インポート",
  "設定",
  "その他",
];

export type FeatureRequestActionState = {
  ok: boolean;
  message: string;
  title?: string;
};

export async function createFeatureRequest(formData: FormData): Promise<FeatureRequestActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "").trim();
  const category = allowedCategories.includes(rawCategory as FeatureRequestCategory)
    ? rawCategory
    : "その他";

  if (!title) {
    return { ok: false, message: "タイトルを入力してください。" };
  }

  if (title.length > 120) {
    return { ok: false, message: "タイトルは120文字以内で入力してください。" };
  }

  if (detail.length > 1000) {
    return { ok: false, message: "困っていることは1000文字以内で入力してください。" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("feature_requests") as any).insert({
    title,
    detail,
    category,
    status: "検討中",
    votes: 1,
    created_by: "あなた",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/feature-requests");
  return { ok: true, message: "改善要望を送信しました。", title };
}

export async function voteFeatureRequest(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)("increment_feature_request_votes", {
    request_id: id,
  });

  if (error) throw error;
  revalidatePath("/feature-requests");
}

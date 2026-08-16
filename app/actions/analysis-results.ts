"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { AnalysisView } from "@/types/database";

const allowedViews: AnalysisView[] = ["monthly", "weekly", "yearly"];

export type AnalysisResultActionState = { ok: boolean; message: string };

export async function createAnalysisResult(
  _previousState: AnalysisResultActionState,
  formData: FormData
): Promise<AnalysisResultActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rawAdvices = String(formData.get("advices") ?? "");
  const analysisView = String(formData.get("analysisView") ?? "") as AnalysisView;
  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const dateFrom = String(formData.get("dateFrom") ?? "");
  const dateTo = String(formData.get("dateTo") ?? "");
  const advices = rawAdvices.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (!title || !content) return { ok: false, message: "タイトルと分析結果を入力してください。" };
  if (title.length > 120) return { ok: false, message: "タイトルは120文字以内で入力してください。" };
  if (content.length > 10000) return { ok: false, message: "分析結果は10000文字以内で入力してください。" };
  if (advices.length > 20 || advices.some((advice) => advice.length > 500)) {
    return { ok: false, message: "アドバイスは20件以内、1件500文字以内で入力してください。" };
  }
  if (!allowedViews.includes(analysisView) || !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo) || dateFrom > dateTo) {
    return { ok: false, message: "分析対象期間が不正です。" };
  }

  const supabase = await createClient();
  // 手書きのDatabase型ではSupabaseのリレーション推論が効かないため、実行時型を利用する。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysisResults = supabase.from("analysis_results") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysisAdvices = supabase.from("analysis_advices") as any;
  const { data: result, error } = await analysisResults
    .insert({ title, content, analysis_view: analysisView, period_label: periodLabel, date_from: dateFrom, date_to: dateTo })
    .select("id")
    .single() as { data: { id: number } | null; error: { message: string } | null };
  if (error) return { ok: false, message: error.message };
  if (!result) return { ok: false, message: "分析結果を登録できませんでした。" };

  if (advices.length > 0) {
    const { error: adviceError } = await analysisAdvices.insert(
      advices.map((advice, index) => ({
        analysis_result_id: result.id,
        content: advice,
        is_completed: false,
        display_order: index,
      }))
    );
    if (adviceError) {
      await analysisResults.delete().eq("id", result.id);
      return { ok: false, message: adviceError.message };
    }
  }

  revalidatePath("/monthly");
  return { ok: true, message: "分析結果を登録しました。" };
}

export async function toggleAnalysisAdvice(id: number, completed: boolean): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) throw new Error("アドバイスが不正です。");
  const supabase = await createClient();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("analysis_advices") as any).update({
    is_completed: completed,
    completed_at: completed ? now : null,
    updated_at: now,
  }).eq("id", id);
  if (error) throw error;
  revalidatePath("/monthly");
}

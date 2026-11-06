"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { analysisWeekStart, validAnalysisDate } from "@/lib/analysis-navigation";

export async function recordCheckin(weekStart: string) {
  if (!validAnalysisDate(weekStart) || analysisWeekStart(weekStart) !== weekStart) throw new Error("対象週が不正です。");
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("check_ins") as any).upsert(
    { week_start: weekStart },
    { onConflict: "week_start" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/analysis/reviews/checkin");
  revalidatePath("/analysis/reviews");
}

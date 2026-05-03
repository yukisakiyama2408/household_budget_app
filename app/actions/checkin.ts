"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordCheckin(weekStart: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("check_ins") as any).upsert(
    { week_start: weekStart },
    { onConflict: "week_start" }
  );
  if (error && error.code !== "42P01") throw error;
  revalidatePath("/");
  revalidatePath("/checkin");
}

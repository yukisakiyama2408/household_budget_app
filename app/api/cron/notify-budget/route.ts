import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCurrentWeekStart } from "@/lib/dateUtils";

export async function GET(request: Request) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dayOfMonth = now.getDate();
  const dayOfWeek = now.getDay(); // 0=日, 1=月
  const isMonthStart = dayOfMonth === 1;
  const isWeekStart = dayOfWeek === 1;

  if (!isMonthStart && !isWeekStart) {
    return NextResponse.json({ sent: 0, reason: "not a notification day" });
  }

  const weekStart = getCurrentWeekStart();
  const supabase = createAdminClient();
  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  weekStartDate.setDate(weekStartDate.getDate() + 6);
  const weekEnd = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, "0")}-${String(weekStartDate.getDate()).padStart(2, "0")}`;
  const [monthlyResult, weeklyResult] = await Promise.all([
    isMonthStart
      ? supabase.from("budgets").select("id").eq("year", year).eq("month", month).limit(1)
      : Promise.resolve({ data: [{}], error: null }),
    isWeekStart
      ? (supabase.from("weekly_budget_periods") as any)
          .select("category_id")
          .gte("period_start", weekStart)
          .lte("period_end", weekEnd)
          .limit(1)
      : Promise.resolve({ data: [{}], error: null }),
  ]);
  if (monthlyResult.error || weeklyResult.error) {
    return NextResponse.json(
      { error: monthlyResult.error?.message ?? weeklyResult.error?.message },
      { status: 500 }
    );
  }
  const monthlyOk = (monthlyResult.data ?? []).length > 0;
  const weeklyOk = (weeklyResult.data ?? []).length > 0;

  const notifications: { title: string; body: string; url: string }[] = [];
  if (isMonthStart && !monthlyOk) {
    notifications.push({
      title: "月次予算が未設定です",
      body: `${year}年${month}月の予算がまだ登録されていません`,
      url: "/budget",
    });
  }
  if (isWeekStart && !weeklyOk) {
    notifications.push({
      title: "週次予算が未設定です",
      body: "今週の週次予算がまだ登録されていません",
      url: "/budget?view=weekly",
    });
  }

  if (notifications.length === 0) {
    return NextResponse.json({ sent: 0, reason: "all budgets registered" });
  }

  type PushSub = { endpoint: string; p256dh: string; auth: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubs, error } = await (supabase.from("push_subscriptions") as any)
    .select("endpoint, p256dh, auth");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const subs = (rawSubs ?? []) as PushSub[];
  if (subs.length === 0) return NextResponse.json({ sent: 0, reason: "no subscriptions" });

  let sent = 0;
  const expired: string[] = [];

  for (const sub of subs) {
    for (const notif of notifications) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(notif)
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expired.push(sub.endpoint);
        }
      }
    }
  }

  // 失効したサブスクリプションを削除
  if (expired.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("push_subscriptions") as any).delete().in("endpoint", expired);
  }

  return NextResponse.json({ sent, expired: expired.length });
}

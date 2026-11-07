import { hasMonthlyBudget, hasWeeklyBudget } from "@/lib/data";
import { getCurrentWeekStart, getJapanToday } from "@/lib/dateUtils";
import Nav from "./Nav";
import { createClient } from "@/utils/supabase/server";

export default async function NavWrapper({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return children;

  const { year, month } = getJapanToday();
  const weekStart = getCurrentWeekStart();

  const [monthlyRegistered, weeklyRegistered] = await Promise.all([
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(weekStart),
  ]);

  const alertCount = (monthlyRegistered ? 0 : 1) + (weeklyRegistered ? 0 : 1);

  return (
    <div className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] lg:pb-0 lg:pl-56">
      <a href="#page-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[110] focus:rounded focus:bg-white focus:p-3">本文へ移動</a>
      <Nav alertCount={alertCount} />
      <div id="page-content" tabIndex={-1} className="min-w-0">{children}</div>
    </div>
  );
}

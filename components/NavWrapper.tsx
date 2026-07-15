import { getFeatureRequestSuggestions, hasMonthlyBudget, hasWeeklyBudget } from "@/lib/data";
import { getCurrentWeekStart } from "@/lib/dateUtils";
import Nav from "./Nav";
import { createClient } from "@/utils/supabase/server";

export default async function NavWrapper() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const weekStart = getCurrentWeekStart();

  const [monthlyRegistered, weeklyRegistered, featureRequestSuggestions] = await Promise.all([
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(weekStart),
    getFeatureRequestSuggestions(),
  ]);

  const alertCount = (monthlyRegistered ? 0 : 1) + (weeklyRegistered ? 0 : 1);

  return <Nav alertCount={alertCount} featureRequestSuggestions={featureRequestSuggestions} />;
}

import { hasMonthlyBudget, hasWeeklyBudget } from "@/lib/data";
import { getCurrentWeekStart } from "@/lib/dateUtils";
import Nav from "./Nav";

export default async function NavWrapper() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const weekStart = getCurrentWeekStart();

  const [monthlyRegistered, weeklyRegistered] = await Promise.all([
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(weekStart),
  ]);

  const alertCount = (monthlyRegistered ? 0 : 1) + (weeklyRegistered ? 0 : 1);

  return <Nav alertCount={alertCount} />;
}

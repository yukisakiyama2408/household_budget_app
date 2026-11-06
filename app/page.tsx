import NewEntryButton from "@/components/NewEntryButton";
import {
  getCurrentBalance,
  getBudgetData,
  getTransactions,
  getWeeklyBudgetData,
  hasMonthlyBudget,
  hasWeeklyBudget,
  getGoalsWithProgress,
} from "@/lib/data";
import BudgetAlertBanner from "@/components/home/BudgetAlertBanner";
import BalanceHeroCard from "@/components/home/BalanceHeroCard";
import BudgetTransactionsSection from "@/components/home/BudgetTransactionsSection";
import GoalHeroCard from "@/components/home/GoalHeroCard";
import { getJapanToday } from "@/lib/dateUtils";

const WEEKLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品"];
const MONTHLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];
const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

function getCurrentWeekBounds(date: string): { start: string; end: string; label: string } {
  const [year, month, dateOfMonth] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, dateOfMonth));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() + diff);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const fmtUtcDate = (value: Date) => value.toISOString().slice(0, 10);
  const startStr = fmtUtcDate(start);
  const endStr = fmtUtcDate(end);
  const [, sm, sd] = startStr.split("-");
  const [, em, ed] = endStr.split("-");
  const label =
    sm === em
      ? `${parseInt(sm)}/${parseInt(sd)}-${parseInt(ed)}`
      : `${parseInt(sm)}/${parseInt(sd)}-${parseInt(em)}/${parseInt(ed)}`;
  return { start: startStr, end: endStr, label };
}

export default async function HomePage() {
  const today = getJapanToday();
  const { year, month } = today;
  const dateLabel = `${month}/${today.day} (${DOW_LABEL[today.dayOfWeek]})`;
  const currentWeek = getCurrentWeekBounds(today.date);

  const [
    balance,
    budgetItems,
    recentTx,
    allWeeklyItems,
    monthlyRegistered,
    weeklyRegistered,
    goals,
  ] = await Promise.all([
    getCurrentBalance(),
    getBudgetData(year, month),
    getTransactions({ limit: 8, dateTo: today.date }),
    getWeeklyBudgetData(year, month, currentWeek.start, currentWeek.end),
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(currentWeek.start),
    getGoalsWithProgress(),
  ]);

  const weeklyItems = allWeeklyItems.filter((i) =>
    WEEKLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const monthlyItems = budgetItems.filter((i) =>
    MONTHLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const activeWeeklyPeriodIndex =
    weeklyItems[0]?.periods.findIndex(
      (period) => period.start <= today.date && today.date <= period.end
    ) ?? -1;
  const resolvedWeeklyPeriodIndex = activeWeeklyPeriodIndex >= 0 ? activeWeeklyPeriodIndex : 0;
  const activeWeeklyPeriod =
    weeklyItems[0]?.periods[resolvedWeeklyPeriodIndex];

  const totalBudget = monthlyItems.reduce((s, i) => s + i.budgetAmount, 0);
  const totalActual = monthlyItems.reduce((s, i) => s + i.actualAmount, 0);
  const weeklyBudget = weeklyItems.reduce(
    (sum, item) => sum + (item.periods[resolvedWeeklyPeriodIndex]?.budget ?? 0),
    0
  );
  const weeklyExpense = weeklyItems.reduce(
    (sum, item) => sum + (item.periods[resolvedWeeklyPeriodIndex]?.actual ?? 0),
    0
  );

  const monthlyCategories = monthlyItems
    .filter((i) => i.budgetAmount > 0)
    .map((i) => ({
      id: i.category.id,
      name: i.category.name,
      color: i.category.color ?? null,
      budget: i.budgetAmount,
      actual: i.actualAmount,
    }));

  const weeklyCategories = weeklyItems
    .map((item) => {
      const period = item.periods[resolvedWeeklyPeriodIndex];
      if (!period || period.budget <= 0) return null;
      return {
        id: item.category.id,
        name: item.category.name,
        color: item.category.color ?? null,
        budget: period.budget,
        actual: period.actual,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-4 sm:px-6 sm:py-8 lg:space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {year}年{month}月
        </p>
        <NewEntryButton />
      </div>

      <BudgetAlertBanner
        monthlyMissing={!monthlyRegistered}
        weeklyMissing={!weeklyRegistered}
      />

      <BalanceHeroCard
        balance={balance}
        year={year}
        month={month}
        dateLabel={dateLabel}
      />

      {/* Budget tabs + transactions (shared category filter state) */}
      <BudgetTransactionsSection
        weeklyData={{
          subtitle: activeWeeklyPeriod?.label ?? currentWeek.label,
          linkHref: "/budget?view=weekly",
          totalBudget: weeklyBudget,
          totalActual: weeklyExpense,
          categories: weeklyCategories,
        }}
        monthlyData={{
          subtitle: `${year}年${month}月`,
          linkHref: "/budget",
          totalBudget: totalBudget,
          totalActual: totalActual,
          categories: monthlyCategories,
        }}
        transactions={recentTx}
        goalCard={<GoalHeroCard goals={goals} />}
      />
    </div>
  );
}

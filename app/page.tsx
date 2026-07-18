import NewEntryButton from "@/components/NewEntryButton";
import {
  getCurrentBalance,
  getBudgetData,
  getTransactions,
  getWishlistItems,
  getWeeklyBudgetData,
  hasMonthlyBudget,
  hasWeeklyBudget,
} from "@/lib/data";
import BudgetAlertBanner from "@/components/home/BudgetAlertBanner";
import BalanceHeroCard from "@/components/home/BalanceHeroCard";
import WishlistHeroCard from "@/components/home/WishlistHeroCard";
import BudgetTransactionsSection from "@/components/home/BudgetTransactionsSection";

const WEEKLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品"];
const MONTHLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];
const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getCurrentWeekBounds(date: Date): { start: string; end: string; label: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);
  const [, sm, sd] = startStr.split("-");
  const [, em, ed] = endStr.split("-");
  const label =
    sm === em
      ? `${parseInt(sm)}/${parseInt(sd)}-${parseInt(ed)}`
      : `${parseInt(sm)}/${parseInt(sd)}-${parseInt(em)}/${parseInt(ed)}`;
  return { start: startStr, end: endStr, label };
}

export default async function HomePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dateLabel = `${month}/${now.getDate()} (${DOW_LABEL[now.getDay()]})`;
  const currentWeek = getCurrentWeekBounds(now);

  const [
    balance,
    budgetItems,
    recentTx,
    wishlistItems,
    allWeeklyItems,
    monthlyRegistered,
    weeklyRegistered,
  ] = await Promise.all([
    getCurrentBalance(),
    getBudgetData(year, month),
    getTransactions({ limit: 8, dateTo: fmtDate(now) }),
    getWishlistItems(),
    getWeeklyBudgetData(year, month, currentWeek.start, currentWeek.end),
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(currentWeek.start),
  ]);

  const weeklyItems = allWeeklyItems.filter((i) =>
    WEEKLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const monthlyItems = budgetItems.filter((i) =>
    MONTHLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const today = fmtDate(now);
  const activeWeeklyPeriodIndex =
    weeklyItems[0]?.periods.findIndex(
      (period) => period.start <= today && today <= period.end
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
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

      {/* Bento hero grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <BalanceHeroCard
          balance={balance}
          year={year}
          month={month}
          dateLabel={dateLabel}
        />
        <WishlistHeroCard items={wishlistItems} balance={balance} />
      </div>

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
      />
    </div>
  );
}

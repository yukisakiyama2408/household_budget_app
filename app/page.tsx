import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewEntryButton from "@/components/NewEntryButton";
import PaceTabsCard from "@/components/dashboard/PaceTabsCard";
import GoalProgress from "@/components/home/GoalProgress";
import BudgetCard from "@/components/home/BudgetCard";
import { getCurrentBalance, getMonthlySummary, getBudgetData, getTransactions, calcPace, getGoalsWithProgress, getWeeklyBudgetData, hasMonthlyBudget, hasWeeklyBudget } from "@/lib/data";
import BudgetAlertBanner from "@/components/home/BudgetAlertBanner";

const WEEKLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品"];

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

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default async function HomePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const currentWeek = getCurrentWeekBounds(now);

  const [balance, summary, budgetItems, recentTx, goals, allWeeklyItems, monthlyRegistered, weeklyRegistered] = await Promise.all([
    getCurrentBalance(),
    getMonthlySummary(year, month),
    getBudgetData(year, month),
    getTransactions({ limit: 5, dateTo: fmtDate(now) }),
    getGoalsWithProgress(),
    getWeeklyBudgetData(year, month, currentWeek.start, currentWeek.end),
    hasMonthlyBudget(year, month),
    hasWeeklyBudget(currentWeek.start),
  ]);

  const weeklyItems = allWeeklyItems.filter((i) => WEEKLY_BUDGET_CATEGORIES.includes(i.category.name));
  const weeklyBudget = weeklyItems.reduce((s, i) => s + i.weeklyBudget, 0);
  const weeklyExpense = weeklyItems.reduce((s, i) => s + i.weeklyActual, 0);

  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

  const totalBudget = budgetItems.reduce((s, i) => s + i.budgetAmount, 0);
  const totalActual = budgetItems.reduce((s, i) => s + i.actualAmount, 0);

  const monthlyTopCategories = budgetItems
    .filter((i) => i.budgetAmount > 0)
    .sort((a, b) => b.actualAmount / b.budgetAmount - a.actualAmount / a.budgetAmount)
    .slice(0, 3)
    .map((i) => ({
      id: i.category.id,
      name: i.category.name,
      color: i.category.color ?? null,
      budget: i.budgetAmount,
      actual: i.actualAmount,
    }));

  const weeklyBudgetItems = allWeeklyItems.filter((i) => i.weeklyBudget > 0);
  const weeklyTotalBudget = weeklyBudgetItems.reduce((s, i) => s + i.weeklyBudget, 0);
  const weeklyTotalActual = weeklyBudgetItems.reduce((s, i) => s + i.weeklyActual, 0);
  const weeklyTopCategories = weeklyBudgetItems
    .sort((a, b) => b.weeklyActual / b.weeklyBudget - a.weeklyActual / a.weeklyBudget)
    .slice(0, 3)
    .map((i) => ({
      id: i.category.id,
      name: i.category.name,
      color: i.category.color ?? null,
      budget: i.weeklyBudget,
      actual: i.weeklyActual,
    }));

  const pace = calcPace(year, month, summary.expense, totalBudget);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{year}年{month}月</p>
        <NewEntryButton />
      </div>

      <BudgetAlertBanner monthlyMissing={!monthlyRegistered} weeklyMissing={!weeklyRegistered} />

      {/* 残高 + 今月収支 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">現在の残高</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold tabular-nums ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              {balance < 0 ? "-" : ""}{fmt(balance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">今月の収支</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">収入</span>
              <span className="font-medium text-green-700 tabular-nums">+{fmt(summary.income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支出</span>
              <span className="font-medium text-red-600 tabular-nums">-{fmt(summary.expense)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-500">収支</span>
              <span className={`font-bold tabular-nums ${summary.balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                {summary.balance >= 0 ? "+" : "-"}{fmt(summary.balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ペース（月次 / 週次タブ） */}
      <PaceTabsCard
        pace={pace}
        weekLabel={currentWeek.label}
        weekStart={currentWeek.start}
        weeklyBudget={weeklyBudget}
        weeklyExpense={weeklyExpense}
        dayOfWeek={dayOfWeek}
      />

      {/* 目標進捗 */}
      <GoalProgress goals={goals} />

      {/* 予算消化（月次 + 週次） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BudgetCard
          title="今月の予算消化"
          subtitle={`${year}年${month}月`}
          totalBudget={totalBudget}
          totalActual={totalActual}
          topCategories={monthlyTopCategories}
          linkHref="/budget"
        />
        <BudgetCard
          title="今週の予算消化"
          subtitle={currentWeek.label}
          totalBudget={weeklyTotalBudget}
          totalActual={weeklyTotalActual}
          topCategories={weeklyTopCategories}
          linkHref="/budget?view=weekly"
        />
      </div>

      {/* 直近取引 */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">直近の取引</CardTitle>
          <Link href="/transactions" className="text-xs text-blue-600 hover:underline">一覧 →</Link>
        </CardHeader>
        <CardContent>
          {recentTx.length === 0 ? (
            <p className="text-sm text-gray-400">取引がありません</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400 text-xs tabular-nums flex-shrink-0">
                      {t.date.slice(5).replace("-", "/")}
                    </span>
                    {t.categories && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.categories.color ?? "#B3B3B3" }}
                      />
                    )}
                    <span className="truncate text-gray-700">{t.content}</span>
                  </div>
                  <span className={`font-medium tabular-nums flex-shrink-0 ${t.type === "income" ? "text-green-700" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

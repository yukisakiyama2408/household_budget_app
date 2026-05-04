import MonthSelector from "@/components/budget/MonthSelector";
import BudgetTable from "@/components/budget/BudgetTable";
import WeeklyBudgetTable from "@/components/budget/WeeklyBudgetTable";
import ViewToggle from "@/components/budget/ViewToggle";
import WeekSelector from "@/components/budget/WeekSelector";
import TotalBudgetCard from "@/components/budget/TotalBudgetCard";
import GeminiBudgetImport from "@/components/budget/GeminiBudgetImport";
import PaceCard from "@/components/dashboard/PaceCard";
import PageTabs from "@/components/PageTabs";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import ApplyFixedExpensesButton from "@/components/fixed/ApplyFixedExpensesButton";
import CategoryManager from "@/components/categories/CategoryManager";
import Link from "next/link";
import {
  getBudgetData,
  getWeeklyBudgetData,
  getMonthlyTotalBudget,
  getWeeklyTotalBudget,
  getMonthlySummary,
  calcPace,
  getGoalsWithProgress,
  getCategories,
  getFixedExpenses,
  getFixedExpenseLogs,
} from "@/lib/data";
import { getWeeksOfMonth, getCurrentWeekStart } from "@/lib/dateUtils";

const BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];
const BUDGET_TABS = [
  { key: "budget", label: "予算" },
  { key: "fixed", label: "固定費" },
  { key: "categories", label: "カテゴリ" },
];

type Props = {
  searchParams: Promise<{ year?: string; month?: string; view?: string; weekStart?: string; tab?: string }>;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default async function BudgetPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const view = params.view === "weekly" ? "weekly" : "monthly";
  const tab = params.tab ?? "budget";

  const weeks = getWeeksOfMonth(year, month);
  const defaultWeekStart = (() => {
    const cur = getCurrentWeekStart();
    return weeks.find((w) => w.start === cur)?.start ?? weeks[0]?.start ?? cur;
  })();
  const weekStart = params.weekStart ?? defaultWeekStart;
  const weekRange = weeks.find((w) => w.start === weekStart) ?? weeks[0];
  const weekEnd = weekRange?.end ?? weekStart;

  const isBudgetTab = tab === "budget";
  const isFixedTab = tab === "fixed";
  const isCategoriesTab = tab === "categories";

  const [goalsWithProgress, allMonthlyItems, monthlySummary, monthlyTotalBudget, allCategories, fixedExpenses, fixedLogs] = await Promise.all([
    isBudgetTab ? getGoalsWithProgress() : Promise.resolve([]),
    isBudgetTab ? getBudgetData(year, month) : Promise.resolve([]),
    isBudgetTab ? getMonthlySummary(year, month) : Promise.resolve({ expense: 0, income: 0, balance: 0 }),
    isBudgetTab ? getMonthlyTotalBudget(year, month) : Promise.resolve(0),
    (isBudgetTab || isCategoriesTab) ? getCategories() : Promise.resolve([]),
    isFixedTab ? getFixedExpenses() : Promise.resolve([]),
    isFixedTab ? getFixedExpenseLogs() : Promise.resolve([]),
  ]);

  const monthlyItems = (allMonthlyItems as Awaited<ReturnType<typeof getBudgetData>>).filter((i) =>
    BUDGET_CATEGORIES.includes(i.category.name)
  );

  const [allWeeklyItems, weeklyTotalBudget] =
    isBudgetTab && view === "weekly"
      ? await Promise.all([
          getWeeklyBudgetData(year, month, weekStart, weekEnd),
          getWeeklyTotalBudget(weekStart),
        ])
      : [[], 0];

  const weeklyItems = (allWeeklyItems as Awaited<ReturnType<typeof getWeeklyBudgetData>>).filter(
    (i) => BUDGET_CATEGORIES.includes(i.category.name)
  );
  const weeklyActualTotal = weeklyItems.reduce((s: number, i: Awaited<ReturnType<typeof getWeeklyBudgetData>>[number]) => s + i.weeklyActual, 0);

  const totalMonthlyBudget = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.budgetAmount, 0);
  const totalMonthlyActual = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.actualAmount, 0);
  const pace = calcPace(year, month, totalMonthlyActual, totalMonthlyBudget);

  const activeFixed = (fixedExpenses as Awaited<ReturnType<typeof getFixedExpenses>>).filter((f) => f.is_active);
  const inactiveFixed = (fixedExpenses as Awaited<ReturnType<typeof getFixedExpenses>>).filter((f) => !f.is_active);

  const appliedMonths = new Map<string, number>();
  for (const log of (fixedLogs as Awaited<ReturnType<typeof getFixedExpenseLogs>>)) {
    const key = `${log.year}-${String(log.month).padStart(2, "0")}`;
    appliedMonths.set(key, (appliedMonths.get(key) ?? 0) + 1);
  }
  const recentApplied = Array.from(appliedMonths.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4);

  const categories = allCategories as Awaited<ReturnType<typeof getCategories>>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">予算管理</h1>
        {isBudgetTab && <GoalForm categories={categories} />}
        {isFixedTab && (
          <Link href="/fixed/new" className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            + 新規登録
          </Link>
        )}
      </div>

      <PageTabs tabs={BUDGET_TABS} currentTab={tab} basePath="/budget" />

      {/* 予算タブ */}
      {isBudgetTab && (
        <div className="space-y-8">
          {/* 目標 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700">目標</h2>
            {goalsWithProgress.length === 0 ? (
              <div className="border rounded-md p-4 text-sm text-gray-400 text-center">
                目標が設定されていません。右上の「目標を追加」から作成できます。
              </div>
            ) : (
              (goalsWithProgress as Awaited<ReturnType<typeof getGoalsWithProgress>>).map((goal) => (
                <GoalCard key={goal.id} goal={goal} categories={categories} />
              ))
            )}
          </section>

          {/* 月次 / 週次予算 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <ViewToggle view={view} year={year} month={month} weekStart={weekStart} />
              <MonthSelector year={year} month={month} extraParams={view === "weekly" ? `view=weekly` : undefined} />
            </div>
            {view === "weekly" && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">週予算 = 月次予算 ÷ {weeks.length}週（未登録時）</p>
                <WeekSelector year={year} month={month} weekStart={weekStart} />
              </div>
            )}
            {view === "monthly" ? (
              <TotalBudgetCard type="monthly" year={year} month={month} budgetAmount={monthlyTotalBudget} actualAmount={(monthlySummary as { expense: number }).expense} />
            ) : (
              <TotalBudgetCard type="weekly" weekStart={weekStart} weekLabel={weekRange?.label ?? ""} budgetAmount={weeklyTotalBudget} actualAmount={weeklyActualTotal} />
            )}
            {view === "monthly" && <PaceCard {...pace} />}
            <div className="flex justify-end">
              {view === "monthly" ? (
                <GeminiBudgetImport type="monthly" year={year} month={month} categories={monthlyItems.map((i) => ({ id: i.category.id, name: i.category.name }))} />
              ) : (
                <GeminiBudgetImport type="weekly" weekStart={weekStart} categories={monthlyItems.map((i) => ({ id: i.category.id, name: i.category.name }))} />
              )}
            </div>
            {view === "monthly" ? (
              <BudgetTable items={monthlyItems} year={year} month={month} />
            ) : (
              <WeeklyBudgetTable items={weeklyItems} weekStart={weekStart} />
            )}
          </section>
        </div>
      )}

      {/* 固定費タブ */}
      {isFixedTab && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-sm font-medium text-gray-500">固定費の適用</p>
              <p className="text-xs text-gray-400">選択した月に登録済みの固定費を収支として一括登録します</p>
              <ApplyFixedExpensesButton />
            </div>
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-sm font-medium text-gray-500">適用履歴</p>
              {recentApplied.length === 0 ? (
                <p className="text-sm text-gray-400">適用履歴がありません</p>
              ) : (
                <div className="space-y-1.5">
                  {recentApplied.map(([key, count]) => {
                    const [y, m] = key.split("-");
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{y}年{parseInt(m)}月</span>
                        <span className="text-gray-400">{count}件適用済み</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-medium">有効な固定費（{activeFixed.length}件）</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">名前</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">カテゴリ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">金額</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">毎月</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {activeFixed.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">有効な固定費がありません</td></tr>
                ) : (
                  activeFixed.map((fe) => (
                    <tr key={fe.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded hidden sm:inline ${fe.type === "expense" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {fe.type === "expense" ? "支出" : "収入"}
                          </span>
                          {fe.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {fe.categories ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fe.categories.color ?? "#B3B3B3" }} />
                            {fe.categories.name}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${fe.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                        {fe.type === "expense" ? "-" : "+"}{fmt(fe.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{fe.day_of_month}日</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline">編集</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {inactiveFixed.length > 0 && (
            <div className="border rounded-md overflow-hidden opacity-60">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-medium text-gray-400">無効な固定費（{inactiveFixed.length}件）</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {inactiveFixed.map((fe) => (
                    <tr key={fe.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-gray-400">{fe.name}</td>
                      <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{fmt(fe.amount)}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{fe.day_of_month}日</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline">編集</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* カテゴリタブ */}
      {isCategoriesTab && (
        <CategoryManager categories={categories} />
      )}
    </div>
  );
}

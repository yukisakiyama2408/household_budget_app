import MonthSelector from "@/components/budget/MonthSelector";
import BudgetTable from "@/components/budget/BudgetTable";
import WeeklyBudgetTable from "@/components/budget/WeeklyBudgetTable";
import ViewToggle from "@/components/budget/ViewToggle";
import WeekSelector from "@/components/budget/WeekSelector";
import TotalBudgetCard from "@/components/budget/TotalBudgetCard";
import CombinedBudgetImport from "@/components/budget/CombinedBudgetImport";
import BudgetTransactionList from "@/components/budget/BudgetTransactionList";
import BudgetReviewTools from "@/components/budget/BudgetReviewTools";
import WeeklyBudgetReviewFlow from "@/components/budget/WeeklyBudgetReviewFlow";
import PageTabs from "@/components/PageTabs";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import ApplyFixedExpensesButton from "@/components/fixed/ApplyFixedExpensesButton";
import CategoryManager from "@/components/categories/CategoryManager";
import Link from "next/link";
import {
  getBudgetData,
  getWeeklyBudgetData,
  getGoalsWithProgress,
  getCategories,
  getFixedExpenses,
  getFixedExpenseLogs,
  hasMonthlyBudget,
  getTransactions,
} from "@/lib/data";
import { getWeekBudgetPeriods, getWeeksOfMonth, getCurrentWeekStart } from "@/lib/dateUtils";

const BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];
const WEEKLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品"];
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
  const currentWeekStart = getCurrentWeekStart();
  const defaultWeekStart = weeks.find((w) => w.start === currentWeekStart)?.start ?? weeks[0]?.start ?? currentWeekStart;
  const weekStart = params.weekStart ?? defaultWeekStart;
  const weekRange = weeks.find((w) => w.start === weekStart) ?? weeks[0];
  const weekEnd = weekRange?.end ?? weekStart;

  const isBudgetTab = tab === "budget";
  const isFixedTab = tab === "fixed";
  const isCategoriesTab = tab === "categories";

  const selectedWeekPeriods = getWeekBudgetPeriods(weekStart, weekEnd);

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const currentMonthHasBudget = isBudgetTab ? await hasMonthlyBudget(nowYear, nowMonth) : false;
  const geminiYear = currentMonthHasBudget ? (nowMonth === 12 ? nowYear + 1 : nowYear) : nowYear;
  const geminiMonth = currentMonthHasBudget ? (nowMonth === 12 ? 1 : nowMonth + 1) : nowMonth;
  const geminiMonthLabel = `${geminiYear}年${geminiMonth}月`;

  const [goalsWithProgress, allMonthlyItems, allCategories, fixedExpenses, fixedLogs] = await Promise.all([
    isBudgetTab ? getGoalsWithProgress() : Promise.resolve([]),
    isBudgetTab ? getBudgetData(year, month) : Promise.resolve([]),
    (isBudgetTab || isCategoriesTab) ? getCategories() : Promise.resolve([]),
    isFixedTab ? getFixedExpenses() : Promise.resolve([]),
    isFixedTab ? getFixedExpenseLogs() : Promise.resolve([]),
  ]);

  const monthlyItems = (allMonthlyItems as Awaited<ReturnType<typeof getBudgetData>>).filter((i) =>
    BUDGET_CATEGORIES.includes(i.category.name)
  );

  const allWeeklyItems =
    isBudgetTab && view === "weekly"
      ? await getWeeklyBudgetData(year, month, weekStart, weekEnd)
      : [];

  const periodTransactions = isBudgetTab
    ? await getTransactions(
        view === "weekly"
          ? { dateFrom: weekStart, dateTo: weekEnd }
          : { month: `${year}-${String(month).padStart(2, "0")}` }
      )
    : [];

  const weeklyItems = (allWeeklyItems as Awaited<ReturnType<typeof getWeeklyBudgetData>>).filter(
    (i) => WEEKLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const weeklyActualTotal = weeklyItems.reduce((s: number, i: Awaited<ReturnType<typeof getWeeklyBudgetData>>[number]) => s + i.weeklyActual, 0);
  const totalWeeklyBudget = weeklyItems.reduce((s: number, i: Awaited<ReturnType<typeof getWeeklyBudgetData>>[number]) => s + i.weeklyBudget, 0);

  const totalMonthlyBudget = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.budgetAmount, 0);
  const totalMonthlyActual = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.actualAmount, 0);

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">予算を調整</h2>
                <p className="mt-1 text-xs text-gray-500">
                  期間を選び、予算と実績の差分を確認してから予算を更新します。
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <ViewToggle view={view} year={year} month={month} weekStart={weekStart} />
                <MonthSelector year={year} month={month} extraParams={view === "weekly" ? `view=weekly` : undefined} />
              </div>
            </div>
            {view === "weekly" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400">
                  未登録時は月次予算 ÷ 月内の週区間数。月を跨ぐ週は月別の期間に分けて計算します。
                </p>
                <WeekSelector year={year} month={month} weekStart={weekStart} />
              </div>
            )}
            {view === "monthly" ? (
              <TotalBudgetCard type="monthly" year={year} month={month} budgetAmount={totalMonthlyBudget} actualAmount={totalMonthlyActual} />
            ) : (
              <TotalBudgetCard type="weekly" weekStart={weekStart} weekLabel={weekRange?.label ?? ""} budgetAmount={totalWeeklyBudget} actualAmount={weeklyActualTotal} />
            )}
          </section>

          <section className="rounded-lg border bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">AIで予算を見直す</h2>
                <p className="mt-1 text-xs text-gray-500">
                  CSVを渡して予算案を作り、出力を貼り付けて予算表へ反映します。
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {view === "weekly" ? (
                <WeeklyBudgetReviewFlow
                  periods={selectedWeekPeriods}
                  categories={weeklyItems.map((item) => ({ id: item.category.id, name: item.category.name }))}
                />
              ) : (
                <BudgetReviewTools view={view} />
              )}

              {view === "monthly" && <div className="border-t pt-4">
                <div className="mb-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                  <div className="rounded-md bg-gray-50 px-3 py-2">
                    <span className="font-bold text-gray-700">3. AI出力</span>
                    <span className="ml-1">回答を下の入力欄へ貼り付けます。</span>
                  </div>
                  <div className="rounded-md bg-gray-50 px-3 py-2">
                    <span className="font-bold text-gray-700">4. 反映</span>
                    <span className="ml-1">認識結果を確認して一括登録します。</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">AI出力を反映</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    コピーしたプロンプトの回答を貼り付けて、予算表へ一括登録します。
                  </p>
                </div>
                <div className="mt-3">
                  <CombinedBudgetImport year={geminiYear} month={geminiMonth} monthLabel={geminiMonthLabel} categories={monthlyItems.map((i) => ({ id: i.category.id, name: i.category.name }))} />
                </div>
              </div>}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {view === "monthly" ? "月次予算表" : "週次予算表"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                カテゴリごとの予算を直接編集できます。
              </p>
            </div>
            {view === "monthly" ? (
              <BudgetTable items={monthlyItems} year={year} month={month} />
            ) : (
              <WeeklyBudgetTable items={weeklyItems} />
            )}
          </section>

          {/* 取引明細 */}
          <BudgetTransactionList
            transactions={periodTransactions}
            title={view === "weekly" ? `取引明細（${weekRange?.label ?? ""}）` : `取引明細（${year}年${month}月）`}
          />

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

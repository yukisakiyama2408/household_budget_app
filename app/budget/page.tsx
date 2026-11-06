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
import Link from "next/link";
import { redirect } from "next/navigation";
import { fixedExpensesHref, legacyFixedExpenseMonth } from "@/lib/fixed-expense-navigation";
import { ChevronDown } from "lucide-react";
import {
  getBudgetData,
  getWeeklyBudgetData,
  getTransactions,
  getAnalysisResults,
} from "@/lib/data";
import { getWeekBudgetPeriods, getWeeksOfMonth, getCurrentWeekStart } from "@/lib/dateUtils";

const BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];
const WEEKLY_BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品"];
type Props = {
  searchParams: Promise<{ year?: string; month?: string; view?: string; weekStart?: string; tab?: string }>;
};

const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function getPriorAnalysisPeriod(view: "monthly" | "weekly", year: number, month: number, weekStart: string) {
  if (view === "monthly") {
    const target = new Date(year, month - 1, 1);
    const priorStart = new Date(target.getFullYear(), target.getMonth() - 1, 1);
    const priorEnd = new Date(target.getFullYear(), target.getMonth(), 0);
    return {
      view: "monthly" as const,
      period: `${priorStart.getFullYear()}-${pad(priorStart.getMonth() + 1)}`,
      dateFrom: dateValue(priorStart),
      dateTo: dateValue(priorEnd),
      label: `${priorStart.getFullYear()}年${priorStart.getMonth() + 1}月`,
    };
  }
  const priorStart = new Date(`${weekStart}T00:00:00`);
  priorStart.setDate(priorStart.getDate() - 7);
  const priorEnd = new Date(priorStart);
  priorEnd.setDate(priorEnd.getDate() + 6);
  return {
    view: "weekly" as const,
    period: dateValue(priorStart),
    dateFrom: dateValue(priorStart),
    dateTo: dateValue(priorEnd),
    label: `${priorStart.getFullYear()}/${priorStart.getMonth() + 1}/${priorStart.getDate()}〜${priorEnd.getMonth() + 1}/${priorEnd.getDate()}`,
  };
}

export default async function BudgetPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.tab === "fixed") {
    redirect(fixedExpensesHref(legacyFixedExpenseMonth(params.year, params.month)));
  }
  if (params.tab === "categories") redirect("/settings/categories");
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const view = params.view === "weekly" ? "weekly" : "monthly";

  const weeks = getWeeksOfMonth(year, month);
  const currentWeekStart = getCurrentWeekStart();
  const defaultWeekStart = weeks.find((w) => w.start === currentWeekStart)?.start ?? weeks[0]?.start ?? currentWeekStart;
  const weekStart = params.weekStart ?? defaultWeekStart;
  const weekRange = weeks.find((w) => w.start === weekStart) ?? weeks[0];
  const weekEnd = weekRange?.end ?? weekStart;

  const selectedWeekPeriods = getWeekBudgetPeriods(weekStart, weekEnd);

  const selectedMonthLabel = `${year}年${month}月`;

  const [allMonthlyItems, analysisResults] = await Promise.all([
    getBudgetData(year, month),
    getAnalysisResults(),
  ]);

  const monthlyItems = (allMonthlyItems as Awaited<ReturnType<typeof getBudgetData>>).filter((i) =>
    BUDGET_CATEGORIES.includes(i.category.name)
  );

  const allWeeklyItems =
    view === "weekly"
      ? await getWeeklyBudgetData(year, month, weekStart, weekEnd)
      : [];

  const periodTransactions = await getTransactions(
    view === "weekly"
      ? { dateFrom: weekStart, dateTo: weekEnd }
      : { month: `${year}-${String(month).padStart(2, "0")}` }
  );

  const weeklyItems = (allWeeklyItems as Awaited<ReturnType<typeof getWeeklyBudgetData>>).filter(
    (i) => WEEKLY_BUDGET_CATEGORIES.includes(i.category.name)
  );
  const weeklyActualTotal = weeklyItems.reduce((s: number, i: Awaited<ReturnType<typeof getWeeklyBudgetData>>[number]) => s + i.weeklyActual, 0);
  const totalWeeklyBudget = weeklyItems.reduce((s: number, i: Awaited<ReturnType<typeof getWeeklyBudgetData>>[number]) => s + i.weeklyBudget, 0);

  const totalMonthlyBudget = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.budgetAmount, 0);
  const totalMonthlyActual = monthlyItems.reduce((s: number, i: typeof monthlyItems[number]) => s + i.actualAmount, 0);

  const priorPeriod = getPriorAnalysisPeriod(view, year, month, weekStart);
  const priorAnalysis = (analysisResults as Awaited<ReturnType<typeof getAnalysisResults>>).find(
    (result) => result.analysis_view === priorPeriod.view
      && result.date_from === priorPeriod.dateFrom
      && result.date_to === priorPeriod.dateTo
  );
  const priorAnalysisContext = priorAnalysis ? {
    id: priorAnalysis.id,
    title: priorAnalysis.title,
    content: priorAnalysis.content,
    periodLabel: priorAnalysis.period_label,
    advices: priorAnalysis.analysis_advices.map((advice) => advice.content),
  } : undefined;
  const analysisHref = `/monthly?tab=insights&view=${priorPeriod.view}&period=${priorPeriod.period}`;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">予算管理</h1>
        <Link href="/settings/categories" className="text-sm text-indigo-600 hover:underline">
          カテゴリ管理
        </Link>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">予算を調整</h2>
              <p className="mt-1 text-xs text-gray-500">
                期間を選び、予算と実績の差分を確認してから予算を更新します。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <details
          key={`${view}-${year}-${month}-${weekStart}`}
          className="group rounded-lg border bg-white"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-semibold text-indigo-700">AIで予算を見直す</span>
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t p-4 sm:p-6">
            <p className="mb-4 text-sm text-gray-500">
              CSVを渡して予算案を作り、出力を貼り付けて予算表へ反映します。
            </p>
            <div className="space-y-4">
              <div className={`rounded-md border p-3 ${priorAnalysis ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-xs font-bold ${priorAnalysis ? "text-green-800" : "text-amber-800"}`}>
                      1. {priorPeriod.label}を分析する
                    </p>
                    <p className={`mt-1 text-xs ${priorAnalysis ? "text-green-700" : "text-amber-700"}`}>
                      {priorAnalysis
                        ? `「${priorAnalysis.title}」を予算案のプロンプトへ反映します。`
                        : "直前期間の分析を登録すると、その内容を予算案へ引き継げます。"}
                    </p>
                  </div>
                  <Link
                    href={analysisHref}
                    className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold text-white ${priorAnalysis ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
                  >
                    {priorAnalysis ? "分析結果を確認" : "分析して登録"}
                  </Link>
                </div>
              </div>
              {view === "weekly" ? (
                <WeeklyBudgetReviewFlow
                  periods={selectedWeekPeriods}
                  categories={weeklyItems.map((item) => ({ id: item.category.id, name: item.category.name }))}
                  priorAnalysis={priorAnalysisContext}
                />
              ) : (
                <BudgetReviewTools view={view} targetLabel={selectedMonthLabel} priorAnalysis={priorAnalysisContext} />
              )}

              {view === "monthly" && <div className="border-t pt-4">
                <div className="mb-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                  <div className="rounded-md bg-gray-50 px-3 py-2">
                    <span className="font-bold text-gray-700">4. AI出力</span>
                    <span className="ml-1">回答を下の入力欄へ貼り付けます。</span>
                  </div>
                  <div className="rounded-md bg-gray-50 px-3 py-2">
                    <span className="font-bold text-gray-700">5. 反映</span>
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
                  <CombinedBudgetImport year={year} month={month} monthLabel={selectedMonthLabel} categories={monthlyItems.map((i) => ({ id: i.category.id, name: i.category.name }))} />
                </div>
              </div>}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

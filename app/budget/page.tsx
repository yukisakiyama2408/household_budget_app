import MonthSelector from "@/components/budget/MonthSelector";
import BudgetTable from "@/components/budget/BudgetTable";
import WeeklyBudgetTable from "@/components/budget/WeeklyBudgetTable";
import ViewToggle from "@/components/budget/ViewToggle";
import WeekSelector from "@/components/budget/WeekSelector";
import TotalBudgetCard from "@/components/budget/TotalBudgetCard";
import PaceCard from "@/components/dashboard/PaceCard";
import Link from "next/link";
import {
  getBudgetData,
  getWeeklyBudgetData,
  getMonthlyTotalBudget,
  getWeeklyTotalBudget,
  getMonthlySummary,
  calcPace,
  getGoalsWithProgress,
} from "@/lib/data";
import { getWeeksOfMonth, getCurrentWeekStart } from "@/lib/dateUtils";

const BUDGET_CATEGORIES = ["食費", "外食費", "接待交際費", "娯楽費", "スマホ代", "生活品", "その他"];

type Props = {
  searchParams: Promise<{ year?: string; month?: string; view?: string; weekStart?: string }>;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default async function BudgetPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const view = params.view === "weekly" ? "weekly" : "monthly";

  const weeks = getWeeksOfMonth(year, month);
  const defaultWeekStart = (() => {
    const cur = getCurrentWeekStart();
    return weeks.find((w) => w.start === cur)?.start ?? weeks[0]?.start ?? cur;
  })();
  const weekStart = params.weekStart ?? defaultWeekStart;
  const weekRange = weeks.find((w) => w.start === weekStart) ?? weeks[0];
  const weekEnd = weekRange?.end ?? weekStart;

  const [goalsWithProgress, allMonthlyItems, monthlySummary, monthlyTotalBudget] = await Promise.all([
    getGoalsWithProgress(),
    getBudgetData(year, month),
    getMonthlySummary(year, month),
    getMonthlyTotalBudget(year, month),
  ]);

  const savingsGoals = goalsWithProgress.filter((g) => g.type === "savings");

  const monthlyItems = allMonthlyItems.filter((i) =>
    BUDGET_CATEGORIES.includes(i.category.name)
  );

  const [allWeeklyItems, weeklyTotalBudget] =
    view === "weekly"
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold">予算管理</h1>

      {/* 貯金目標 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">貯金目標</h2>
          <Link href="/goals" className="text-xs text-blue-600 hover:underline">
            目標設定 →
          </Link>
        </div>
        {savingsGoals.length === 0 ? (
          <div className="border rounded-md p-4 text-sm text-gray-400 text-center">
            貯金目標が設定されていません。
            <Link href="/goals" className="ml-1 text-blue-500 hover:underline">目標設定で追加する</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savingsGoals.map((goal) => {
              const pct = Math.round(goal.progress * 100);
              const days = goal.deadline ? (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const d = new Date(goal.deadline);
                return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              })() : null;
              return (
                <div key={goal.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-800">{goal.title}</p>
                      {goal.deadline && (
                        <p className="text-xs text-gray-400">期限: {formatDeadline(goal.deadline)}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-500">目標額: <span className="font-medium text-gray-700 tabular-nums">{fmt(goal.target_amount)}</span></p>
                      <p className="text-gray-500">現在残高: <span className="font-medium tabular-nums">{fmt(goal.currentAmount)}</span></p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-blue-600">{pct}% 達成</span>
                      {days !== null && (
                        <span className={days < 0 ? "text-red-500" : days <= 30 ? "text-yellow-600" : "text-gray-400"}>
                          {days < 0 ? `${Math.abs(days)}日超過` : `残り${days}日`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 月次 / 週次予算 */}
      <section className="space-y-4">
        {/* ナビゲーション */}
        <div className="flex items-center justify-between gap-3">
          <ViewToggle view={view} year={year} month={month} weekStart={weekStart} />
          <MonthSelector
            year={year}
            month={month}
            extraParams={view === "weekly" ? `view=weekly` : undefined}
          />
        </div>

        {view === "weekly" && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">週予算 = 月次予算 ÷ {weeks.length}週（未登録時）</p>
            <WeekSelector year={year} month={month} weekStart={weekStart} />
          </div>
        )}

        {/* 合計予算カード */}
        {view === "monthly" ? (
          <TotalBudgetCard
            type="monthly"
            year={year}
            month={month}
            budgetAmount={monthlyTotalBudget}
            actualAmount={monthlySummary.expense}
          />
        ) : (
          <TotalBudgetCard
            type="weekly"
            weekStart={weekStart}
            weekLabel={weekRange?.label ?? ""}
            budgetAmount={weeklyTotalBudget}
            actualAmount={weeklyActualTotal}
          />
        )}

        {view === "monthly" && <PaceCard {...pace} />}

        {view === "monthly" ? (
          <BudgetTable items={monthlyItems} year={year} month={month} />
        ) : (
          <WeeklyBudgetTable items={weeklyItems} weekStart={weekStart} />
        )}
      </section>
    </div>
  );
}

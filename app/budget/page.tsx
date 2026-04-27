import BudgetYearSelector from "@/components/budget/BudgetYearSelector";
import MonthSelector from "@/components/budget/MonthSelector";
import BudgetTable from "@/components/budget/BudgetTable";
import YearlyBudgetForm from "@/components/budget/YearlyBudgetForm";
import { getBudgetData, getYearlyBudget } from "@/lib/data";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default async function BudgetPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const [yearlyBudget, monthlyItems] = await Promise.all([
    getYearlyBudget(year),
    getBudgetData(year, month),
  ]);

  const yearlyRemaining = yearlyBudget.budgetAmount - yearlyBudget.actualAmount;
  const yearlyIsOver = yearlyBudget.actualAmount > yearlyBudget.budgetAmount && yearlyBudget.budgetAmount > 0;
  const yearlyRatio = yearlyBudget.budgetAmount > 0
    ? Math.min(yearlyBudget.actualAmount / yearlyBudget.budgetAmount, 1)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold">予算管理</h1>

      {/* 年次予算 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">年次予算</h2>
          <BudgetYearSelector year={year} />
        </div>
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>予算:</span>
              <YearlyBudgetForm year={year} currentAmount={yearlyBudget.budgetAmount} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                実績: <span className="font-medium text-red-600 tabular-nums">{fmt(yearlyBudget.actualAmount)}</span>
              </span>
              {yearlyBudget.budgetAmount > 0 && (
                <span className={`font-medium tabular-nums ${yearlyIsOver ? "text-red-600" : "text-green-700"}`}>
                  {yearlyIsOver ? `超過: -${fmt(Math.abs(yearlyRemaining))}` : `残り: ${fmt(yearlyRemaining)}`}
                </span>
              )}
            </div>
          </div>
          {yearlyBudget.budgetAmount > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${yearlyIsOver ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${yearlyRatio * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">
                {Math.round(yearlyRatio * 100)}%
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 月次予算（カテゴリ別） */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">月次予算（カテゴリ別）</h2>
          <MonthSelector year={year} month={month} />
        </div>
        <BudgetTable items={monthlyItems} year={year} month={month} />
      </section>
    </div>
  );
}

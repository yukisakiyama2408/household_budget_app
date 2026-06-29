import type { WeeklyBudgetItem } from "@/lib/data";
import WeeklyBudgetRowForm from "./WeeklyBudgetRowForm";

type Props = {
  items: WeeklyBudgetItem[];
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function WeeklyBudgetTable({ items }: Props) {
  const totalWeekly = items.reduce((s, i) => s + i.weeklyBudget, 0);
  const totalActual = items.reduce((s, i) => s + i.weeklyActual, 0);
  const totalRemaining = totalWeekly - totalActual;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[640px] text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium">カテゴリ</th>
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium whitespace-nowrap">対象期間</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium hidden sm:table-cell whitespace-nowrap">月次予算</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">期間予算</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">期間実績</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">残り / 超過</th>
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium w-24 hidden sm:table-cell">進捗</th>
          </tr>
        </thead>
        <tbody>
          {items.flatMap((item) =>
            item.periods.map((period, periodIndex) => {
              const remaining = period.budget - period.actual;
              const isOver = period.actual > period.budget && period.budget > 0;
              const ratio = period.budget > 0 ? Math.min(period.actual / period.budget, 1) : 0;

              return (
                <tr key={`${item.category.id}-${period.start}`} className="border-b hover:bg-gray-50">
                  <td className="px-1.5 sm:px-4 py-2">
                    {periodIndex === 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.category.color ?? "#B3B3B3" }}
                        />
                        <span className="whitespace-nowrap">{item.category.name}</span>
                      </div>
                    ) : (
                      <span className="pl-3 text-gray-300">↳</span>
                    )}
                  </td>
                  <td className="px-1.5 sm:px-4 py-2 whitespace-nowrap text-gray-600">
                    {period.label}
                  </td>
                  <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-gray-400 whitespace-nowrap hidden sm:table-cell">
                    {period.monthlyBudget > 0 ? fmt(period.monthlyBudget) : "—"}
                  </td>
                  <td className="px-2 sm:px-4 py-2">
                    <WeeklyBudgetRowForm
                      periodStart={period.start}
                      periodEnd={period.end}
                      categoryId={item.category.id}
                      currentAmount={period.budgetSet}
                      derivedAmount={period.budgetDerived}
                    />
                  </td>
                  <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-red-600 whitespace-nowrap">
                    {fmt(period.actual)}
                  </td>
                  <td
                    className={`px-1.5 sm:px-4 py-2 text-right tabular-nums font-medium whitespace-nowrap ${
                      period.budget === 0
                        ? "text-gray-400"
                        : isOver
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {period.budget === 0
                      ? "—"
                      : isOver
                      ? `-${fmt(Math.abs(remaining))}`
                      : fmt(remaining)}
                  </td>
                  <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell">
                    {period.budget > 0 ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isOver ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">未設定</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-sm">
            <td className="px-1.5 sm:px-4 py-2">合計</td>
            <td className="px-1.5 sm:px-4 py-2" />
            <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell" />
            <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums whitespace-nowrap">{fmt(totalWeekly)}</td>
            <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-red-600 whitespace-nowrap">{fmt(totalActual)}</td>
            <td
              className={`px-1.5 sm:px-4 py-2 text-right tabular-nums whitespace-nowrap ${
                totalWeekly === 0
                  ? "text-gray-400"
                  : totalRemaining < 0
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {totalWeekly === 0
                ? "—"
                : totalRemaining < 0
                ? `-${fmt(Math.abs(totalRemaining))}`
                : fmt(totalRemaining)}
            </td>
            <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

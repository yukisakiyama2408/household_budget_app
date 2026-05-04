import type { WeeklyBudgetItem } from "@/lib/data";
import WeeklyBudgetRowForm from "./WeeklyBudgetRowForm";

type Props = {
  items: WeeklyBudgetItem[];
  weekStart: string;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function WeeklyBudgetTable({ items, weekStart }: Props) {
  const totalMonthly = items.reduce((s, i) => s + i.monthlyBudget, 0);
  const totalWeekly = items.reduce((s, i) => s + i.weeklyBudget, 0);
  const totalActual = items.reduce((s, i) => s + i.weeklyActual, 0);
  const totalRemaining = totalWeekly - totalActual;

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium">カテゴリ</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium hidden sm:table-cell whitespace-nowrap">月次予算</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">週予算</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">今週実績</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">残り / 超過</th>
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium w-24 hidden sm:table-cell">進捗</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const remaining = item.weeklyBudget - item.weeklyActual;
            const isOver = item.weeklyActual > item.weeklyBudget && item.weeklyBudget > 0;
            const ratio =
              item.weeklyBudget > 0
                ? Math.min(item.weeklyActual / item.weeklyBudget, 1)
                : 0;

            return (
              <tr key={item.category.id} className="border-b hover:bg-gray-50">
                <td className="px-1.5 sm:px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.category.color ?? "#B3B3B3" }}
                    />
                    <span className="whitespace-nowrap">{item.category.name}</span>
                  </div>
                </td>
                <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-gray-400 whitespace-nowrap hidden sm:table-cell">
                  {item.monthlyBudget > 0 ? fmt(item.monthlyBudget) : "—"}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <WeeklyBudgetRowForm
                    weekStart={weekStart}
                    categoryId={item.category.id}
                    currentAmount={item.weeklyBudgetSet}
                    derivedAmount={item.weeklyBudgetDerived}
                  />
                </td>
                <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-red-600 whitespace-nowrap">
                  {fmt(item.weeklyActual)}
                </td>
                <td
                  className={`px-1.5 sm:px-4 py-2 text-right tabular-nums font-medium whitespace-nowrap ${
                    item.weeklyBudget === 0
                      ? "text-gray-400"
                      : isOver
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {item.weeklyBudget === 0
                    ? "—"
                    : isOver
                    ? `-${fmt(Math.abs(remaining))}`
                    : fmt(remaining)}
                </td>
                <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell">
                  {item.weeklyBudget > 0 ? (
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
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-sm">
            <td className="px-1.5 sm:px-4 py-2">合計</td>
            <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-gray-400 whitespace-nowrap hidden sm:table-cell">{fmt(totalMonthly)}</td>
            <td className="px-1.5 sm:px-4 py-2" />
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

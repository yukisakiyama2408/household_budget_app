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
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-2.5 text-left font-medium">カテゴリ</th>
            <th className="px-4 py-2.5 text-right font-medium">月次予算</th>
            <th className="px-4 py-2.5 text-right font-medium">週予算</th>
            <th className="px-4 py-2.5 text-right font-medium">今週実績</th>
            <th className="px-4 py-2.5 text-right font-medium">残り / 超過</th>
            <th className="px-4 py-2.5 text-left font-medium w-32">進捗</th>
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
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.category.color ?? "#B3B3B3" }}
                    />
                    {item.category.name}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">
                  {item.monthlyBudget > 0 ? fmt(item.monthlyBudget) : "—"}
                </td>
                <td className="px-4 py-2">
                  <WeeklyBudgetRowForm
                    weekStart={weekStart}
                    categoryId={item.category.id}
                    currentAmount={item.weeklyBudgetSet}
                    derivedAmount={item.weeklyBudgetDerived}
                  />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                  {fmt(item.weeklyActual)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-medium ${
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
                <td className="px-4 py-2.5">
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
            <td className="px-4 py-2.5">合計</td>
            <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{fmt(totalMonthly)}</td>
            <td className="px-4 py-2.5" />
            <td className="px-4 py-2.5 text-right tabular-nums text-red-600">{fmt(totalActual)}</td>
            <td
              className={`px-4 py-2.5 text-right tabular-nums ${
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
            <td className="px-4 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

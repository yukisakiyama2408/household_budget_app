import type { BudgetItem } from "@/lib/data";
import BudgetRowForm from "./BudgetRowForm";

type Props = {
  items: BudgetItem[];
  year: number;
  month: number;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function BudgetTable({ items, year, month }: Props) {
  const totalBudget = items.reduce((s, i) => s + i.budgetAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
  const totalRemaining = totalBudget - totalActual;

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium">カテゴリ</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium">予算</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium">実績</th>
            <th className="px-1.5 sm:px-4 py-2 text-right font-medium whitespace-nowrap">残り/超過</th>
            <th className="px-1.5 sm:px-4 py-2 text-left font-medium w-24 hidden sm:table-cell">進捗</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const remaining = item.budgetAmount - item.actualAmount;
            const isOver = item.actualAmount > item.budgetAmount && item.budgetAmount > 0;
            const ratio = item.budgetAmount > 0
              ? Math.min(item.actualAmount / item.budgetAmount, 1)
              : 0;

            return (
              <tr key={item.category.id} className="border-b hover:bg-gray-50">
                <td className="px-1.5 sm:px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.category.color ?? "#B3B3B3" }}
                    />
                    <span className="whitespace-nowrap">{item.category.name}</span>
                  </div>
                </td>
                <td className="px-1.5 sm:px-4 py-2">
                  <BudgetRowForm
                    year={year}
                    month={month}
                    categoryId={item.category.id}
                    currentAmount={item.budgetAmount}
                  />
                </td>
                <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-red-600 whitespace-nowrap">
                  {fmt(item.actualAmount)}
                </td>
                <td className={`px-1.5 sm:px-4 py-2 text-right tabular-nums font-medium whitespace-nowrap ${
                  item.budgetAmount === 0 ? "text-gray-400" : isOver ? "text-red-600" : "text-green-700"
                }`}>
                  {item.budgetAmount === 0 ? "—" : isOver ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}
                </td>
                <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell">
                  {item.budgetAmount > 0 ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${isOver ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${ratio * 100}%` }} />
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
          <tr className="bg-gray-50 font-semibold">
            <td className="px-1.5 sm:px-4 py-2">合計</td>
            <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums whitespace-nowrap">{fmt(totalBudget)}</td>
            <td className="px-1.5 sm:px-4 py-2 text-right tabular-nums text-red-600 whitespace-nowrap">{fmt(totalActual)}</td>
            <td className={`px-1.5 sm:px-4 py-2 text-right tabular-nums whitespace-nowrap ${
              totalBudget === 0 ? "text-gray-400" : totalRemaining < 0 ? "text-red-600" : "text-green-700"
            }`}>
              {totalBudget === 0 ? "—" : totalRemaining < 0 ? `-${fmt(Math.abs(totalRemaining))}` : fmt(totalRemaining)}
            </td>
            <td className="px-1.5 sm:px-4 py-2 hidden sm:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

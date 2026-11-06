import type { ReactNode } from "react";

type Props = {
  name: string;
  color: string | null;
  periodLabel?: string;
  budget: number;
  actual: number;
  children: ReactNode;
};

function fmt(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export default function BudgetCategoryCard({ name, color, periodLabel, budget, actual, children }: Props) {
  const remaining = budget - actual;
  const isOver = budget > 0 && remaining < 0;

  return (
    <article className="min-w-0 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color ?? "#B3B3B3" }} />
            {name}
          </h3>
          {periodLabel && <p className="mt-1 text-xs text-gray-500">{periodLabel}</p>}
        </div>
        <p className={`text-sm font-semibold tabular-nums ${budget === 0 ? "text-gray-500" : isOver ? "text-red-600" : "text-green-700"}`}>
          {budget === 0 ? "予算未設定" : `${isOver ? "超過" : "残り"} ${fmt(Math.abs(remaining))}`}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span className="text-sm text-gray-500">予算</span>
        {children}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-gray-500">実績</span>
        <span className="font-medium tabular-nums">{fmt(actual)}</span>
      </div>
      {budget > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
          <div className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${Math.min((actual / budget) * 100, 100)}%` }} />
        </div>
      )}
    </article>
  );
}

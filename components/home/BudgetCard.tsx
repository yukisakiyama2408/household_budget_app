import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CategoryStat = {
  id: number;
  name: string;
  color: string | null;
  budget: number;
  actual: number;
};

type Props = {
  title: string;
  subtitle: string;
  totalBudget: number;
  totalActual: number;
  topCategories: CategoryStat[];
  linkHref: string;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function BudgetCard({ title, subtitle, totalBudget, totalActual, topCategories, linkHref }: Props) {
  const ratio = totalBudget > 0 ? Math.min(totalActual / totalBudget, 1) : 0;
  const isOver = totalActual > totalBudget && totalBudget > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <Link href={linkHref} className="text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5">詳細 →</Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalBudget > 0 ? (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">合計</span>
                <span className={`tabular-nums ${isOver ? "text-red-600" : "text-gray-700"}`}>
                  {fmt(totalActual)} / {fmt(totalBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${isOver ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-400 mt-0.5">{Math.round(ratio * 100)}%</p>
            </div>
            {topCategories.map((item) => {
              const r = Math.min(item.actual / item.budget, 1);
              const over = item.actual > item.budget;
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color ?? "#B3B3B3" }}
                      />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className={over ? "text-red-600" : "text-gray-500"}>
                      {Math.round(r * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${over ? "bg-red-400" : "bg-blue-400"}`}
                      style={{ width: `${r * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-sm text-gray-400">
            予算が設定されていません。
            <Link href={linkHref} className="text-blue-600 hover:underline ml-1">設定する →</Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

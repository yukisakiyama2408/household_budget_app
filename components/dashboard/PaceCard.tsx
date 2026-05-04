import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaceData } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.round(Math.abs(n)).toLocaleString("ja-JP")}`;
}

export default function PaceCard({
  dayOfMonth,
  daysRemaining,
  totalExpense,
  totalBudget,
  dailyAverage,
  projectedTotal,
  projectedDiff,
  safeDaily,
}: PaceData) {
  const hasBudget = totalBudget > 0;
  const isProjectedOver = projectedDiff > 0;
  const isAlreadyOver = totalExpense > totalBudget && hasBudget;
  const usageRatio = hasBudget ? Math.min(totalExpense / totalBudget, 1) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">今月のペース</CardTitle>
          <span className="text-xs text-gray-400">{dayOfMonth}日経過 / 残り{daysRemaining}日</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasBudget ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">今日から1日あたり使える金額</p>
                <p className={`text-2xl font-bold tabular-nums ${isAlreadyOver ? "text-red-500" : "text-gray-900"}`}>
                  {isAlreadyOver ? "予算超過中" : fmt(safeDaily)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">1日平均支出</p>
                <p className="text-sm font-medium tabular-nums text-gray-600">{fmt(dailyAverage)}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{fmt(totalExpense)} 使用</span>
                <span>予算 {fmt(totalBudget)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${isAlreadyOver ? "bg-red-400" : "bg-blue-400"}`}
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-400 mt-0.5">{Math.round(usageRatio * 100)}%</p>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs sm:text-sm pt-0.5 border-t ${isProjectedOver ? "text-red-500" : "text-green-600"}`}>
              <span>月末予測: <span className="font-medium tabular-nums">{fmt(projectedTotal)}</span></span>
              <span className="font-medium tabular-nums">
                {isProjectedOver
                  ? `▲ ${fmt(projectedDiff)} 超過見込み`
                  : `▼ ${fmt(Math.abs(projectedDiff))} 余る見込み`}
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">1日平均支出</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900">{fmt(dailyAverage)}</p>
            </div>
            <p className="text-sm text-gray-500">
              月末予測: <span className="font-medium tabular-nums text-gray-700">{fmt(projectedTotal)}</span>
            </p>
            <p className="text-xs text-gray-400">
              予算を設定すると使える金額の目安が表示されます
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

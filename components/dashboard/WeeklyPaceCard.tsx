import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function fmt(n: number) {
  return `¥${Math.round(Math.abs(n)).toLocaleString("ja-JP")}`;
}

type Props = {
  weekLabel: string;
  weekStart: string;
  weeklyBudget: number;
  weeklyExpense: number;
  dayOfWeek: number; // 1=Mon ... 7=Sun
};

export default function WeeklyPaceCard({ weekLabel, weekStart, weeklyBudget, weeklyExpense, dayOfWeek }: Props) {
  const hasBudget = weeklyBudget > 0;
  const daysRemaining = 7 - dayOfWeek;
  const isOver = hasBudget && weeklyExpense > weeklyBudget;
  const usageRatio = hasBudget ? Math.min(weeklyExpense / weeklyBudget, 1) : 0;
  const dailyAverage = dayOfWeek > 0 ? weeklyExpense / dayOfWeek : 0;
  const remaining = weeklyBudget - weeklyExpense;
  const safeDaily = !isOver && daysRemaining > 0 ? remaining / daysRemaining : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">今週のペース</CardTitle>
          <span className="text-xs text-gray-400">{weekLabel} · {dayOfWeek}日経過 / 残り{daysRemaining}日</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasBudget ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">今日から1日あたり使える金額</p>
                <p className={`text-2xl font-bold tabular-nums ${isOver ? "text-red-500" : "text-gray-900"}`}>
                  {isOver ? "予算超過中" : daysRemaining === 0 ? "-" : fmt(safeDaily)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">1日平均支出</p>
                <p className="text-sm font-medium tabular-nums text-gray-600">{fmt(dailyAverage)}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{fmt(weeklyExpense)} 使用</span>
                <span>週予算 {fmt(weeklyBudget)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${isOver ? "bg-red-400" : "bg-blue-400"}`}
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-400 mt-0.5">{Math.round(usageRatio * 100)}%</p>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs sm:text-sm pt-0.5 border-t ${isOver ? "text-red-500" : "text-green-600"}`}>
              <span className="font-medium tabular-nums">
                {isOver
                  ? `超過 +${fmt(weeklyExpense - weeklyBudget)}`
                  : `残り予算 ${fmt(remaining)}`}
              </span>
              <Link href={`/budget?view=weekly&weekStart=${weekStart}`} className="text-xs text-blue-600 hover:underline">
                週次予算 →
              </Link>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">今週の支出</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900">{fmt(weeklyExpense)}</p>
            </div>
            <p className="text-xs text-gray-400">
              週予算を設定すると使える金額の目安が表示されます。
              <Link href={`/budget?view=weekly&weekStart=${weekStart}`} className="text-blue-600 hover:underline ml-1">設定する →</Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

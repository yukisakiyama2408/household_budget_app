import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalWithProgress } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function GoalProgress({ goals }: { goals: GoalWithProgress[] }) {
  if (goals.length === 0) return null;

  const displayed = goals.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-gray-500">目標の進捗</CardTitle>
        <Link href="/budget" className="text-xs text-blue-600 hover:underline">
          管理 →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayed.map((goal) => {
          const isSavings = goal.type === "savings";
          const pct = Math.round(goal.progress * 100);
          const isOver = !goal.isOnTrack;
          const barColor = isSavings
            ? "bg-blue-400"
            : isOver
            ? "bg-red-400"
            : "bg-green-400";

          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`flex-shrink-0 text-xs px-1 py-0.5 rounded font-medium ${
                      isSavings
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isSavings ? "貯蓄" : "支出"}
                  </span>
                  <span className="truncate text-gray-700">{goal.title}</span>
                </div>
                <span
                  className={`flex-shrink-0 tabular-nums ${
                    isOver && !isSavings ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {isSavings
                    ? `${pct}%`
                    : isOver
                    ? `超過 +${fmt(goal.currentAmount - goal.target_amount)}`
                    : `残 ${fmt(goal.target_amount - goal.currentAmount)}`}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {goals.length > 3 && (
          <p className="text-xs text-gray-400 text-center">
            他 {goals.length - 3} 件の目標
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type MonthlyProps = {
  type: "monthly";
  year: number;
  month: number;
  budgetAmount: number;
  actualAmount: number;
};

type WeeklyProps = {
  type: "weekly";
  weekStart: string;
  weekLabel: string;
  budgetAmount: number;
  actualAmount: number;
};

type Props = MonthlyProps | WeeklyProps;

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function TotalBudgetCard(props: Props) {
  const budget = props.budgetAmount;
  const actual = props.actualAmount;
  const remaining = budget - actual;
  const isOver = actual > budget && budget > 0;
  const ratio = budget > 0 ? Math.min(actual / budget, 1) : 0;

  const label = props.type === "monthly" ? "月次合計予算" : "週次合計予算";
  const sublabel = props.type === "weekly" ? props.weekLabel : undefined;

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
          {budget > 0 ? (
            <span className="text-base font-bold tabular-nums text-gray-900">{fmt(budget)}</span>
          ) : (
            <span className="text-sm text-gray-400">未設定</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            実績: <span className="font-medium text-red-600 tabular-nums">{fmt(actual)}</span>
          </span>
          {budget > 0 && (
            <span className={`font-medium tabular-nums ${isOver ? "text-red-600" : "text-green-700"}`}>
              {isOver ? `超過: -${fmt(Math.abs(remaining))}` : `残り: ${fmt(remaining)}`}
            </span>
          )}
        </div>
      </div>
      {budget > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isOver ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right">{Math.round(ratio * 100)}%</p>
        </div>
      )}
    </div>
  );
}

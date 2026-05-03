import type { BudgetItem } from "@/lib/data";

type CategoryBreakdown = { name: string; amount: number; color: string };

type Props = {
  currentItems: BudgetItem[];
  prevBreakdown: CategoryBreakdown[];
  totalExpense: number;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

type InsightVariant = "red" | "yellow" | "green" | "blue";

function InsightCard({
  variant,
  title,
  children,
}: {
  variant: InsightVariant;
  title: string;
  children: React.ReactNode;
}) {
  const styles: Record<InsightVariant, string> = {
    red: "bg-red-50 border-red-200 text-red-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    green: "bg-green-50 border-green-200 text-green-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
  };
  const dotStyles: Record<InsightVariant, string> = {
    red: "bg-red-400",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    blue: "bg-blue-400",
  };

  return (
    <div className={`border rounded-md p-4 space-y-2 ${styles[variant]}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyles[variant]}`} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="text-sm space-y-1 pl-4">{children}</div>
    </div>
  );
}

export default function InsightCards({ currentItems, prevBreakdown, totalExpense }: Props) {
  const prevMap = new Map(prevBreakdown.map((c) => [c.name, c.amount]));

  // 予算超過
  const overBudget = currentItems.filter(
    (i) => i.budgetAmount > 0 && i.actualAmount > i.budgetAmount
  );

  // 先月比増加（今月実績あり・先月実績あり）
  const increased = currentItems
    .filter((i) => i.actualAmount > 0)
    .map((i) => {
      const prev = prevMap.get(i.category.name) ?? 0;
      const diff = i.actualAmount - prev;
      const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
      return { ...i, prev, diff, pct };
    })
    .filter((i) => i.diff > 0 && i.prev > 0)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
    .slice(0, 3);

  // 先月比削減
  const decreased = currentItems
    .filter((i) => i.actualAmount > 0)
    .map((i) => {
      const prev = prevMap.get(i.category.name) ?? 0;
      const diff = i.actualAmount - prev;
      return { ...i, prev, diff };
    })
    .filter((i) => i.diff < 0 && i.prev > 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  // 支出集中（最大カテゴリ）
  const topCategory =
    totalExpense > 0
      ? currentItems
          .filter((i) => i.actualAmount > 0)
          .sort((a, b) => b.actualAmount - a.actualAmount)[0]
      : null;
  const topPct = topCategory && totalExpense > 0
    ? Math.round((topCategory.actualAmount / totalExpense) * 100)
    : 0;

  const hasInsights =
    overBudget.length > 0 || increased.length > 0 || decreased.length > 0 || topCategory;

  if (!hasInsights) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        今月のデータが少ないため、インサイトを生成できません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {overBudget.length > 0 && (
        <InsightCard variant="red" title="予算超過アラート">
          {overBudget.map((i) => (
            <p key={i.category.id}>
              <span className="font-medium">{i.category.name}</span> が予算を{" "}
              <span className="font-medium">{fmt(i.actualAmount - i.budgetAmount)}</span> 超過しています
              （{fmt(i.actualAmount)} / 予算 {fmt(i.budgetAmount)}）
            </p>
          ))}
        </InsightCard>
      )}

      {increased.length > 0 && (
        <InsightCard variant="yellow" title="先月比 増加傾向">
          {increased.map((i) => (
            <p key={i.category.id}>
              <span className="font-medium">{i.category.name}</span> が先月比{" "}
              <span className="font-medium">+{i.pct}%</span>（+{fmt(i.diff)}）増加しています
            </p>
          ))}
        </InsightCard>
      )}

      {decreased.length > 0 && (
        <InsightCard variant="green" title="先月比 削減できたカテゴリ">
          {decreased.map((i) => (
            <p key={i.category.id}>
              <span className="font-medium">{i.category.name}</span> を先月比{" "}
              <span className="font-medium">{fmt(Math.abs(i.diff))}</span> 削減できました
            </p>
          ))}
        </InsightCard>
      )}

      {topCategory && topPct >= 30 && (
        <InsightCard variant="blue" title="支出の集中">
          <p>
            支出の <span className="font-medium">{topPct}%</span> が{" "}
            <span className="font-medium">{topCategory.category.name}</span> に集中しています
            （{fmt(topCategory.actualAmount)}）
          </p>
        </InsightCard>
      )}
    </div>
  );
}

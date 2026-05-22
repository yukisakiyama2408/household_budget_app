"use client";

import Link from "next/link";
import type { TransactionWithCategory } from "@/lib/data";

const CATEGORY_ICONS: Record<string, string> = {
  食費: "🛒",
  外食費: "🍱",
  接待交際費: "🍻",
  娯楽費: "🎬",
  スマホ代: "📱",
  生活品: "🧴",
};

type Props = {
  transactions: TransactionWithCategory[];
  filterCategory: string | null;
  onClearFilter: () => void;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function RecentTransactionsCard({
  transactions,
  filterCategory,
  onClearFilter,
}: Props) {
  const shown = (
    filterCategory
      ? transactions.filter((t) => t.categories?.name === filterCategory)
      : transactions
  ).slice(0, 8);

  const filterColor = filterCategory
    ? (transactions.find((t) => t.categories?.name === filterCategory)?.categories?.color ??
        "#B3B3B3")
    : null;

  return (
    <div className="rounded-2xl border bg-card" style={{ padding: "10px 22px 14px" }}>
      <div className="flex justify-between items-center py-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-[13px] font-semibold">直近の取引</div>
          {filterCategory && filterColor && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: `${filterColor}1f`,
                color: filterColor,
              }}
            >
              {filterCategory}
              <button
                onClick={onClearFilter}
                className="opacity-70 text-sm leading-none hover:opacity-100 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3.5 items-center flex-shrink-0">
          <Link
            href="/transactions/new"
            className="text-[11px] font-semibold"
            style={{ color: "var(--primary)" }}
          >
            + 追加
          </Link>
          <Link href="/transactions" className="text-[11px] text-blue-600 hover:underline">
            一覧 →
          </Link>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-7 text-center text-[12px] text-muted-foreground">
          {filterCategory ? "このカテゴリの取引はありません" : "取引がありません"}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {shown.map((t) => {
            const catColor = t.categories?.color ?? "#B3B3B3";
            const catName = t.categories?.name ?? "";
            const icon =
              t.type === "income" ? "↗" : (CATEGORY_ICONS[catName] ?? "•");

            return (
              <div
                key={t.id}
                className="flex items-center gap-3.5 px-2.5 py-3 -mx-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div
                  className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0"
                  style={{ width: 42 }}
                >
                  {t.date.slice(5).replace("-", "/")}
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 text-[15px]"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: `${catColor}1f`,
                    color: catColor,
                  }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] truncate">{t.content}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{catName}</div>
                </div>
                <div
                  className={`text-[14px] font-semibold tabular-nums flex-shrink-0 ${
                    t.type === "income" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {fmt(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

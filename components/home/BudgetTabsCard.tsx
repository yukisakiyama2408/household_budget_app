"use client";

import { useState } from "react";
import Link from "next/link";

export type BudgetCategoryItem = {
  id: number;
  name: string;
  color: string | null;
  budget: number;
  actual: number;
};

export type BudgetTabData = {
  subtitle: string;
  linkHref: string;
  totalBudget: number;
  totalActual: number;
  categories: BudgetCategoryItem[];
};

type Props = {
  weeklyData: BudgetTabData;
  monthlyData: BudgetTabData;
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
};

const FALLBACK_COLORS: Record<string, string> = {
  食費: "#ec4899",
  外食費: "#ef4444",
  接待交際費: "#3b82f6",
  娯楽費: "#f59e0b",
  スマホ代: "#8b5cf6",
  生活品: "#06b6d4",
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function BudgetTabsCard({
  weeklyData,
  monthlyData,
  selectedCategory,
  onCategorySelect,
}: Props) {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const active = tab === "weekly" ? weeklyData : monthlyData;

  const totalPct =
    active.totalBudget > 0 ? Math.round((active.totalActual / active.totalBudget) * 100) : 0;
  const isOver = active.totalActual > active.totalBudget && active.totalBudget > 0;

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-secondary rounded-[10px]">
          {(["weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 text-xs font-semibold rounded-[7px] transition-all"
              style={{
                background: tab === t ? "var(--card)" : "transparent",
                color: tab === t ? "var(--primary)" : "var(--muted-foreground)",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {t === "weekly" ? "今週の予算消化" : "今月の予算消化"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">{active.subtitle}</span>
          <Link href={active.linkHref} className="text-[11px] text-blue-600 hover:underline">
            詳細 →
          </Link>
        </div>
      </div>

      {active.totalBudget === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          予算が設定されていません。
          <Link href={active.linkHref} className="text-blue-600 hover:underline ml-1">
            設定する →
          </Link>
        </p>
      ) : (
        <>
          <div className="mb-2">
            <div className="flex justify-between items-baseline mb-1.5">
              <div className="text-[11px] text-muted-foreground">合計</div>
              <div
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: isOver ? "var(--destructive)" : "inherit" }}
              >
                {totalPct}%
              </div>
            </div>
            <div className="flex justify-between items-baseline mb-2">
              <div
                className="font-bold tabular-nums"
                style={{ fontSize: "20px", letterSpacing: "-0.5px" }}
              >
                {fmt(active.totalActual)}
              </div>
              <div className="text-[12px] text-muted-foreground tabular-nums">
                / {fmt(active.totalBudget)}
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(totalPct, 100)}%`,
                  background: isOver ? "var(--destructive)" : "var(--primary)",
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="text-[11px] text-muted-foreground mb-2.5">カテゴリ別</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7">
              {active.categories.map((cat) => {
                const color = cat.color ?? FALLBACK_COLORS[cat.name] ?? "#B3B3B3";
                const catPct =
                  cat.budget > 0 ? Math.round((cat.actual / cat.budget) * 100) : 0;
                const catOver = cat.actual > cat.budget && cat.budget > 0;
                const isSel = selectedCategory === cat.name;

                return (
                  <div
                    key={cat.id}
                    onClick={() => onCategorySelect(isSel ? null : cat.name)}
                    className={`px-2 py-2 -mx-2 mb-0.5 rounded-lg cursor-pointer transition-colors ${
                      isSel ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block rounded-full flex-shrink-0"
                          style={{ width: 7, height: 7, background: color }}
                        />
                        <span className={isSel ? "font-semibold" : "font-medium"}>{cat.name}</span>
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: catOver ? "var(--destructive)" : "inherit" }}
                      >
                        {catPct}%
                      </span>
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(catPct, 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                      <span>{fmt(cat.actual)}</span>
                      <span>/ {fmt(cat.budget)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { upsertMonthlyTotalBudget, upsertWeeklyTotalBudget } from "@/lib/actions";

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
  const [value, setValue] = useState(String(props.budgetAmount || ""));
  const [isPending, startTransition] = useTransition();

  const budget = props.budgetAmount;
  const actual = props.actualAmount;
  const remaining = budget - actual;
  const isOver = actual > budget && budget > 0;
  const ratio = budget > 0 ? Math.min(actual / budget, 1) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(value) || 0;
    startTransition(async () => {
      if (props.type === "monthly") {
        await upsertMonthlyTotalBudget(props.year, props.month, amount);
      } else {
        await upsertWeeklyTotalBudget(props.weekStart, amount);
      }
    });
  }

  const label = props.type === "monthly" ? "合計予算（月次）" : `合計予算（週次）`;

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{label}:</span>
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              min={0}
              className="w-36 border rounded px-2 py-1 text-right text-sm tabular-nums"
            />
            <span className="text-gray-400 text-sm">円</span>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "…" : "保存"}
            </button>
          </form>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            実績:{" "}
            <span className="font-medium text-red-600 tabular-nums">{fmt(actual)}</span>
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

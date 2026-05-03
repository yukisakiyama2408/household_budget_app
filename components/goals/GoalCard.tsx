"use client";

import { useState } from "react";
import { deleteGoal } from "@/app/actions/goals";
import type { GoalWithProgress } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`「${goal.title}」を削除しますか？`)) return;
    setDeleting(true);
    await deleteGoal(goal.id);
  }

  const isSavings = goal.type === "savings";
  const pct = Math.round(goal.progress * 100);
  const days = goal.deadline ? daysUntil(goal.deadline) : null;
  const isOver = !goal.isOnTrack;

  const barColor = isSavings
    ? "bg-blue-500"
    : isOver
    ? "bg-red-500"
    : "bg-green-500";

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                isSavings
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isSavings ? "貯蓄" : "支出削減"}
            </span>
            {goal.categoryName && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: goal.categoryColor ?? "#B3B3B3" }}
                />
                {goal.categoryName}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800">{goal.title}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* 進捗バー */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {isSavings ? "現在の残高" : "今月の支出"}: {fmt(goal.currentAmount)}
          </span>
          <span className={isOver && !isSavings ? "text-red-600 font-medium" : ""}>
            {isSavings ? "目標" : "上限"}: {fmt(goal.target_amount)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={`font-medium ${isOver && !isSavings ? "text-red-600" : "text-gray-600"}`}>
            {isSavings ? `${pct}% 達成` : isOver ? `超過 +${fmt(goal.currentAmount - goal.target_amount)}` : `残り ${fmt(goal.target_amount - goal.currentAmount)}`}
          </span>
          {days !== null && (
            <span className={`${days < 0 ? "text-red-500" : days <= 30 ? "text-yellow-600" : "text-gray-400"}`}>
              {days < 0 ? `${Math.abs(days)}日超過` : `残り${days}日`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

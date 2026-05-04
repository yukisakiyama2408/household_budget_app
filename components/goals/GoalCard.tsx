"use client";

import { useState } from "react";
import { deleteGoal, updateGoal } from "@/app/actions/goals";
import type { GoalWithProgress } from "@/lib/data";
import type { Category } from "@/types/database";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type Props = {
  goal: GoalWithProgress;
  categories?: Category[];
};

export default function GoalCard({ goal, categories = [] }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSavings = goal.type === "savings";
  const pct = Math.round(goal.progress * 100);
  const days = goal.deadline ? daysUntil(goal.deadline) : null;
  const isOver = !goal.isOnTrack;

  const barColor = isSavings
    ? "bg-blue-500"
    : isOver
    ? "bg-red-500"
    : "bg-green-500";

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  async function handleDelete() {
    if (!confirm(`「${goal.title}」を削除しますか？`)) return;
    setDeleting(true);
    await deleteGoal(goal.id);
  }

  async function handleSave(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    await updateGoal(goal.id, formData);
    setEditing(false);
    setSaving(false);
  }

  return (
    <>
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

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

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">目標を編集</p>
              <button type="button" onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">タイトル</label>
              <input
                name="title"
                required
                defaultValue={goal.title}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {isSavings ? "目標金額（円）" : "月の上限金額（円）"}
              </label>
              <input
                name="target_amount"
                type="number"
                required
                min={1}
                defaultValue={goal.target_amount}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {!isSavings && expenseCategories.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">カテゴリ</label>
                <select
                  name="category_id"
                  defaultValue={goal.category_id ?? ""}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">選択なし</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">期限</label>
              <input
                name="deadline"
                type="date"
                defaultValue={goal.deadline ?? ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 border text-sm rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

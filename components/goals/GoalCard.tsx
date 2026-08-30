"use client";

import { useState } from "react";
import { deleteGoal, updateGoal } from "@/app/actions/goals";
import type { GoalWithProgress } from "@/lib/data";
import type { Category } from "@/types/database";
import { CalendarDays, Check, Flag, Trash2, Utensils } from "lucide-react";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function fmtSigned(n: number) {
  return `${n < 0 ? "-" : ""}¥${Math.abs(n).toLocaleString("ja-JP")}`;
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
  const [error, setError] = useState("");

  const isSavings = goal.type === "savings";
  const pct = Math.round(goal.progress * 100);
  const days = goal.deadline ? daysUntil(goal.deadline) : null;
  const isOver = !goal.isOnTrack;

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const milestones = [0, 25, 50, 75, 100];

  async function handleDelete() {
    if (!confirm(`「${goal.title}」を削除しますか？`)) return;
    setDeleting(true);
    setError("");
    try {
      await deleteGoal(goal.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "目標を削除できませんでした。");
      setDeleting(false);
    }
  }

  async function handleSave(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await updateGoal(goal.id, formData);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "目標を保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isSavings ? "bg-indigo-100 text-indigo-700" : isOver ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                {isSavings ? <Flag className="size-5" /> : <Utensils className="size-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">{isSavings ? "貯蓄目標" : `${goal.categoryName ?? "支出"}の月間上限`}</p>
                <h3 className="mt-1 truncate text-lg font-bold text-gray-950">{goal.title}</h3>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={() => { setError(""); setEditing(true); }} className="rounded-lg px-2.5 py-2 text-xs font-bold text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">編集</button>
              <button onClick={handleDelete} disabled={deleting} aria-label={`${goal.title}を削除`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
            </div>
          </div>

          {isSavings ? (
            <>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs text-gray-500">現在の貯蓄額</p><p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">{fmtSigned(goal.currentAmount)}</p><p className="mt-1 text-xs text-gray-400">目標 {fmt(goal.target_amount)} · {pct}% 達成</p></div>
                {days !== null && <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${days < 0 ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"}`}><CalendarDays className="size-4" />{days < 0 ? `${Math.abs(days)}日超過` : `期限まであと ${days}日`}</div>}
              </div>

              <div className="relative mt-9 px-1 pb-2">
                <div className="absolute left-4 right-4 top-3 h-0.5 bg-slate-100" />
                <div className="absolute left-4 top-3 h-0.5 max-w-[calc(100%-2rem)] bg-indigo-500" style={{ width: `calc(${Math.min(pct, 100)}% - ${Math.min(pct, 100) * 0.32}px)` }} />
                <div className="relative flex justify-between">
                  {milestones.map((milestone) => {
                    const done = pct >= milestone;
                    return (
                      <div key={milestone} className="flex w-10 flex-col items-center">
                        <div className={`grid size-6 place-items-center rounded-full border-2 ${done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-transparent"}`}>
                          {done && <Check className="size-3.5 stroke-[3]" />}
                        </div>
                        <span className={`mt-2 text-[10px] font-bold ${done ? "text-indigo-700" : "text-gray-400"}`}>{milestone}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {goal.monthlyRequiredAmount > 0 && <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-medium text-indigo-800">予定どおり進むための今月の目安</span><span className="text-sm font-bold text-indigo-700">{fmt(goal.monthlyRequiredAmount)}</span></div>}
            </>
          ) : (
            <div className="mt-7">
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs text-gray-500">今月の支出</p><p className={`mt-1 text-3xl font-bold tracking-tight ${isOver ? "text-red-600" : "text-gray-950"}`}>{fmtSigned(goal.currentAmount)}</p></div><p className="text-xs text-gray-500">上限 {fmt(goal.target_amount)}</p></div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-indigo-600"}`} style={{ width: `${pct}%` }} /></div>
              <p className={`mt-3 text-xs font-bold ${isOver ? "text-red-600" : "text-indigo-700"}`}>{isOver ? `上限を ${fmt(goal.currentAmount - goal.target_amount)} 超えています` : `あと ${fmt(goal.target_amount - goal.currentAmount)} 使えます`}</p>
            </div>
          )}
        {error && !editing && <p role="alert" className="text-xs text-red-600">{error}</p>}
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

            {isSavings && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">現在の貯蓄額（円）</label>
                <input name="saved_amount" type="number" required min={0} defaultValue={goal.saved_amount} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            )}

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
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      )}
    </>
  );
}

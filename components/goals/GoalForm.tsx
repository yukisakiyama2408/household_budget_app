"use client";

import { useState } from "react";
import { createGoal } from "@/app/actions/goals";
import type { Category } from "@/types/database";

export default function GoalForm({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"savings" | "expense">("savings");
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" || c.type === "both"
  );

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createGoal(formData);
    setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
      >
        + 目標を追加
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">新しい目標</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 種別 */}
            <div className="flex rounded-md border overflow-hidden text-sm">
              {(["savings", "expense"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 transition-colors ${
                    type === t
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "savings" ? "貯蓄目標" : "支出削減目標"}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={type} />

            {/* タイトル */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">タイトル</label>
              <input
                name="title"
                required
                placeholder={type === "savings" ? "例：旅行用貯金" : "例：食費を抑える"}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* 目標金額 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {type === "savings" ? "目標金額（円）" : "月の上限金額（円）"}
              </label>
              <input
                name="target_amount"
                type="number"
                required
                min={1}
                placeholder="例：500000"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* 支出削減：カテゴリ */}
            {type === "expense" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">カテゴリ</label>
                <select
                  name="category_id"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="">選択してください</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 期限 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                期限{type === "expense" ? "（任意）" : ""}
              </label>
              <input
                name="deadline"
                type="date"
                required={type === "savings"}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
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

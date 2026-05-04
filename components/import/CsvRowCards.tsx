"use client";

import { useRef, useState, useEffect } from "react";
import type { Category } from "@/types/database";

export type ParsedRow = {
  date: string;
  content: string;
  amount: number;
  type: "income" | "expense";
  category_id: number | null;
  pay_method: "Cash" | "Credit" | null;
  store: string | null;
};

type IndexedRow = { row: ParsedRow; originalIndex: number };

type Props = {
  filteredIndexedRows: IndexedRow[];
  categories: Category[];
  updateRow: (index: number, field: keyof ParsedRow, value: string | number | null) => void;
  removeRow: (index: number) => void;
  getDuplicateLevel: (row: ParsedRow) => "high" | "low" | null;
};

export default function CsvRowCards({
  filteredIndexedRows,
  categories,
  updateRow,
  removeRow,
  getDuplicateLevel,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    setCurrentIdx(0);
  }, [filteredIndexedRows.length]);

  const safeIdx = Math.min(currentIdx, filteredIndexedRows.length - 1);
  const current = filteredIndexedRows[safeIdx];

  if (!current) return null;

  const { row, originalIndex } = current;
  const dupLevel = getDuplicateLevel(row);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50 && safeIdx < filteredIndexedRows.length - 1) {
      setCurrentIdx(safeIdx + 1);
    } else if (delta < -50 && safeIdx > 0) {
      setCurrentIdx(safeIdx - 1);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`border rounded-xl p-4 space-y-3 ${
          dupLevel === "high"
            ? "bg-orange-50 border-orange-200"
            : dupLevel === "low"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white"
        }`}
      >
        {/* Header: date + amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {row.date.slice(5).replace("-", "/")}
            </span>
            {dupLevel && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  dupLevel === "high"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {dupLevel === "high" ? "重複大" : "重複?"}
              </span>
            )}
          </div>
          <span
            className={`text-base font-bold tabular-nums ${
              row.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {row.type === "income" ? "+" : "-"}¥{row.amount.toLocaleString("ja-JP")}
          </span>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateRow(originalIndex, "type", "expense")}
            className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
              row.type === "expense"
                ? "bg-red-50 border-red-300 text-red-700 font-medium"
                : "border-gray-200 text-gray-400"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => updateRow(originalIndex, "type", "income")}
            className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
              row.type === "income"
                ? "bg-green-50 border-green-300 text-green-700 font-medium"
                : "border-gray-200 text-gray-400"
            }`}
          >
            収入
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">内容</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={row.content}
            onChange={(e) => updateRow(originalIndex, "content", e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">カテゴリ</label>
          <select
            value={row.category_id ?? ""}
            onChange={(e) =>
              updateRow(
                originalIndex,
                "category_id",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">未設定</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Store */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">店舗</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={row.store ?? ""}
            onChange={(e) => updateRow(originalIndex, "store", e.target.value || null)}
          />
        </div>

        {/* Delete */}
        <div className="flex justify-end">
          <button
            onClick={() => removeRow(originalIndex)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 border border-gray-200 rounded"
          >
            この明細を削除
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setCurrentIdx(Math.max(0, safeIdx - 1))}
          disabled={safeIdx === 0}
          className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
        >
          ← 前
        </button>
        <span className="text-sm text-gray-500 tabular-nums font-medium">
          {safeIdx + 1} / {filteredIndexedRows.length}
        </span>
        <button
          onClick={() => setCurrentIdx(Math.min(filteredIndexedRows.length - 1, safeIdx + 1))}
          disabled={safeIdx === filteredIndexedRows.length - 1}
          className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
        >
          次 →
        </button>
      </div>
    </div>
  );
}

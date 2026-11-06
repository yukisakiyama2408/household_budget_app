"use client";

import { useState, useTransition } from "react";
import { upsertBudget } from "@/lib/actions";

type Props = {
  year: number;
  month: number;
  categoryId: number;
  currentAmount: number;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function BudgetRowForm({ year, month, categoryId, currentAmount }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await upsertBudget(year, month, categoryId, Number(value) || 0);
      setEditing(false);
    });
  }

  function handleCancel() {
    setValue(String(currentAmount || ""));
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <span className="tabular-nums text-xs sm:text-sm">{fmt(currentAmount)}</span>
        <button
          onClick={() => setEditing(true)}
          className="min-h-11 px-3 md:min-h-0 md:px-2 md:py-1 text-sm md:text-xs text-gray-500 border rounded hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 md:gap-1">
      <input
        aria-label="予算額（円）"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
        className="h-11 w-28 min-w-0 border rounded px-2 text-right text-base md:h-8 md:text-sm tabular-nums"
        min={0}
        placeholder="0"
        autoFocus
      />
      <button
        type="button"
        aria-label="予算を保存"
        onClick={handleSave}
        disabled={isPending}
        className="min-h-11 min-w-11 px-2 md:min-h-8 md:min-w-8 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "…" : "✓"}
      </button>
      <button
        type="button"
        aria-label="編集をキャンセル"
        onClick={handleCancel}
        className="min-h-11 min-w-11 px-2 md:min-h-8 md:min-w-8 text-xs text-gray-500 border rounded hover:bg-gray-50"
      >
        ✕
      </button>
    </div>
  );
}

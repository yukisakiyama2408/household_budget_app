"use client";

import { useState, useTransition } from "react";
import { upsertWeeklyBudget } from "@/lib/actions";

type Props = {
  weekStart: string;
  categoryId: number;
  currentAmount: number;
  derivedAmount: number;
};

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function WeeklyBudgetRowForm({
  weekStart,
  categoryId,
  currentAmount,
  derivedAmount,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await upsertWeeklyBudget(weekStart, categoryId, Number(value) || 0);
      setEditing(false);
    });
  }

  function handleCancel() {
    setValue(String(currentAmount || ""));
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="tabular-nums text-gray-500 text-xs">
          {currentAmount > 0 ? fmt(currentAmount) : `参考: ${fmt(derivedAmount)}`}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="px-2 py-0.5 text-xs text-gray-500 border rounded hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
        placeholder={String(derivedAmount || "")}
        className="w-28 border rounded px-2 py-1 text-right text-sm tabular-nums"
        min={0}
        autoFocus
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "…" : "保存"}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="px-2 py-1 text-xs text-gray-500 border rounded hover:bg-gray-50"
      >
        ✕
      </button>
    </div>
  );
}

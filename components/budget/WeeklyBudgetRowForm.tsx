"use client";

import { useState, useTransition } from "react";
import { upsertWeeklyBudget } from "@/lib/actions";

type Props = {
  weekStart: string;
  categoryId: number;
  currentAmount: number;   // 登録済み金額（0=未登録）
  derivedAmount: number;   // 月次÷週数の参考値
};

export default function WeeklyBudgetRowForm({
  weekStart,
  categoryId,
  currentAmount,
  derivedAmount,
}: Props) {
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertWeeklyBudget(weekStart, categoryId, Number(value) || 0);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-end gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={String(derivedAmount || "")}
        className="w-28 border rounded px-2 py-1 text-right text-sm tabular-nums"
        min={0}
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "…" : "保存"}
      </button>
    </form>
  );
}

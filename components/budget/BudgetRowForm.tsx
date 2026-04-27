"use client";

import { useState, useTransition } from "react";
import { upsertBudget } from "@/lib/actions";

type Props = {
  year: number;
  month: number;
  categoryId: number;
  currentAmount: number;
};

export default function BudgetRowForm({ year, month, categoryId, currentAmount }: Props) {
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertBudget(year, month, categoryId, Number(value) || 0);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-end gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-28 border rounded px-2 py-1 text-right text-sm tabular-nums"
        min={0}
        placeholder="0"
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

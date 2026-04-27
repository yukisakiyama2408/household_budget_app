"use client";

import { useState, useTransition } from "react";
import { upsertYearlyBudget } from "@/lib/actions";

type Props = {
  year: number;
  currentAmount: number;
};

export default function YearlyBudgetForm({ year, currentAmount }: Props) {
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertYearlyBudget(year, Number(value) || 0);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-36 border rounded px-2 py-1.5 text-right text-sm tabular-nums"
        min={0}
        placeholder="0"
      />
      <span className="text-gray-500 text-sm">円</span>
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}

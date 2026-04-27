"use client";

import { useTransition, useState } from "react";
import { upsertCreditSettlement } from "@/lib/actions";

type Props = {
  year: number;
  month: number;
  currentAmount: number;
};

export default function CreditSettlementForm({ year, month, currentAmount }: Props) {
  const [value, setValue] = useState(String(currentAmount || ""));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(value) || 0;
    startTransition(async () => {
      await upsertCreditSettlement(year, month, amount);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 text-xs mt-1 mb-3">
      <span className="text-gray-500">クレジット引き落とし（27日）</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-32 border rounded px-2 py-1 text-right tabular-nums text-sm"
        min={0}
        placeholder="0"
      />
      <span className="text-gray-400">円</span>
      <button
        type="submit"
        disabled={isPending}
        className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}

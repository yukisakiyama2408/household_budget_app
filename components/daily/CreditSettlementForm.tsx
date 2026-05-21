"use client";

import { useTransition, useState } from "react";
import { upsertCreditSettlement } from "@/lib/actions";

type Props = {
  year: number;
  month: number;
  currentAmount: number;
  settlementDate: string | null;
};

export default function CreditSettlementForm({ year, month, currentAmount, settlementDate }: Props) {
  const defaultDate = settlementDate ?? `${year}-${String(month).padStart(2, "0")}-27`;
  const [value, setValue] = useState(String(currentAmount || ""));
  const [date, setDate] = useState(defaultDate);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const amount = Number(value) || 0;
    startTransition(async () => {
      await upsertCreditSettlement(year, month, amount, date);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 text-xs mt-1 mb-3">
      <span className="text-gray-500">クレジット引き落とし</span>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
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

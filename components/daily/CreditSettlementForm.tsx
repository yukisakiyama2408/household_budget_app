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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-3 sm:px-5">
      <span className="text-xs font-bold text-gray-600">クレジット引き落とし設定</span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-gray-500">
          引落日
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border bg-white px-2 text-sm text-gray-700"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          金額
          <span className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-9 w-32 rounded-lg border bg-white pl-7 pr-3 text-right text-sm tabular-nums text-gray-700"
              min={0}
              placeholder="0"
            />
          </span>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useTransition, useState } from "react";
import { upsertCreditSettlement } from "@/lib/actions";
import { validateCreditSettlement } from "@/lib/credit-settlements";

type Props = {
  year: number;
  month: number;
  currentAmount: number | null;
  settlementDate: string | null;
};

export default function CreditSettlementForm({ year, month, currentAmount, settlementDate }: Props) {
  const targetMonth = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  const defaultDate = settlementDate ?? `${targetMonth}-27`;
  const [value, setValue] = useState(currentAmount === null ? "" : String(currentAmount));
  const [date, setDate] = useState(defaultDate);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const amount = Number(value);
    startTransition(async () => {
      try {
        validateCreditSettlement(year, month, amount, date);
        await upsertCreditSettlement(year, month, amount, date);
        setMessage(`${year}年${month}月の引落額を保存しました。`);
      } catch (error) {
        setError(error instanceof Error ? error.message : "保存できませんでした。もう一度お試しください。");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={isPending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <legend className="sr-only">{year}年{month}月のカード引落額を登録・修正</legend>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-600">
          引落日
          <input
            type="date"
            value={date}
            required
            min={`${targetMonth}-01`}
            max={`${targetMonth}-${new Date(year, month, 0).getDate()}`}
            onChange={(e) => { setDate(e.target.value); setMessage(null); setError(null); }}
            className="h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-base text-gray-900"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-600">
          引落額（円）
          <span className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span>
            <input
              type="number"
              inputMode="numeric"
              required
              step={1}
              value={value}
              onChange={(e) => { setValue(e.target.value); setMessage(null); setError(null); }}
              className="h-11 w-full min-w-0 rounded-lg border bg-white pl-7 pr-3 text-right text-base tabular-nums text-gray-900"
              min={0}
              placeholder="0"
            />
          </span>
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {isPending ? "保存中…" : "引落額を保存"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { applyFixedExpensesAction } from "@/lib/actions";

export default function ApplyFixedExpensesButton() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [result, setResult] = useState<{ applied: number; skipped: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    setResult(null);
    startTransition(async () => {
      const r = await applyFixedExpensesAction(year, month);
      setResult(r);
    });
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setResult(null); }}
          className="border rounded px-2 py-1.5 text-sm bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => { setMonth(Number(e.target.value)); setResult(null); }}
          className="border rounded px-2 py-1.5 text-sm bg-white"
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
        <Button onClick={handleApply} disabled={isPending} size="sm">
          {isPending ? "適用中..." : "適用する"}
        </Button>
      </div>
      {result && (
        <p className="text-sm text-gray-600">
          {result.applied > 0
            ? `${result.applied}件を登録しました`
            : "新たに登録する固定費はありませんでした"}
          {result.skipped > 0 && `（${result.skipped}件はすでに適用済み）`}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { applyFixedExpensesAction } from "@/lib/actions";

export default function ApplyFixedExpensesButton({ year, month }: { year: number; month: number }) {
  const [result, setResult] = useState<{ applied: number; skipped: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    setResult(null);
    startTransition(async () => {
      const r = await applyFixedExpensesAction(year, month);
      setResult(r);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleApply} disabled={isPending} className="min-h-11">
          {isPending ? "適用中..." : `${year}年${month}月に適用する`}
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

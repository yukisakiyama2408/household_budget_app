"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toggleAnalysisAdvice } from "@/app/actions/analysis-results";
import type { AnalysisResultWithAdvices } from "@/types/database";

const viewLabels = { monthly: "月次", weekly: "週次", yearly: "年次" } as const;

function AdviceCheckbox({ id, initialCompleted, content }: { id: number; initialCompleted: boolean; content: string }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setCompleted(next);
    startTransition(async () => {
      try {
        await toggleAnalysisAdvice(id, next);
      } catch {
        setCompleted(!next);
      }
    });
  }

  return (
    <label className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${completed ? "border-green-200 bg-green-50 text-gray-500" : "border-gray-200 bg-white text-gray-800"}`}>
      <input
        type="checkbox"
        checked={completed}
        disabled={pending}
        onChange={(event) => change(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600"
      />
      <span className={completed ? "line-through" : ""}>{content}</span>
    </label>
  );
}

export default function AnalysisResultList({ results }: { results: AnalysisResultWithAdvices[] }) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set(results.slice(0, 1).map((result) => result.id)));

  if (results.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">登録済みの分析結果はありません。</p>;
  }

  function toggleOpen(id: number) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const completed = result.analysis_advices.filter((advice) => advice.is_completed).length;
        const total = result.analysis_advices.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isOpen = openIds.has(result.id);

        return (
          <article key={result.id} className="overflow-hidden rounded-lg border bg-white">
            <button type="button" onClick={() => toggleOpen(result.id)} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{result.title}</h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{viewLabels[result.analysis_view]}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{result.period_label} · {result.date_from}〜{result.date_to}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {total > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> {completed}/{total}（{progress}%）
                  </span>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            {isOpen && (
              <div className="space-y-4 border-t p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{result.content}</div>
                {total > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <h4 className="font-semibold text-gray-800">アドバイスの遂行状況</h4>
                      <span className="text-gray-500">達成率 {progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="space-y-2">
                      {result.analysis_advices.map((advice) => (
                        <AdviceCheckbox key={advice.id} id={advice.id} initialCompleted={advice.is_completed} content={advice.content} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

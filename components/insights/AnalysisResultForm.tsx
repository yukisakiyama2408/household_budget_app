"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnalysisResult, type AnalysisResultActionState } from "@/app/actions/analysis-results";
import type { AnalysisView } from "@/types/database";

type Props = {
  target: { dateFrom: string; dateTo: string; label: string };
  analysisView: AnalysisView;
};

const initialState: AnalysisResultActionState = { ok: false, message: "" };

export default function AnalysisResultForm({ target, analysisView }: Props) {
  const [state, formAction, pending] = useActionState(createAnalysisResult, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="analysisView" value={analysisView} />
      <input type="hidden" name="periodLabel" value={target.label} />
      <input type="hidden" name="dateFrom" value={target.dateFrom} />
      <input type="hidden" name="dateTo" value={target.dateTo} />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700">タイトル</span>
          <input
            name="title"
            required
            maxLength={120}
            placeholder={`${target.label}の振り返り`}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <p className="pb-2 text-xs text-gray-500">対象: {target.label}</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-gray-700">分析結果</span>
        <textarea
          name="content"
          required
          maxLength={10000}
          rows={8}
          placeholder="ChatGPTの分析結果を貼り付けてください"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-gray-700">実行するアドバイス</span>
        <textarea
          name="advices"
          maxLength={10000}
          rows={4}
          placeholder={"食費は週8,000円以内にする\nコンビニ利用を週2回までにする"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="block text-xs text-gray-500">1行につき1件。登録後に達成状況をチェックできます。</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "登録中…" : "分析結果を登録"}
        </button>
        {state.message && (
          <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

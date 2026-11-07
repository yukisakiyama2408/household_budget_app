"use client";

import { useState } from "react";

import { TEMPLATES } from "@/lib/prompts/templates";
export { TEMPLATES } from "@/lib/prompts/templates";

type Props = {
  mode?: "analysis" | "all";
  target?: { dateFrom: string; dateTo: string; label: string };
  analysisView?: "monthly" | "weekly" | "yearly";
};

const BUDGET_TEMPLATE_IDS = new Set(["next_week_budget", "next_month_budget"]);

export default function ChatGPTPrompt({ mode = "analysis", target, analysisView }: Props) {
  const visibleTemplates = mode === "all"
    ? TEMPLATES
    : TEMPLATES.filter((template) =>
        analysisView ? template.id === analysisView : !BUDGET_TEMPLATE_IDS.has(template.id)
      );
  const [selected, setSelected] = useState<string>(visibleTemplates[0].id);
  const [copied, setCopied] = useState(false);

  const template = visibleTemplates.find((t) => t.id === selected) ?? visibleTemplates[0];

  async function handleCopy() {
    const targetInstruction = target
      ? `\n\n分析対象期間は「${target.label}（${target.dateFrom}〜${target.dateTo}）」です。「今週」「今月」などの相対表現ではなく、この期間を対象に分析してください。`
      : "";
    await navigator.clipboard.writeText(`${template.text}${targetInstruction}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (target) {
      const params = new URLSearchParams({ period: "custom", dateFrom: target.dateFrom, dateTo: target.dateTo });
      if (analysisView) params.set("analysisView", analysisView);
      window.location.href = `/api/export/csv?${params.toString()}`;
      return;
    }
    window.location.href = `/api/export/csv?period=${template.csvPeriod}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {visibleTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selected === t.id
                ? "bg-purple-600 text-white border-purple-600"
                : "text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-gray-50 border rounded-md p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
          {template.text}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2.5 py-1 text-xs bg-white border rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          {copied ? "✓ コピー済み" : "コピー"}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {target ? `${target.label}のCSVをダウンロード` : `${template.csvLabel}をダウンロード`}
        </button>
        <p className="text-xs text-gray-400">
          ① CSVをダウンロード → ② ChatGPTにアップロード → ③ プロンプトをコピーして貼り付け
        </p>
      </div>
    </div>
  );
}

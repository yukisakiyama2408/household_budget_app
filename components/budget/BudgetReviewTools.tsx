"use client";

import { useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { TEMPLATES } from "@/components/insights/ChatGPTPrompt";

type Props = {
  view: "monthly" | "weekly";
};

const REVIEW_CONFIG = {
  monthly: {
    templateId: "next_month_budget",
    title: "来月の予算案を作る",
    description: "先月・今月の実績、月次予算、直近3ヶ月の推移を使って、来月の月次/週次予算案を作ります。",
  },
  weekly: {
    templateId: "next_week_budget",
    title: "来週の予算を見直す",
    description: "先週・今週の実績、週次予算、今月の残予算を使って、来週のカテゴリ別予算を見直します。",
  },
} as const;

export default function BudgetReviewTools({ view }: Props) {
  const [copied, setCopied] = useState(false);
  const config = REVIEW_CONFIG[view];
  const template = TEMPLATES.find((t) => t.id === config.templateId);

  if (!template) return null;
  const selectedTemplate = template;

  async function copyPrompt() {
    await navigator.clipboard.writeText(selectedTemplate.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCsv() {
    window.location.href = `/api/export/csv?period=${selectedTemplate.csvPeriod}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mt-1 text-sm font-medium text-gray-700">{config.title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-green-600 px-3 text-xs font-bold text-white transition-colors hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ClipboardCopy className="h-4 w-4" />
            {copied ? "コピー済み" : "プロンプト"}
          </button>
        </div>
      </div>
      <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <span className="font-bold text-gray-700">1. CSV</span>
          <span className="ml-1">ChatGPTにアップロードする材料です。</span>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <span className="font-bold text-gray-700">2. プロンプト</span>
          <span className="ml-1">CSVと一緒に貼り付けます。</span>
        </div>
      </div>
    </div>
  );
}

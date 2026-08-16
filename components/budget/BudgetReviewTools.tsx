"use client";

import { useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { TEMPLATES } from "@/components/insights/ChatGPTPrompt";

type Props = {
  view: "monthly" | "weekly";
  targetLabel?: string;
  priorAnalysis?: {
    id: number;
    title: string;
    content: string;
    periodLabel: string;
    advices: string[];
  };
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

export default function BudgetReviewTools({ view, targetLabel, priorAnalysis }: Props) {
  const [copied, setCopied] = useState(false);
  const config = REVIEW_CONFIG[view];
  const template = TEMPLATES.find((t) => t.id === config.templateId);

  if (!template) return null;
  const selectedTemplate = template;

  async function copyPrompt() {
    const targetInstruction = targetLabel
      ? `\n\n予算の設定対象は「${targetLabel}」です。相対表現ではなく、この期間の予算案として出力してください。`
      : "";
    const analysisInstruction = priorAnalysis
      ? `\n\nCSV内の「# 登録済みの分析結果（予算設定の根拠）」を必ず参照してください。以下は同じ分析内容です。この振り返りとアドバイスを根拠に、改善点が具体的な金額へ反映された予算を作ってください。\n\n【分析結果: ${priorAnalysis.title}】\n${priorAnalysis.content}${priorAnalysis.advices.length > 0 ? `\n\n【継続するアドバイス】\n${priorAnalysis.advices.map((advice) => `- ${advice}`).join("\n")}` : ""}`
      : "\n\n直前期間の登録済み分析結果はありません。CSVの実績を分析してから予算案を作成してください。";
    await navigator.clipboard.writeText(`${selectedTemplate.text}${analysisInstruction}${targetInstruction}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCsv() {
    const params = new URLSearchParams({ period: selectedTemplate.csvPeriod });
    if (priorAnalysis) params.set("analysisResultId", String(priorAnalysis.id));
    window.location.href = `/api/export/csv?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mt-1 text-sm font-medium text-gray-700">
            {targetLabel ? `${targetLabel}の予算案を作る` : config.title}
          </p>
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
          <span className="font-bold text-gray-700">2. CSV</span>
          <span className="ml-1">実績と登録済み分析結果をChatGPTに渡します。</span>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <span className="font-bold text-gray-700">3. 予算案</span>
          <span className="ml-1">分析結果を含むプロンプトを貼り付けます。</span>
        </div>
      </div>
    </div>
  );
}

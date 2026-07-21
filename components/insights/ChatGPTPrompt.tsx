"use client";

import { useState } from "react";

type CsvPeriod = "weekly" | "monthly" | "yearly" | "3months";

export const TEMPLATES = [
  {
    id: "monthly",
    label: "月次分析",
    csvPeriod: "monthly" as CsvPeriod,
    csvLabel: "月次CSV（先月＋今月）",
    text: `添付の家計簿CSVを分析してください。

以下の点を教えてください：
1. 今月の支出傾向（カテゴリ別集計をもとにした特徴）
2. 削減できそうな支出と具体的な目標金額
3. 来月に向けた節約アドバイスを3つ`,
  },
  {
    id: "weekly",
    label: "週次分析",
    csvPeriod: "weekly" as CsvPeriod,
    csvLabel: "週次CSV（先週＋今週）",
    text: `添付の家計簿CSVを週単位で分析してください。

以下の点を教えてください：
1. 今週の支出の特徴と評価（カテゴリ別集計・週次予算との比較をもとに）
2. 週ごとの支出パターン（直近4週間の推移から読み取れる傾向）
3. 先週と比べて良くなった点・悪化した点
4. 来週意識すべきポイント`,
  },
  {
    id: "yearly",
    label: "年次分析",
    csvPeriod: "yearly" as CsvPeriod,
    csvLabel: "年次CSV",
    text: `添付の家計簿CSVを年単位で分析してください。

以下の点を教えてください：
1. 年間の収入・支出・収支の総評
2. 月別収支推移から読み取れる支出の増減と要因
3. 年間で支出割合が大きかったカテゴリと改善余地
4. 翌年に向けた具体的な家計改善案を3つ`,
  },
  {
    id: "next_week_budget",
    label: "週次見直し",
    csvPeriod: "weekly" as CsvPeriod,
    csvLabel: "週次CSV（先週＋今週）",
    text: `添付の家計簿CSVを元に、今週の支出を振り返り、来週の予算を見直してください。
CSVの末尾に「# 欲しいものリスト」セクションが含まれている場合は、その優先度と購入可能度も踏まえて調整してください。

今週の実績と月次予算の残余状況を確認した上で、来週の推奨予算を以下の形式で出力してください（アプリへそのまま入力できるよう金額を明記してください）：

---
【来週の見直し予算】
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___
---

月次予算の消化ペースと残予算額も合わせて教えてください。
特に注意すべきカテゴリと来週意識すべきポイントを一言お願いします。`,
  },
  {
    id: "next_month_budget",
    label: "翌月予算設定",
    csvPeriod: "monthly" as CsvPeriod,
    csvLabel: "月次CSV（先月＋今月）",
    text: `添付の家計簿CSVを元に、来月の予算を設定してください。
CSVの末尾に「# 欲しいものリスト」セクションが含まれている場合は、その優先度と購入可能度も踏まえて予算を調整してください。

直近3ヶ月の月別収支推移セクションを参考に月平均支出を確認し、欲しいものの優先度も踏まえた上で、来月の推奨予算を以下の形式で出力してください（アプリへそのまま入力できるよう金額を明記してください）：

---
【来月の推奨予算（月次）】
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- その他：¥___,___
- 月次合計予算（上限）：¥___,___

【来月の週次予算】
※来月の週（月曜始まり）を第1週から順に出力してください

第1週（MM/DD〜MM/DD）
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___

第2週（MM/DD〜MM/DD）
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___

第3週（MM/DD〜MM/DD）
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___

第4週（MM/DD〜MM/DD）
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___

※5週ある月は第5週も同じ形式で出力してください
---

最後に、優先度の高い欲しいものを無理なく購入するための一言アドバイスをください。`,
  },
] as const;

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

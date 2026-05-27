"use client";

import { useState } from "react";

type CsvPeriod = "weekly" | "monthly" | "3months";

const TEMPLATES = [
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
    id: "next_week_budget",
    label: "週次見直し",
    csvPeriod: "weekly" as CsvPeriod,
    csvLabel: "週次CSV（先週＋今週）",
    text: `添付の家計簿CSVを元に、今週の支出を振り返り、来週の予算を見直してください。
CSVの末尾に「# 貯金目標の進捗」セクションが含まれている場合は、その達成状況も踏まえて調整してください。

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
CSVの末尾に「# 貯金目標の進捗」セクションが含まれている場合は、その達成状況も踏まえて予算を調整してください。

直近3ヶ月の月別収支推移セクションを参考に月平均支出を確認し、貯金目標の達成状況を踏まえた上で、来月の推奨予算を以下の形式で出力してください（アプリへそのまま入力できるよう金額を明記してください）：

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

最後に、貯金目標の進捗に対する一言アドバイスをください。`,
  },
  {
    id: "savings",
    label: "貯金目標設定",
    csvPeriod: "3months" as CsvPeriod,
    csvLabel: "過去3ヶ月CSV",
    text: `添付の家計簿CSVを元に、アプリに登録できる現実的な貯金目標を提案してください。

カテゴリ別集計セクションをもとに収支を簡単に分析し、月間の貯蓄余力を算出してください。

その上で、以下の形式で目標を3つ提案してください（すぐにアプリへコピー＆ペーストできるよう、各項目を明記してください）：

---
【目標1】
- タイトル：（例：旅行用貯金）
- 種別：貯蓄目標
- 目標金額：○○○,○○○ 円
- 期限：YYYY-MM-DD
- 一言メモ：（この目標を選んだ理由）

【目標2】
- タイトル：
- 種別：貯蓄目標
- 目標金額：○○○,○○○ 円
- 期限：YYYY-MM-DD
- 一言メモ：

【目標3】
- タイトル：
- 種別：貯蓄目標
- 目標金額：○○○,○○○ 円
- 期限：YYYY-MM-DD
- 一言メモ：
---

目標は「3ヶ月以内」「半年以内」「1年以内」の3段階で設定してください。今日の日付を起点に具体的な期限（YYYY-MM-DD形式）を必ず入れてください。`,
  },
] as const;

export default function ChatGPTPrompt() {
  const [selected, setSelected] = useState<string>(TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  const template = TEMPLATES.find((t) => t.id === selected)!;

  async function handleCopy() {
    await navigator.clipboard.writeText(template.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    window.location.href = `/api/export/csv?period=${template.csvPeriod}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {TEMPLATES.map((t) => (
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
          {template.csvLabel}をダウンロード
        </button>
        <p className="text-xs text-gray-400">
          ① CSVをダウンロード → ② ChatGPTにアップロード → ③ プロンプトをコピーして貼り付け
        </p>
      </div>
    </div>
  );
}

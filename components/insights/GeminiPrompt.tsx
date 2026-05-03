"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    id: "monthly",
    label: "月次分析",
    text: `添付の家計簿CSVを分析してください。

以下の点を教えてください：
1. 今月の支出傾向（カテゴリ別の特徴）
2. 削減できそうな支出と具体的な目標金額
3. 来月に向けた節約アドバイスを3つ`,
  },
  {
    id: "score",
    label: "家計採点",
    text: `添付の家計簿データを元に、家計の健全度を採点してください（100点満点）。

採点基準、良かった点、改善すべき点をそれぞれ教えてください。`,
  },
  {
    id: "pattern",
    label: "パターン分析",
    text: `添付の家計簿データから支出のパターンや傾向を分析してください。

特に、繰り返しているムダな支出や、削減しやすそうな項目を具体的に指摘してください。`,
  },
  {
    id: "savings",
    label: "貯金目標設定",
    text: `添付の家計簿データを元に、アプリに登録できる現実的な貯金目標を提案してください。

まず収支を簡単に分析し、月間の貯蓄余力を算出してください。

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
  {
    id: "weekly",
    label: "週次分析",
    text: `添付の家計簿データを週単位で分析してください。

以下の点を教えてください：
1. 先週の支出の特徴と評価
2. 週ごとの支出パターン（曜日・タイミングの傾向）
3. 先週と比べて良くなった点・悪化した点
4. 今週意識すべきポイント`,
  },
  {
    id: "next_week_budget",
    label: "翌週予算設定",
    text: `添付の家計簿データを元に、来週の予算を設定してください。

以下の形式で回答してください：
1. 直近4週間の週平均支出（カテゴリ別）
2. 来週の推奨予算（カテゴリ別の具体的な金額）
3. 特に注意すべきカテゴリと理由
4. 来週の合計予算の上限額`,
  },
] as const;

export default function GeminiPrompt() {
  const [selected, setSelected] = useState<string>(TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  const template = TEMPLATES.find((t) => t.id === selected)!;

  async function handleCopy() {
    await navigator.clipboard.writeText(template.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <p className="text-xs text-gray-400">
        CSVをダウンロード → Geminiにアップロード → このプロンプトを貼り付けて送信
      </p>
    </div>
  );
}

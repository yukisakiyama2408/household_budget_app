"use client";

import { useState } from "react";
import { ClipboardCopy, Download, Sparkles } from "lucide-react";

function buildPrompt(purpose: string, desiredAmount: string, deadline: string) {
  return `添付した家計簿CSVには、直近6ヶ月の収入・支出とカテゴリ別の支出傾向が含まれています。
この実績を根拠に、私が希望する貯蓄目標を現実的な内容へ調整してください。

【私の希望】
- 貯金の目的：${purpose}
- 希望金額：¥${Number(desiredAmount).toLocaleString("ja-JP")}
- 希望の期限：${deadline}

希望を勝手に別の目的へ変更せず、まず実現可能性を評価してください。
希望どおりでは厳しい場合は、次の3案を具体的な金額と期限で比較してください。

1. 希望期限を優先し、目標金額を調整する案
2. 希望金額を優先し、期限を調整する案
3. 支出を見直して、希望金額と期限の両方を目指す案

計算では以下を守ってください。
- 直近6ヶ月の月平均収入、月平均支出、月平均黒字額を示す
- 臨時収入や一時的な高額支出があれば分けて考える
- CSVにない資産や将来の収入は推測しない
- 生活を圧迫しないよう、毎月の余裕を残す
- 支出削減案はカテゴリ名と月額を具体的に示す

回答は以下の形式にしてください。

【実現可能性】
- 判定：そのまま実現可能／調整すれば実現可能／現状では難しい
- 月平均収入：¥___,___
- 月平均支出：¥___,___
- 月平均黒字額：¥___,___
- 希望達成に必要な毎月の貯金額：¥___,___
- 評価理由：___

【調整案の比較】
| 案 | 目標金額 | 期限 | 毎月の貯金額 | 必要な支出調整 | メリット・注意点 |
|---|---:|---|---:|---:|---|
| 期限優先 | ¥___,___ | YYYY-MM-DD | ¥___,___ | ¥___,___ | ___ |
| 金額優先 | ¥___,___ | YYYY-MM-DD | ¥___,___ | ¥___,___ | ___ |
| 両方を目指す | ¥___,___ | YYYY-MM-DD | ¥___,___ | ¥___,___ | ___ |

【支出を見直す場合】
| カテゴリ | 直近6ヶ月の月平均 | 見直し後 | 月間削減額 | 現実的な理由 |
|---|---:|---:|---:|---|
| ___ | ¥___,___ | ¥___,___ | ¥___,___ | ___ |

最後に、どの案で進めたいかを私に質問してください。私が選ぶまでは目標を確定しないでください。`;
}

export default function GoalPlanningTools() {
  const [purpose, setPurpose] = useState("");
  const [desiredAmount, setDesiredAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyPrompt() {
    if (!purpose.trim() || !desiredAmount || Number(desiredAmount) <= 0 || !deadline) {
      setError("目的、希望金額、希望期限を入力してください。");
      return;
    }
    await navigator.clipboard.writeText(buildPrompt(purpose.trim(), desiredAmount, deadline));
    setError("");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCsv() {
    window.location.href = "/api/export/csv?period=6months";
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><Sparkles className="size-4" /></div>
        <div>
          <h2 className="text-sm font-bold text-gray-950">ChatGPTで目標を現実的に調整する</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">希望する目標を入力し、直近6ヶ月の家計実績をもとに金額・期限・毎月の貯金額を比較します。</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5 sm:col-span-3">
          <span className="text-xs font-bold text-gray-600">貯金の目的</span>
          <input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="例：沖縄旅行、車の購入、生活防衛資金" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold text-gray-600">希望金額（円）</span>
          <input type="number" min={1} value={desiredAmount} onChange={(event) => setDesiredAmount(event.target.value)} placeholder="例：300000" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-gray-600">希望の期限</span>
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>
      </div>

      {error && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
        <button type="button" onClick={downloadCsv} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-700">
          <Download className="size-4" />直近6ヶ月のCSVをダウンロード
        </button>
        <button type="button" onClick={copyPrompt} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white transition-colors hover:bg-indigo-700">
          <ClipboardCopy className="size-4" />{copied ? "コピーしました" : "入力内容を含むプロンプトをコピー"}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-400">CSVをChatGPTへ添付してから、コピーしたプロンプトを送信してください。</p>
    </section>
  );
}

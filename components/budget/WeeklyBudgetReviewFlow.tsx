"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import GeminiBudgetImport from "./GeminiBudgetImport";

type CategoryEntry = { id: number; name: string };
type PeriodOption = { start: string; end: string; label: string };

type Props = {
  periods: PeriodOption[];
  categories: CategoryEntry[];
};

function formatPeriod(start: string, end: string): string {
  return `${start.replaceAll("-", "/")}〜${end.replaceAll("-", "/")}`;
}

function createPrompt(start: string, end: string): string {
  const period = formatPeriod(start, end);
  return `添付の家計簿CSVを元に、直近の支出を振り返り、${period}の予算を設定してください。
CSVの末尾に「# 欲しいものリスト」セクションが含まれている場合は、その優先度と購入可能度も踏まえて調整してください。

対象期間が属する月の月次予算と残予算、直近の支出実績を確認した上で、以下の形式で出力してください。
金額はアプリへそのまま登録できるよう明記してください。

---
【${period}の予算】
- 食費：¥___,___
- 外食費：¥___,___
- 接待交際費：¥___,___
- 娯楽費：¥___,___
- スマホ代：¥___,___
- 生活品：¥___,___
- 週次合計予算（上限）：¥___,___
---

月次予算の消化ペースと残予算額も合わせて教えてください。
特に注意すべきカテゴリと、この期間に意識すべきポイントを一言お願いします。`;
}

export default function WeeklyBudgetReviewFlow({ periods, categories }: Props) {
  const initialPeriod = periods[0] ?? { start: "", end: "", label: "" };
  const [periodStart, setPeriodStart] = useState(initialPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);
  const [generatedPeriod, setGeneratedPeriod] = useState<PeriodOption | null>(null);
  const [copied, setCopied] = useState(false);

  const periodIsValid = periodStart !== "" && periodEnd !== "";
  const prompt = useMemo(
    () => generatedPeriod ? createPrompt(generatedPeriod.start, generatedPeriod.end) : "",
    [generatedPeriod]
  );

  function selectPeriod(period: PeriodOption) {
    setPeriodStart(period.start);
    setPeriodEnd(period.end);
    setGeneratedPeriod(null);
  }

  function generatePrompt() {
    if (!periodIsValid) return;
    setGeneratedPeriod({
      start: periodStart,
      end: periodEnd,
      label: formatPeriod(periodStart, periodEnd),
    });
    setCopied(false);
  }

  async function copyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCsv() {
    if (!generatedPeriod) return;
    const params = new URLSearchParams({
      period: "weekly",
      targetStart: generatedPeriod.start,
      targetEnd: generatedPeriod.end,
    });
    window.location.href = `/api/export/csv?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-700">1. 対象期間を設定</p>
          <p className="mt-1 text-xs text-gray-500">
            月を跨ぐ週は月別の期間に分けて設定してください。
          </p>
        </div>

        {periods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={`${period.start}-${period.end}`}
                type="button"
                onClick={() => selectPeriod(period)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  periodStart === period.start && periodEnd === period.end
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={generatePrompt}
            disabled={!periodIsValid}
            className="h-10 rounded-md bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            この期間のプロンプトを生成
          </button>
        </div>
      </div>

      {generatedPeriod && (
        <>
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-xs font-bold text-gray-700">2. 対象期間のプロンプトを生成</p>
              <p className="mt-1 text-xs text-gray-500">
                選択した期間が登録先としてプロンプトに反映されています。
              </p>
            </div>
            <div className="relative">
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border bg-gray-50 p-4 pr-24 text-xs leading-5 text-gray-700">
                {prompt}
              </pre>
              <button
                type="button"
                onClick={copyPrompt}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border bg-white px-2.5 py-1 text-xs shadow-sm hover:bg-gray-50"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              分析用CSV
            </button>
            <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span className="font-bold text-gray-700">3. ChatGPTで予算を設定</span>
              <span className="ml-1">CSVをアップロードし、コピーしたプロンプトを送信します。</span>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-xs font-bold text-gray-700">4. ChatGPT出力を貼り付けて一括登録</p>
              <p className="mt-1 text-xs text-gray-500">
                {generatedPeriod.label}の予算として登録します。
              </p>
            </div>
            <GeminiBudgetImport
              type="weekly"
              weekStart={generatedPeriod.start}
              weekLabel={generatedPeriod.label}
              periods={[generatedPeriod]}
              categories={categories}
            />
          </div>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import AnalysisHeader from "@/components/analysis/AnalysisHeader";
import CsvExport from "@/components/insights/CsvExport";
import ChatGPTPrompt from "@/components/insights/ChatGPTPrompt";
import AnalysisResultForm from "@/components/insights/AnalysisResultForm";
import AnalysisResultList from "@/components/insights/AnalysisResultList";
import { getAnalysisResults, getTransactionDateBounds } from "@/lib/data";
import { analysisHref, analysisPeriodOptions, resolveAnalysisSelection, switchAnalysisView, type AnalysisParams } from "@/lib/analysis-navigation";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<AnalysisParams> }) {
  const selection = resolveAnalysisSelection(await searchParams, "reviews");
  const [results, bounds] = await Promise.all([getAnalysisResults(), getTransactionDateBounds()]);
  const options = analysisPeriodOptions(selection, bounds);
  const view = selection.view as "monthly" | "weekly" | "yearly";
  const selectedResults = results.filter((result) => result.analysis_view === view && result.date_from === selection.dateFrom && result.date_to === selection.dateTo);
  const otherResults = results.filter((result) => !selectedResults.some((selected) => selected.id === result.id));
  const week = switchAnalysisView(selection, "weekly");
  const periodKey = `${view}-${selection.period}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <AnalysisHeader section="reviews" selection={selection} options={options} />
        <section className="flex flex-col gap-3 rounded-lg border bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-indigo-900">週次チェックイン</h2>
            <p className="mt-1 text-sm text-indigo-700">{week.label}の実績を前週と比較して確認します。</p>
          </div>
          <Link href={analysisHref("checkin", week)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">チェックインを開く</Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">{selection.label}の振り返り</h2>
          <AnalysisResultList key={periodKey} results={selectedResults} />
        </section>

        <section className="space-y-4 rounded-lg border bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">振り返りを記録する</h2>
            <p className="mt-1 text-sm text-gray-500">気づきやAIの分析結果、次に実行することを記録できます。</p>
          </div>
          <AnalysisResultForm key={periodKey} target={selection} analysisView={view} />
        </section>

        <details key={`ai-${periodKey}`} className="rounded-lg border bg-white">
          <summary className="min-h-11 cursor-pointer p-4 text-sm font-semibold text-indigo-700">AIで振り返りを深める</summary>
          <div className="grid gap-6 border-t p-4 sm:p-6 lg:grid-cols-2">
            <section className="space-y-3"><h2 className="text-sm font-semibold">1. 対象期間のCSVを取得</h2><CsvExport target={selection} analysisView={view} /></section>
            <section className="min-w-0 space-y-3"><h2 className="text-sm font-semibold">2. プロンプトをコピーしてChatGPTへ</h2><ChatGPTPrompt key={periodKey} target={selection} analysisView={view} /></section>
            <p className="text-sm text-gray-500 lg:col-span-2">回答は「振り返りを記録する」に貼り付けて保存できます。</p>
          </div>
        </details>

        <details className="rounded-lg border bg-white">
          <summary className="min-h-11 cursor-pointer p-4 text-sm font-semibold">ほかの期間の記録（{otherResults.length}件）</summary>
          <div className="border-t p-4"><AnalysisResultList key={`other-${periodKey}`} results={otherResults} /></div>
        </details>
      </div>
    </div>
  );
}

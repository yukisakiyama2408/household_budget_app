import Link from "next/link";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import AnalysisPeriodSelector from "@/components/dashboard/AnalysisPeriodSelector";
import { analysisHref, type AnalysisSection, type AnalysisSelection, type AnalysisPeriodOption } from "@/lib/analysis-navigation";

export default function AnalysisHeader({ section, selection, options }: {
  section: AnalysisSection;
  selection: AnalysisSelection;
  options: AnalysisPeriodOption[];
}) {
  return (
    <header className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{section === "stats" ? "分析" : section === "reviews" ? "振り返り" : "週次チェックイン"}</h1>
        <p className="mt-1 text-sm text-gray-500">{section === "stats" ? "収支の内訳と推移を、期間を切り替えて確認します。" : "実績を振り返り、気づきや次に取り組むことを記録します。"}</p>
      </div>
      <nav aria-label="分析の画面切り替え" className="flex border-b">
        {([{ key: "stats", label: "集計・推移" }, { key: "reviews", label: "振り返り" }] as const).map(({ key, label }) => (
          <Link key={key} href={analysisHref(key, selection)} aria-current={(section === "checkin" ? "reviews" : section) === key ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-4 py-3 text-sm font-medium ${(section === "checkin" ? "reviews" : section) === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {section === "checkin" ? <span className="text-sm font-medium text-gray-600">対象週</span> : <DashboardTabs activeView={selection.view} period={selection.period} excludeDaily={section === "reviews"} />}
          <AnalysisPeriodSelector value={selection.period} view={selection.view} options={options} />
        </div>
        <Link href={`/transactions?${new URLSearchParams({ dateFrom: selection.dateFrom, dateTo: selection.dateTo })}`} className="inline-flex min-h-11 items-center text-sm text-indigo-600 hover:underline">この期間の取引明細 →</Link>
      </div>
    </header>
  );
}

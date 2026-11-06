import Link from "next/link";
import AnalysisHeader from "@/components/analysis/AnalysisHeader";
import CheckinView from "@/components/checkin/CheckinView";
import { getWeekSummaryForDates, getCheckinForWeek, getTransactionDateBounds } from "@/lib/data";
import { resolveAnalysisSelection, analysisHref, analysisPeriodOptions, shiftAnalysisDate, type AnalysisParams } from "@/lib/analysis-navigation";

export default async function CheckinPage({ searchParams }: { searchParams: Promise<AnalysisParams> }) {
  const selection = resolveAnalysisSelection(await searchParams, "checkin");
  const [currentData, prevData, alreadyCheckedIn, bounds] = await Promise.all([
    getWeekSummaryForDates(selection.dateFrom, selection.dateTo),
    getWeekSummaryForDates(shiftAnalysisDate(selection.dateFrom, -7), shiftAnalysisDate(selection.dateTo, -7)),
    getCheckinForWeek(selection.period),
    getTransactionDateBounds(),
  ]);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <AnalysisHeader section="checkin" selection={selection} options={analysisPeriodOptions(selection, bounds)} />
      <Link href={analysisHref("reviews", selection)} className="inline-flex min-h-11 items-center text-sm text-indigo-600 hover:underline">← この週の振り返りへ</Link>
      <CheckinView key={selection.period} currentWeek={currentData} prevWeek={prevData} alreadyCheckedIn={alreadyCheckedIn} weekStart={selection.period} />
    </div>
  );
}

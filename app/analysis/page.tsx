import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import CategoryTable from "@/components/dashboard/CategoryTable";
import DailyTable from "@/components/daily/DailyTable";
import TrendLineChart from "@/components/dashboard/TrendLineChart";
import AnalysisHeader from "@/components/analysis/AnalysisHeader";
import YearlyAnalysis from "@/components/analysis/YearlyAnalysis";
import { getMonthlySummary, getCategoryBreakdown, getDailyData, getWeekSummaryForDates, getDailySpendingTrend, getTransactionDateBounds } from "@/lib/data";
import { resolveAnalysisSelection, analysisPeriodOptions, type AnalysisParams } from "@/lib/analysis-navigation";

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<AnalysisParams> }) {
  const selection = resolveAnalysisSelection(await searchParams);
  const { view, period: selectedPeriod } = selection;
  const options = analysisPeriodOptions(selection, await getTransactionDateBounds());
  let content: React.ReactNode;

  if (view === "weekly") {
    const week = await getWeekSummaryForDates(selection.dateFrom, selection.dateTo);
    const bal = week.income - week.expense;

    content = (
      <>
        <SummaryCards income={week.income} expense={week.expense} balance={bal} reimbursement={week.reimbursement} />
        {week.categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">カテゴリ別支出</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium text-left">カテゴリ</th>
                    <th className="pb-2 font-medium text-right">金額</th>
                    <th className="pb-2 font-medium text-right">割合</th>
                  </tr>
                </thead>
                <tbody>
                  {week.categories.map((c) => {
                    const pct = week.effectiveExpense > 0 ? ((c.amount / week.effectiveExpense) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={String(c.id ?? "none")} className="border-b last:border-0">
                        <td className="py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-red-500">
                          ¥{c.amount.toLocaleString("ja-JP")}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-gray-400 text-xs">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="pt-2.5 text-gray-700">合計</td>
                    <td className="pt-2.5 text-right tabular-nums text-red-500">
                      ¥{week.effectiveExpense.toLocaleString("ja-JP")}
                    </td>
                    <td className="pt-2.5 text-right tabular-nums text-gray-400 text-xs">100%</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )}
      </>
    );
  } else if (view === "yearly") {
    content = <YearlyAnalysis year={Number(selectedPeriod)} />;
  } else if (view === "daily") {
    const [currentYear, currentMonth] = selectedPeriod.split("-").map(Number);
    const monthlyData = await getDailyData(currentYear);
    content = (
      <>
        <DailyTable data={monthlyData[currentMonth - 1]} showMonthSelector={false} />
      </>
    );
  } else {
    const [year, mon] = selectedPeriod.split("-").map(Number);
    const [summary, categoryData, dailyTrend] = await Promise.all([
      getMonthlySummary(year, mon),
      getCategoryBreakdown(year, mon),
      getDailySpendingTrend(year, mon),
    ]);
    content = (
      <>
        <SummaryCards
          income={summary.income}
          expense={summary.expense}
          balance={summary.balance}
          reimbursement={summary.reimbursement}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">日別支出トレンド</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={dailyTrend} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">カテゴリ別支出</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={categoryData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">支出内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryTable data={categoryData} />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto w-full ${view === "daily" ? "max-w-7xl" : "max-w-6xl"} space-y-6 px-4 py-6 sm:px-6 sm:py-8`}>
        <AnalysisHeader section="stats" selection={selection} options={options} />
        {content}
      </div>
    </div>
  );
}

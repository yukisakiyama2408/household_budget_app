import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import { getYearlyTrend, getYearlySummary } from "@/lib/data";

export default async function YearlyAnalysis({ year: currentYear }: { year: number }) {
  const [summary, trendData] = await Promise.all([
    getYearlySummary(currentYear),
    getYearlyTrend(currentYear),
  ]);
  const activeMonths = trendData.filter((d) => d.income > 0 || d.expense > 0);
  const averageExpense =
    activeMonths.length > 0
      ? Math.round(activeMonths.reduce((sum, d) => sum + d.effectiveExpense, 0) / activeMonths.length)
      : 0;

  return (
    <div className="space-y-6">
      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
        reimbursement={summary.reimbursement}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-bold text-gray-500">実績がある月</p>
          <p className="mt-2 text-xl font-extrabold text-gray-950">{activeMonths.length}ヶ月</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-bold text-gray-500">月平均支出</p>
          <p className="mt-2 text-xl font-extrabold tabular-nums text-red-600">
            ¥{averageExpense.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-bold text-gray-500">年間収支</p>
          <p className={`mt-2 text-xl font-extrabold tabular-nums ${summary.balance >= 0 ? "text-green-700" : "text-red-600"}`}>
            {summary.balance >= 0 ? "+" : "-"}¥{Math.abs(summary.balance).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">月次収支推移</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart data={trendData.map((d) => ({ month: d.month, income: d.income, expense: d.effectiveExpense }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">月別明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3 font-medium">月</th>
                  <th className="py-2 pr-3 text-right font-medium">収入</th>
                  <th className="py-2 pr-3 text-right font-medium">支出</th>
                  <th className="py-2 pr-3 text-right font-medium">相殺</th>
                  <th className="py-2 text-right font-medium">収支</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((d) => {
                  const balance = d.income - d.expense;
                  return (
                    <tr key={d.month} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-700">{d.month}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-green-700">
                        ¥{d.income.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-red-600">
                        ¥{d.expense.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-gray-500">
                        {d.reimbursement > 0 ? `¥${d.reimbursement.toLocaleString("ja-JP")}` : "-"}
                      </td>
                      <td className={`py-2 text-right font-bold tabular-nums ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {balance >= 0 ? "+" : "-"}¥{Math.abs(balance).toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

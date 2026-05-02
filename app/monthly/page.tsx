import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthSelector from "@/components/dashboard/MonthSelector";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import CategoryTable from "@/components/dashboard/CategoryTable";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import YearSelector from "@/components/yearly/YearSelector";
import DailyTable from "@/components/daily/DailyTable";
import WeekSelector from "@/components/dashboard/WeekSelector";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getYearlyTrend,
  getYearlySummary,
  getDailyData,
  getWeeklyData,
} from "@/lib/data";

type View = "monthly" | "weekly" | "yearly" | "daily";

type Props = {
  searchParams: Promise<{ view?: string; month?: string; year?: string; week?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = (params.view ?? "monthly") as View;
  const now = new Date();

  let content: React.ReactNode;
  const isDaily = view === "daily";

  if (view === "weekly") {
    const [year, mon] = params.month
      ? params.month.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
    const weeklyData = await getWeeklyData(year, mon);

    // デフォルト週: 今日を含む週、なければ最終週
    let defaultIndex = weeklyData.length - 1;
    const todayStr = now.toISOString().slice(0, 10);
    for (let i = 0; i < weeklyData.length; i++) {
      if (todayStr >= weeklyData[i].startDate && todayStr <= weeklyData[i].endDate) {
        defaultIndex = i;
        break;
      }
    }
    const weekIndex = params.week
      ? Math.min(Math.max(parseInt(params.week) - 1, 0), weeklyData.length - 1)
      : defaultIndex;
    const week = weeklyData[weekIndex];
    const bal = week.income - week.expense;

    content = (
      <>
        <MonthSelector year={year} month={mon} />
        <WeekSelector
          weekIndex={weekIndex}
          totalWeeks={weeklyData.length}
          label={week.label}
        />
        <SummaryCards income={week.income} expense={week.expense} balance={bal} />
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
                    const pct = week.expense > 0 ? ((c.amount / week.expense) * 100).toFixed(1) : "0.0";
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
                      ¥{week.expense.toLocaleString("ja-JP")}
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
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();
    const [summary, trendData] = await Promise.all([
      getYearlySummary(currentYear),
      getYearlyTrend(currentYear),
    ]);
    content = (
      <>
        <YearSelector year={currentYear} />
        <SummaryCards
          income={summary.income}
          expense={summary.expense}
          balance={summary.balance}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">月次収支推移</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={trendData} />
          </CardContent>
        </Card>
      </>
    );
  } else if (view === "daily") {
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();
    const monthlyData = await getDailyData(currentYear);
    content = (
      <>
        <YearSelector year={currentYear} />
        <div className="space-y-2">
          {monthlyData.map((data) => (
            <DailyTable key={`${data.year}-${data.month}`} data={data} />
          ))}
        </div>
      </>
    );
  } else {
    const [year, mon] = params.month
      ? params.month.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
    const [summary, categoryData] = await Promise.all([
      getMonthlySummary(year, mon),
      getCategoryBreakdown(year, mon),
    ]);
    content = (
      <>
        <MonthSelector year={year} month={mon} />
        <SummaryCards
          income={summary.income}
          expense={summary.expense}
          balance={summary.balance}
        />
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <DashboardTabs activeView={view} />
      </div>
      <div className={`${isDaily ? "max-w-full" : "max-w-5xl mx-auto"} px-4 pb-8 space-y-6`}>
        {content}
      </div>
    </div>
  );
}

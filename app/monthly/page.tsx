import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthSelector from "@/components/dashboard/MonthSelector";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import CategoryTable from "@/components/dashboard/CategoryTable";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import YearSelector from "@/components/yearly/YearSelector";
import DailyTable from "@/components/daily/DailyTable";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getYearlyTrend,
  getYearlySummary,
  getDailyData,
} from "@/lib/data";

type View = "monthly" | "yearly" | "daily";

type Props = {
  searchParams: Promise<{ view?: string; month?: string; year?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = (params.view ?? "monthly") as View;
  const now = new Date();

  let content: React.ReactNode;
  const isDaily = view === "daily";

  if (view === "yearly") {
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

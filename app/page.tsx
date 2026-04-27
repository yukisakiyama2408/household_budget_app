import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthSelector from "@/components/dashboard/MonthSelector";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import CategoryTable from "@/components/dashboard/CategoryTable";
import { getMonthlySummary, getCategoryBreakdown } from "@/lib/data";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { month } = await searchParams;

  const now = new Date();
  const [year, mon] = month
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const [summary, categoryData] = await Promise.all([
    getMonthlySummary(year, mon),
    getCategoryBreakdown(year, mon),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
      </div>
    </div>
  );
}

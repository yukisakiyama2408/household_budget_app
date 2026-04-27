import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import YearSelector from "@/components/yearly/YearSelector";
import { getYearlyTrend, getYearlySummary } from "@/lib/data";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function YearlyPage({ searchParams }: Props) {
  const { year } = await searchParams;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  const [summary, trendData] = await Promise.all([
    getYearlySummary(currentYear),
    getYearlyTrend(currentYear),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
      </div>
    </div>
  );
}

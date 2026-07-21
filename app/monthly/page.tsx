import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCards from "@/components/dashboard/SummaryCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import CategoryTable from "@/components/dashboard/CategoryTable";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import DailyTable from "@/components/daily/DailyTable";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import AnalysisPeriodSelector, { type AnalysisPeriodOption } from "@/components/dashboard/AnalysisPeriodSelector";
import TrendLineChart from "@/components/dashboard/TrendLineChart";
import PageTabs from "@/components/PageTabs";
import CsvExport from "@/components/insights/CsvExport";
import ChatGPTPrompt from "@/components/insights/ChatGPTPrompt";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getYearlyTrend,
  getYearlySummary,
  getDailyData,
  getWeeklyData,
  getDailySpendingTrend,
  getTransactionDateBounds,
} from "@/lib/data";

type View = "monthly" | "weekly" | "yearly" | "daily";

const ANALYSIS_TABS = [
  { key: "stats", label: "統計" },
  { key: "insights", label: "インサイト" },
];

type Props = {
  searchParams: Promise<{ view?: string; period?: string; month?: string; year?: string; week?: string; tab?: string }>;
};

const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return monday;
}

function createMonthOptions(earliest: Date, now: Date): AnalysisPeriodOption[] {
  const options: AnalysisPeriodOption[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const first = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  while (cursor >= first) {
    options.push({ value: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`, label: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月` });
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return options;
}

function createWeekOptions(earliest: Date, now: Date): AnalysisPeriodOption[] {
  const options: AnalysisPeriodOption[] = [];
  const cursor = mondayOf(now);
  const first = mondayOf(earliest);
  while (cursor >= first) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    const label = cursor.getFullYear() === end.getFullYear()
      ? `${cursor.getFullYear()}/${cursor.getMonth() + 1}/${cursor.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`
      : `${cursor.getFullYear()}/${cursor.getMonth() + 1}/${cursor.getDate()}〜${end.getFullYear()}/${end.getMonth() + 1}/${end.getDate()}`;
    options.push({ value: dateValue(cursor), label });
    cursor.setDate(cursor.getDate() - 7);
  }
  return options;
}

function createYearOptions(earliest: Date, now: Date): AnalysisPeriodOption[] {
  return Array.from({ length: now.getFullYear() - earliest.getFullYear() + 1 }, (_, index) => {
    const year = now.getFullYear() - index;
    return { value: String(year), label: `${year}年` };
  });
}

function analysisTarget(view: View, value: string, label: string) {
  if (view === "weekly") {
    const start = new Date(`${value}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { dateFrom: value, dateTo: dateValue(end), label };
  }
  if (view === "yearly") {
    return { dateFrom: `${value}-01-01`, dateTo: `${value}-12-31`, label };
  }
  const [year, month] = value.split("-").map(Number);
  return {
    dateFrom: `${value}-01`,
    dateTo: `${value}-${pad(new Date(year, month, 0).getDate())}`,
    label,
  };
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? "stats";
  const isInsightsTab = tab === "insights";
  const requestedView: View = ["monthly", "weekly", "yearly", "daily"].includes(params.view ?? "")
    ? params.view as View
    : "monthly";
  const view: View = isInsightsTab && requestedView === "daily" ? "monthly" : requestedView;
  const now = new Date();

  const dateBounds = await getTransactionDateBounds();
  const earliest = dateBounds
    ? new Date(`${dateBounds.earliest}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodOptions = view === "weekly"
    ? createWeekOptions(earliest, now)
    : view === "yearly"
      ? createYearOptions(earliest, now)
      : createMonthOptions(earliest, now);
  const selectedPeriod = periodOptions.some((option) => option.value === params.period)
    ? params.period!
    : periodOptions[0].value;
  const selectedPeriodLabel = periodOptions.find((option) => option.value === selectedPeriod)?.label ?? selectedPeriod;
  const target = analysisTarget(view, selectedPeriod, selectedPeriodLabel);

  if (isInsightsTab) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <PageTabs tabs={ANALYSIS_TABS} currentTab={tab} basePath="/monthly" preserveParams={{ view, period: selectedPeriod }} />
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500">分析対象</p>
            <div className="mt-2"><DashboardTabs activeView={view} excludeDaily /></div>
          </div>
          <AnalysisPeriodSelector value={selectedPeriod} options={periodOptions} />
        </div>
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700">データエクスポート</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">CSVダウンロード</CardTitle>
            </CardHeader>
            <CardContent>
              <CsvExport target={target} analysisView={view as "monthly" | "weekly" | "yearly"} />
            </CardContent>
          </Card>
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700">ChatGPT で分析する</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">プロンプトテンプレート</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatGPTPrompt key={view} target={target} analysisView={view as "monthly" | "weekly" | "yearly"} />
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  let content: React.ReactNode;
  const isDaily = view === "daily";

  if (view === "weekly") {
    const selectedWeekStart = new Date(`${selectedPeriod}T00:00:00`);
    const year = selectedWeekStart.getFullYear();
    const mon = selectedWeekStart.getMonth() + 1;
    const weeklyData = await getWeeklyData(year, mon);
    const week = weeklyData.find((item) => item.startDate === selectedPeriod) ?? weeklyData[0];
    const bal = week.income - week.expense;

    content = (
      <>
        <AnalysisPeriodSelector value={selectedPeriod} options={periodOptions} />
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
    const currentYear = parseInt(selectedPeriod);
    const [summary, trendData] = await Promise.all([
      getYearlySummary(currentYear),
      getYearlyTrend(currentYear),
    ]);
    content = (
      <>
        <AnalysisPeriodSelector value={selectedPeriod} options={periodOptions} />
        <SummaryCards
          income={summary.income}
          expense={summary.expense}
          balance={summary.balance}
          reimbursement={summary.reimbursement}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">月次収支推移</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={trendData.map((d) => ({ month: d.month, income: d.income, expense: d.effectiveExpense }))} />
          </CardContent>
        </Card>
      </>
    );
  } else if (view === "daily") {
    const [currentYear, currentMonth] = selectedPeriod.split("-").map(Number);
    const monthlyData = await getDailyData(currentYear);
    content = (
      <>
        <AnalysisPeriodSelector value={selectedPeriod} options={periodOptions} />
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
        <AnalysisPeriodSelector value={selectedPeriod} options={periodOptions} />
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
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <PageTabs tabs={ANALYSIS_TABS} currentTab={tab} basePath="/monthly" preserveParams={{ view, period: selectedPeriod }} />
        <DashboardTabs activeView={view} />
      </div>
      <div className={`${isDaily ? "max-w-7xl mx-auto" : "max-w-5xl mx-auto"} px-4 pb-8 space-y-6`}>
        {content}
      </div>
    </div>
  );
}

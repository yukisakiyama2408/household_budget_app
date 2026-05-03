import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsightCards from "@/components/insights/InsightCards";
import CsvExport from "@/components/insights/CsvExport";
import GeminiPrompt from "@/components/insights/GeminiPrompt";
import { getBudgetData, getCategoryBreakdown } from "@/lib/data";

export default async function InsightsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [currentItems, prevBreakdown] = await Promise.all([
    getBudgetData(year, month),
    getCategoryBreakdown(prevYear, prevMonth),
  ]);

  const totalExpense = currentItems.reduce((s, i) => s + i.actualAmount, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold">インサイト</h1>

      {/* ルールベースインサイト */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">
          今月のアラート・気づき
        </h2>
        <InsightCards
          currentItems={currentItems}
          prevBreakdown={prevBreakdown}
          totalExpense={totalExpense}
        />
      </section>

      {/* CSV エクスポート */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">データエクスポート</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              CSVダウンロード
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CsvExport />
          </CardContent>
        </Card>
      </section>

      {/* Gemini プロンプト */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">Gemini で分析する</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              プロンプトテンプレート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GeminiPrompt />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

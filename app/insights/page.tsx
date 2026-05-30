import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsightCards from "@/components/insights/InsightCards";
import CsvExport from "@/components/insights/CsvExport";
import ChatGPTPrompt from "@/components/insights/ChatGPTPrompt";
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
      <div>
        <h1 className="text-xl font-bold">インサイト</h1>
        <p className="mt-1 text-sm text-gray-500">
          支出の変化や原因を深掘りします。予算案の作成は予算ページから行えます。
        </p>
      </div>

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
        <h2 className="text-base font-semibold text-gray-700">ChatGPT で深掘りする</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              プロンプトテンプレート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatGPTPrompt />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

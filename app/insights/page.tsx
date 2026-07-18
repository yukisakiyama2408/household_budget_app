import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CsvExport from "@/components/insights/CsvExport";
import ChatGPTPrompt from "@/components/insights/ChatGPTPrompt";

export default function InsightsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold">インサイト</h1>
        <p className="mt-1 text-sm text-gray-500">
          支出の変化や原因を深掘りします。予算案の作成は予算ページから行えます。
        </p>
      </div>

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

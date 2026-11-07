import { getCategories } from "@/lib/data";
import { transactionEntryHref, transactionReturnTo } from "@/lib/transactions/navigation";
import ImportTabs from "@/components/import/ImportTabs";
import Link from "next/link";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = transactionReturnTo((await searchParams).returnTo);
  const categories = await getCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-950">CSVインポート</h1>
          <p className="mt-1 text-sm text-gray-500">
            CSVを読み込み、カテゴリや重複候補を確認してから取引として登録します。
          </p>
        </div>
        <Link
          href={transactionEntryHref("new", returnTo)}
          className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
        >
          手入力で登録
        </Link>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {[
          ["1", "CSVを選択", "PayPay またはクレジットの明細を読み込みます。"],
          ["2", "内容を確認", "カテゴリ補完、重複候補、店舗名を確認します。"],
          ["3", "取引に登録", "必要な行だけをまとめてインポートします。"],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-lg border bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                {step}
              </span>
              <span className="text-sm font-bold text-gray-900">{title}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">{text}</p>
          </div>
        ))}
      </div>
      <Link href={returnTo} className="mb-4 inline-flex min-h-11 items-center text-sm text-indigo-600 hover:underline">元の画面に戻る</Link>
      <ImportTabs categories={categories} returnTo={returnTo} />
    </div>
  );
}

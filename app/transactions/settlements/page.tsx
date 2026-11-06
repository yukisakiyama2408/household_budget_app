import Link from "next/link";
import CreditSettlementForm from "@/components/transactions/CreditSettlementForm";
import TransactionSectionTabs from "@/components/transactions/TransactionSectionTabs";
import TransactionMonthSelector from "@/components/transactions/TransactionMonthSelector";
import { getCreditSettlements } from "@/lib/data";
import { getJapanToday } from "@/lib/dateUtils";
import { normalizeMonth } from "@/lib/fixed-expense-navigation";
import { creditSettlementsHref } from "@/lib/credit-settlements";

export default async function CreditSettlementsPage({ searchParams }: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = normalizeMonth(params.month) ?? getJapanToday().date.slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const settlements = await getCreditSettlements(year);
  const settlement = settlements.find((item) => item.month === monthNumber);
  const sortedSettlements = [...settlements].sort((a, b) => b.month - a.month);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold">カード引落</h1>
        <p className="mt-1 text-sm text-gray-500">口座から引き落とされる月ごとの合計金額と引落日を管理します。</p>
      </div>
      <TransactionSectionTabs active="settlements" month={month} />
      <TransactionMonthSelector month={month} basePath="/transactions/settlements" />

      <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-6">
        <section aria-labelledby="settlement-heading" className="min-w-0 space-y-5 rounded-lg border bg-white p-4 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="settlement-heading" className="text-base font-semibold">{year}年{monthNumber}月の引落額</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${settlement ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {settlement ? "登録済み" : "未登録"}
            </span>
          </div>
          {settlement && (
            <dl className="grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
              <div><dt className="text-xs text-gray-500">登録済みの引落額</dt><dd className="mt-1 text-xl font-bold tabular-nums">¥{settlement.amount.toLocaleString("ja-JP")}</dd></div>
              <div><dt className="text-xs text-gray-500">登録済みの引落日</dt><dd className="mt-1 text-base font-medium tabular-nums">{settlement.settlement_date.replaceAll("-", "/")}</dd></div>
            </dl>
          )}
          <CreditSettlementForm key={month} year={year} month={monthNumber} currentAmount={settlement?.amount ?? null} settlementDate={settlement?.settlement_date ?? null} />
        </section>
        <aside className="space-y-3 rounded-lg border bg-indigo-50/50 p-4 text-sm text-gray-600 sm:p-6">
          <h2 className="font-semibold text-gray-900">利用明細と引落額について</h2>
          <p>カードで購入した内容は「取引明細」に支出として登録します。</p>
          <p>ここには、対象月に口座から引き落とされる合計額を登録します。複数のカードがある場合は合算してください。</p>
          <p>引落額は残高と日次の入出金表示に反映されます。利用明細の支出に重ねて加算されることはありません。</p>
          <p>同じ月に保存すると、登録済みの引落額と引落日を更新します。</p>
        </aside>
      </div>

      <section aria-labelledby="settlement-history-heading" className="space-y-3">
        <h2 id="settlement-history-heading" className="text-base font-semibold">{year}年の登録済み引落</h2>
        {sortedSettlements.length === 0 ? (
          <p className="rounded-lg border p-6 text-sm text-gray-500">この年の引落額はまだ登録されていません。</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="border-b bg-gray-50 text-gray-500"><tr><th scope="col" className="px-3 py-3 text-left font-medium">対象月</th><th scope="col" className="px-3 py-3 text-left font-medium">引落日</th><th scope="col" className="px-3 py-3 text-right font-medium">引落額</th><th scope="col" className="px-3 py-3"><span className="sr-only">操作</span></th></tr></thead>
              <tbody>
                {sortedSettlements.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <th scope="row" className="px-3 py-3 text-left font-medium">{item.month}月</th>
                    <td className="px-3 py-3 tabular-nums">{item.settlement_date.replaceAll("-", "/")}</td>
                    <td className="px-3 py-3 text-right tabular-nums">¥{item.amount.toLocaleString("ja-JP")}</td>
                    <td className="px-3 py-2 text-right"><Link href={creditSettlementsHref(`${year}-${String(item.month).padStart(2, "0")}`)} aria-label={`${year}年${item.month}月の引落額を修正`} className="inline-flex min-h-11 items-center text-indigo-600 hover:underline">修正</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

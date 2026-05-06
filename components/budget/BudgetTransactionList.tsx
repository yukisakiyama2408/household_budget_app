import type { TransactionWithCategory } from "@/lib/data";

type Props = {
  transactions: TransactionWithCategory[];
  title: string;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function BudgetTransactionList({ transactions, title }: Props) {
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
        <div className="flex gap-3 text-xs text-gray-500">
          {totalIncome > 0 && (
            <span className="text-green-700">収入 +{fmt(totalIncome)}</span>
          )}
          <span className="text-red-600">支出 -{fmt(totalExpense)}</span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="border rounded-md p-4 text-sm text-gray-400 text-center">
          取引がありません
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-20">日付</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 hidden sm:table-cell w-28">カテゴリ</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">内容</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 hidden sm:table-cell w-20">支払</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">金額</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 tabular-nums whitespace-nowrap">
                    {t.date.slice(5).replace("-", "/")}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {t.categories ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.categories.color ?? "#B3B3B3" }}
                        />
                        <span className="text-gray-600 truncate">{t.categories.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      {t.categories && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 sm:hidden"
                          style={{ backgroundColor: t.categories.color ?? "#B3B3B3" }}
                        />
                      )}
                      <div className="min-w-0">
                        <span className="truncate block">{t.content}</span>
                        {t.type === "expense" && t.pay_method && (
                          <span className={`sm:hidden text-xs px-1 py-0.5 rounded mt-0.5 inline-block ${t.pay_method === "Credit" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {t.pay_method === "Credit" ? "カード" : "現金"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {t.type === "expense" && t.pay_method ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${t.pay_method === "Credit" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {t.pay_method === "Credit" ? "カード" : "現金"}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-medium whitespace-nowrap ${t.type === "income" ? "text-green-700" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

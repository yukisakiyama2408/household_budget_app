import Link from "next/link";
import { getTransactions, getCategories } from "@/lib/data";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import NewEntryButton from "@/components/NewEntryButton";

type Props = {
  searchParams: Promise<{
    month?: string;
    type?: string;
    category_id?: string;
    pay_method?: string;
  }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [transactions, categories] = await Promise.all([
    getTransactions({
      month: params.month,
      type: params.type,
      categoryId: params.category_id,
      payMethod: params.pay_method,
    }),
    getCategories(),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">収支一覧</h1>
          <NewEntryButton />
        </div>

        <TransactionFilters categories={categories} />

        <div className="text-sm text-muted-foreground flex gap-4">
          <span>
            収入:{" "}
            <span className="text-green-600 font-medium">
              ¥{totalIncome.toLocaleString("ja-JP")}
            </span>
          </span>
          <span>
            支出:{" "}
            <span className="text-red-500 font-medium">
              ¥{totalExpense.toLocaleString("ja-JP")}
            </span>
          </span>
          <span>{transactions.length}件</span>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">日付</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">内容</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">店舗</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">カテゴリ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">金額</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">支払</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    データがありません
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const cat = t.categories as { name: string; color: string } | null;
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t.date}</span>
                        <span className="sm:hidden">{t.date.slice(5).replace("-", "/")}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[100px] sm:max-w-none truncate">{t.content}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {t.store ?? "-"}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {cat ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums font-medium whitespace-nowrap ${
                        t.type === "income" ? "text-green-600" : "text-red-500"
                      }`}>
                        {t.type === "income" ? "+" : "-"}¥{t.amount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">
                        {t.pay_method ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/transactions/${t.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

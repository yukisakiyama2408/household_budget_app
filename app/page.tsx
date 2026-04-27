import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentBalance, getMonthlySummary, getBudgetData, getTransactions } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default async function HomePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [balance, summary, budgetItems, recentTx] = await Promise.all([
    getCurrentBalance(),
    getMonthlySummary(year, month),
    getBudgetData(year, month),
    getTransactions({ limit: 5 }),
  ]);

  const totalBudget = budgetItems.reduce((s, i) => s + i.budgetAmount, 0);
  const totalActual = budgetItems.reduce((s, i) => s + i.actualAmount, 0);
  const budgetRatio = totalBudget > 0 ? Math.min(totalActual / totalBudget, 1) : 0;
  const budgetIsOver = totalActual > totalBudget && totalBudget > 0;

  const topCategories = budgetItems
    .filter((i) => i.budgetAmount > 0)
    .sort((a, b) => b.actualAmount / b.budgetAmount - a.actualAmount / a.budgetAmount)
    .slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <p className="text-sm text-gray-500">{year}年{month}月</p>

      {/* 残高 + 今月収支 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">現在の残高</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold tabular-nums ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              {balance < 0 ? "-" : ""}{fmt(balance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">今月の収支</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">収入</span>
              <span className="font-medium text-green-700 tabular-nums">+{fmt(summary.income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支出</span>
              <span className="font-medium text-red-600 tabular-nums">-{fmt(summary.expense)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-500">収支</span>
              <span className={`font-bold tabular-nums ${summary.balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                {summary.balance >= 0 ? "+" : "-"}{fmt(summary.balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 予算消化 + 直近取引 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">今月の予算消化</CardTitle>
            <Link href="/budget" className="text-xs text-blue-600 hover:underline">詳細 →</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalBudget > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">合計</span>
                    <span className={`tabular-nums ${budgetIsOver ? "text-red-600" : "text-gray-700"}`}>
                      {fmt(totalActual)} / {fmt(totalBudget)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${budgetIsOver ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${budgetRatio * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-0.5">{Math.round(budgetRatio * 100)}%</p>
                </div>
                {topCategories.map((item) => {
                  const r = Math.min(item.actualAmount / item.budgetAmount, 1);
                  const over = item.actualAmount > item.budgetAmount;
                  return (
                    <div key={item.category.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.category.color ?? "#B3B3B3" }}
                          />
                          <span className="text-gray-600">{item.category.name}</span>
                        </div>
                        <span className={over ? "text-red-600" : "text-gray-500"}>
                          {Math.round(r * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${over ? "bg-red-400" : "bg-blue-400"}`}
                          style={{ width: `${r * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-gray-400">
                予算が設定されていません。
                <Link href="/budget" className="text-blue-600 hover:underline ml-1">設定する →</Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">直近の取引</CardTitle>
            <Link href="/transactions" className="text-xs text-blue-600 hover:underline">一覧 →</Link>
          </CardHeader>
          <CardContent>
            {recentTx.length === 0 ? (
              <p className="text-sm text-gray-400">取引がありません</p>
            ) : (
              <div className="space-y-3">
                {recentTx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-xs tabular-nums flex-shrink-0">
                        {t.date.slice(5).replace("-", "/")}
                      </span>
                      {t.categories && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.categories.color ?? "#B3B3B3" }}
                        />
                      )}
                      <span className="truncate text-gray-700">{t.content}</span>
                    </div>
                    <span className={`font-medium tabular-nums flex-shrink-0 ${t.type === "income" ? "text-green-700" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

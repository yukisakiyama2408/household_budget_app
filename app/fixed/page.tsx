import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFixedExpenses, getFixedExpenseLogs } from "@/lib/data";
import ApplyFixedExpensesButton from "@/components/fixed/ApplyFixedExpensesButton";

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default async function FixedExpensesPage() {
  const [fixedExpenses, logs] = await Promise.all([
    getFixedExpenses(),
    getFixedExpenseLogs(),
  ]);

  const appliedMonths = new Map<string, number>();
  for (const log of logs) {
    const key = `${log.year}-${String(log.month).padStart(2, "0")}`;
    appliedMonths.set(key, (appliedMonths.get(key) ?? 0) + 1);
  }
  const recentMonths = Array.from(appliedMonths.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  const active = fixedExpenses.filter((f) => f.is_active);
  const inactive = fixedExpenses.filter((f) => !f.is_active);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">固定費管理</h1>
        <Link href="/fixed/new">
          <Button>+ 新規登録</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">固定費の適用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              選択した月に登録済みの固定費を収支として一括登録します
            </p>
            <ApplyFixedExpensesButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">適用履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMonths.length === 0 ? (
              <p className="text-sm text-gray-400">適用履歴がありません</p>
            ) : (
              <div className="space-y-1.5">
                {recentMonths.map(([key, count]) => {
                  const [y, m] = key.split("-");
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{y}年{parseInt(m)}月</span>
                      <span className="text-gray-400">{count}件適用済み</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 有効な固定費 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-medium">有効な固定費（{active.length}件）</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-2 sm:px-4 py-3 font-medium text-muted-foreground">名前</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">カテゴリ</th>
              <th className="text-right px-2 sm:px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">金額</th>
              <th className="text-center px-2 sm:px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">毎月</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">支払</th>
              <th className="px-2 sm:px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  有効な固定費がありません
                </td>
              </tr>
            ) : (
              active.map((fe) => (
                <tr key={fe.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline ${
                        fe.type === "expense" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {fe.type === "expense" ? "支出" : "収入"}
                      </span>
                      <span className="truncate">{fe.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {fe.categories ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fe.categories.color ?? "#B3B3B3" }}
                        />
                        {fe.categories.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className={`px-2 sm:px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap ${
                    fe.type === "expense" ? "text-red-600" : "text-green-600"
                  }`}>
                    {fe.type === "expense" ? "-" : "+"}{fmt(fe.amount)}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-center text-gray-500 whitespace-nowrap">{fe.day_of_month}日</td>
                  <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                    {fe.pay_method ?? "-"}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right">
                    <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      編集
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 無効な固定費 */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden opacity-60">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-medium text-gray-400">無効な固定費（{inactive.length}件）</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {inactive.map((fe) => (
                <tr key={fe.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-gray-400">{fe.name}</td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{fmt(fe.amount)}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{fe.day_of_month}日</td>
                  <td className="px-2 sm:px-4 py-3 text-right">
                    <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

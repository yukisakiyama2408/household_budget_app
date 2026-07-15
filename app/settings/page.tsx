import Link from "next/link";
import PushSubscribeButton from "@/components/push/PushSubscribeButton";
import CategoryManager from "@/components/categories/CategoryManager";
import ApplyFixedExpensesButton from "@/components/fixed/ApplyFixedExpensesButton";
import { getCategories, getFixedExpenseLogs, getFixedExpenses } from "@/lib/data";
import LogoutButton from "@/components/auth/LogoutButton";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default async function SettingsPage() {
  const [categories, fixedExpenses, fixedLogs] = await Promise.all([
    getCategories(),
    getFixedExpenses(),
    getFixedExpenseLogs(),
  ]);

  const activeFixed = fixedExpenses.filter((f) => f.is_active);
  const inactiveFixed = fixedExpenses.filter((f) => !f.is_active);
  const appliedMonths = new Map<string, number>();
  for (const log of fixedLogs) {
    const key = `${log.year}-${String(log.month).padStart(2, "0")}`;
    appliedMonths.set(key, (appliedMonths.get(key) ?? 0) + 1);
  }
  const recentApplied = Array.from(appliedMonths.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold">設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          カテゴリ、固定費、通知など、アプリの運用に関わる項目を管理します。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">アカウント</h2>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">この端末のログインセッションを終了します。</p>
          <LogoutButton />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">カテゴリ</h2>
        <div className="rounded-lg border bg-white p-4">
          <CategoryManager categories={categories} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-700">固定費</h2>
            <p className="mt-1 text-sm text-gray-500">
              毎月発生する収支を管理し、選択月へまとめて反映します。
            </p>
          </div>
          <Link
            href="/fixed/new"
            className="inline-flex h-9 items-center rounded-md bg-indigo-600 px-3 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
          >
            + 新規登録
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-500">固定費の適用</p>
            <p className="text-xs text-gray-400">登録済みの固定費を収支として一括登録します</p>
            <ApplyFixedExpensesButton />
          </div>
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-500">適用履歴</p>
            {recentApplied.length === 0 ? (
              <p className="text-sm text-gray-400">適用履歴がありません</p>
            ) : (
              <div className="space-y-1.5">
                {recentApplied.map(([key, count]) => {
                  const [year, month] = key.split("-");
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{year}年{parseInt(month)}月</span>
                      <span className="text-gray-400">{count}件適用済み</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-medium">有効な固定費（{activeFixed.length}件）</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-500">名前</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">カテゴリ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">金額</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">毎月</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {activeFixed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                    有効な固定費がありません
                  </td>
                </tr>
              ) : (
                activeFixed.map((fe) => (
                  <tr key={fe.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded hidden sm:inline ${fe.type === "expense" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {fe.type === "expense" ? "支出" : "収入"}
                        </span>
                        {fe.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {fe.categories ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fe.categories.color ?? "#B3B3B3" }} />
                          {fe.categories.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${fe.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {fe.type === "expense" ? "-" : "+"}{fmt(fe.amount)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{fe.day_of_month}日</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline">編集</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {inactiveFixed.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-white opacity-60">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-medium text-gray-400">無効な固定費（{inactiveFixed.length}件）</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {inactiveFixed.map((fe) => (
                  <tr key={fe.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-gray-400">{fe.name}</td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{fmt(fe.amount)}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{fe.day_of_month}日</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/fixed/${fe.id}/edit`} className="text-xs text-blue-600 hover:underline">編集</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">プッシュ通知</h2>
        <p className="text-sm text-gray-500">
          月次・週次予算が未登録のとき、毎週月曜と毎月1日の朝9時に通知します。
        </p>
        <div className="border rounded-lg bg-white p-4">
          <PushSubscribeButton />
        </div>
      </section>
    </div>
  );
}

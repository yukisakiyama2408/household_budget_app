"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Download, MoreHorizontal, Upload } from "lucide-react";
import TransactionFilters from "./TransactionFilters";
import NewEntryButton from "@/components/NewEntryButton";
import TransactionSectionTabs from "./TransactionSectionTabs";
import { loadMoreTransactions } from "@/app/actions/transaction-list";
import type { Category, TransactionWithCategory } from "@/types/database";
import type { TransactionPage } from "@/lib/transactions/list";
import type { TransactionFiltersValue } from "@/lib/transactions/filters";

type DisplayTransaction = TransactionWithCategory;

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function fmt(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${year}年${month}月${day}日 ${weekdayLabels[d.getDay()]}曜日`;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function groupByDate(transactions: DisplayTransaction[]) {
  return transactions.reduce<{ date: string; items: DisplayTransaction[] }[]>((groups, transaction) => {
    const current = groups[groups.length - 1];
    if (current?.date === transaction.date) {
      current.items.push(transaction);
    } else {
      groups.push({ date: transaction.date, items: [transaction] });
    }
    return groups;
  }, []);
}

export default function TransactionListView({ initialPage, categories, filters, monthOptions, search }: {
  initialPage: TransactionPage;
  categories: Category[];
  filters: TransactionFiltersValue;
  monthOptions: string[];
  search: string;
}) {
  const [pageState, setPageState] = useState({ source: initialPage, transactions: initialPage.transactions, nextCursor: initialPage.nextCursor, error: null as string | null });
  if (pageState.source !== initialPage) {
    setPageState({ source: initialPage, transactions: initialPage.transactions, nextCursor: initialPage.nextCursor, error: null });
  }
  const { transactions, nextCursor, error } = pageState;
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor || isPending) return;
    setPageState((current) => ({ ...current, error: null }));
    startTransition(async () => {
      try {
        const page = await loadMoreTransactions(search, nextCursor);
        setPageState((current) => {
          if (current.source !== initialPage) return current;
          const ids = new Set(current.transactions.map((item) => item.id));
          return { ...current, transactions: [...current.transactions, ...page.transactions.filter((item) => !ids.has(item.id))], nextCursor: page.nextCursor };
        });
      } catch {
        setPageState((current) => current.source !== initialPage ? current : { ...current, error: "読み込めませんでした。もう一度ボタンを押してお試しください。" });
      }
    });
  }

  const { totalIncome, totalExpense, incomeCount, expenseCount, cashCount, creditCount, groupedTransactions } = useMemo(() => {
    let totalIncome = 0, totalExpense = 0, incomeCount = 0, expenseCount = 0, cashCount = 0, creditCount = 0;
    for (const transaction of transactions) {
      if (transaction.type === "income") { totalIncome += transaction.amount; incomeCount++; }
      if (transaction.type === "expense") { totalExpense += transaction.amount; expenseCount++; }
      if (transaction.pay_method === "Cash") cashCount++;
      if (transaction.pay_method === "Credit") creditCount++;
    }
    return { totalIncome, totalExpense, incomeCount, expenseCount, cashCount, creditCount, groupedTransactions: groupByDate(transactions) };
  }, [transactions]);
  const balance = totalIncome - totalExpense;
  const monthLabel = filters.months.length ? `${filters.months.length}か月を選択` : "全期間";
  const selectedMonth = filters.months.length === 1 ? filters.months[0] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-950">収支一覧</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{filters.dateFrom ? `${filters.dateFrom}〜${filters.dateTo}` : monthLabel}の取引を新しい順に表示します。</span>
              {!filters.months.length && !filters.dateFrom && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                  全期間表示中
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Link
              href="/api/export/csv?period=current"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-gray-500 transition-colors hover:bg-gray-50"
              aria-label="当月のCSVダウンロード"
              title="当月のCSVダウンロード"
            >
              <Download className="h-4 w-4" />
            </Link>
            <Link
              href="/import"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-gray-500 transition-colors hover:bg-gray-50"
              aria-label="CSVアップロード"
            >
              <Upload className="h-4 w-4" />
            </Link>
            <NewEntryButton />
          </div>
        </div>

        <div className="mb-5">
          <TransactionSectionTabs active="transactions" month={selectedMonth} transactionSearch={search} />
        </div>

        <section className="mb-3 grid gap-2 md:grid-cols-[1.25fr_.9fr_.9fr]">
          <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-500">
              <span>表示中の収支</span>
              <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] text-teal-700">
                {transactions.length}件
              </span>
            </div>
            <div
              className={`mt-2 text-2xl font-extrabold tabular-nums ${
                balance >= 0 ? "text-gray-950" : "text-red-600"
              }`}
            >
              {balance >= 0 ? "+" : "-"}
              {fmt(Math.abs(balance))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              読み込み済み明細：収入 {fmt(totalIncome)} − 支出 {fmt(totalExpense)}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-500">
              <span>収入（表示中）</span>
              <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] text-green-700">
                {incomeCount}件
              </span>
            </div>
            <div className="mt-2 text-xl font-extrabold tabular-nums text-green-700">
              {fmt(totalIncome)}
            </div>
            <p className="mt-2 text-xs text-gray-500">読み込み済み明細の合計</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-500">
              <span>支出（表示中）</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                {expenseCount}件
              </span>
            </div>
            <div className="mt-2 text-xl font-extrabold tabular-nums text-red-600">
              {fmt(totalExpense)}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Cash {cashCount}件 / Credit {creditCount}件
            </p>
          </div>
        </section>

        <div className="grid items-start gap-3 lg:grid-cols-[258px_minmax(0,1fr)]">
          <TransactionFilters
            categories={categories}
            filters={filters}
            monthOptions={monthOptions}
          />

          <section className="overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-4 py-3">
              <div>
                <h2 className="text-base font-bold text-gray-950">取引明細</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {transactions.length}件表示中。{nextCursor ? "続きは下のボタンから読み込めます。" : "条件に一致する明細をすべて表示しています。"}
                </p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">データがありません</div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] table-fixed text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="w-[92px] px-3 py-2.5 text-left text-[11px] font-bold text-gray-500">日付</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500">内容</th>
                        <th className="w-[132px] px-3 py-2.5 text-left text-[11px] font-bold text-gray-500">店舗</th>
                        <th className="w-[126px] px-3 py-2.5 text-left text-[11px] font-bold text-gray-500">カテゴリ</th>
                        <th className="w-[92px] px-3 py-2.5 text-left text-[11px] font-bold text-gray-500">支払</th>
                        <th className="w-[128px] px-3 py-2.5 text-right text-[11px] font-bold text-gray-500">金額</th>
                        <th className="w-[58px] px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {groupedTransactions.map((group) => (
                        <Fragment key={group.date}>
                          <tr key={`${group.date}-heading`} className="border-b bg-gray-50/70">
                            <td colSpan={7} className="px-3 py-2 text-[11px] font-extrabold text-gray-500">
                              {formatDateLabel(group.date)}
                            </td>
                          </tr>
                          {group.items.map((t) => {
                            const cat = t.categories as { name: string; color: string | null } | null;
                            return (
                              <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50/70">
                                <td className="px-3 py-3 font-bold tabular-nums text-gray-500">
                                  {formatShortDate(t.date)}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <span
                                      className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-black ${
                                        t.type === "income"
                                          ? "bg-green-50 text-green-700"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {t.type === "income" ? "+" : "-"}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate font-bold text-gray-950">{t.content}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="truncate px-3 py-3 text-gray-600">{t.store ?? "-"}</td>
                                <td className="px-3 py-3">
                                  {cat ? (
                                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
                                      <span
                                        className="h-2 w-2 flex-none rounded-full"
                                        style={{ backgroundColor: cat.color ?? "#64748b" }}
                                      />
                                      <span className="truncate">{cat.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-500">
                                    {t.pay_method ?? "-"}
                                  </span>
                                </td>
                                <td
                                  className={`px-3 py-3 text-right font-extrabold tabular-nums whitespace-nowrap ${
                                    t.type === "income" ? "text-green-700" : "text-red-600"
                                  }`}
                                >
                                  {t.type === "income" ? "+" : "-"}
                                  {fmt(t.amount)}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <Link
                                    href={`/transactions/${t.id}/edit`}
                                    className="inline-flex h-8 w-9 items-center justify-center rounded-lg border text-gray-500 transition-colors hover:bg-gray-50"
                                    aria-label={`${t.content}を編集`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 p-3 md:hidden">
                  {groupedTransactions.map((group) => (
                    <div key={group.date}>
                      <div className="px-1 py-2 text-[11px] font-extrabold text-gray-500">
                        {formatDateLabel(group.date)}
                      </div>
                      <div className="space-y-2">
                        {group.items.map((t) => {
                          const cat = t.categories as { name: string; color: string | null } | null;
                          return (
                            <Link
                              key={t.id}
                              href={`/transactions/${t.id}/edit`}
                              className="grid min-h-16 grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border bg-white p-3 transition-colors hover:bg-gray-50"
                            >
                              <span
                                className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-black ${
                                  t.type === "income"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {t.type === "income" ? "+" : "-"}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-gray-950">{t.content}</span>
                                <span className="mt-0.5 block truncate text-xs text-gray-500">
                                  {[t.store, cat?.name, t.pay_method].filter(Boolean).join(" · ") || "-"}
                                </span>
                              </span>
                              <span
                                className={`text-sm font-extrabold tabular-nums whitespace-nowrap ${
                                  t.type === "income" ? "text-green-700" : "text-red-600"
                                }`}
                              >
                                {t.type === "income" ? "+" : "-"}
                                {fmt(t.amount)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="space-y-3 border-t px-4 py-4 text-center">
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <p role="status" className="text-xs text-gray-500">{transactions.length}件読み込み済み</p>
              {nextCursor && (
                <button type="button" onClick={loadMore} disabled={isPending} className="min-h-11 rounded-lg border bg-white px-6 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                  {isPending ? "読み込み中…" : "もっと読み込む（50件）"}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

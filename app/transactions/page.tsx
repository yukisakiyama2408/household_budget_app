import { getCategories, getTransactionDateBounds } from "@/lib/data";
import { getTransactionPage } from "@/lib/transactions/list";
import { parseTransactionFilters, transactionFilterParams, transactionMonthOptions, type TransactionSearchParams } from "@/lib/transactions/filters";
import TransactionListView from "@/components/transactions/TransactionListView";

export default async function TransactionsPage({ searchParams }: {
  searchParams: Promise<TransactionSearchParams>;
}) {
  const filters = parseTransactionFilters(await searchParams);
  const search = transactionFilterParams(filters).toString();
  const [initialPage, categories, bounds] = await Promise.all([
    getTransactionPage(filters), getCategories(), getTransactionDateBounds(),
  ]);
  return <TransactionListView initialPage={initialPage} categories={categories} filters={filters} monthOptions={transactionMonthOptions(bounds, filters.months)} search={search} />;
}

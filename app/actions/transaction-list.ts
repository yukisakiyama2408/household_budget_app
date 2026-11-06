"use server";

import { parseTransactionFilters } from "@/lib/transactions/filters";
import { getTransactionPage } from "@/lib/transactions/list";

export async function loadMoreTransactions(search: string, cursor: unknown) {
  if (typeof search !== "string" || search.length > 20000) throw new Error("絞り込み条件が不正です。");
  return getTransactionPage(parseTransactionFilters(new URLSearchParams(search)), cursor);
}

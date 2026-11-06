import { redirect } from "next/navigation";
import { fixedExpensesHref, fixedExpensesReturnTo, legacyFixedExpenseMonth } from "@/lib/fixed-expense-navigation";

export default async function LegacyNewFixedExpensePage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string; year?: string; month?: string }>;
}) {
  const query = await searchParams;
  const returnTo = query.returnTo
    ? fixedExpensesReturnTo(query.returnTo)
    : fixedExpensesHref(legacyFixedExpenseMonth(query.year, query.month));
  redirect(`/transactions/fixed/new?returnTo=${encodeURIComponent(returnTo)}`);
}

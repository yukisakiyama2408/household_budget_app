import { redirect } from "next/navigation";
import { fixedExpensesHref, fixedExpensesReturnTo, legacyFixedExpenseMonth } from "@/lib/fixed-expense-navigation";

export default async function LegacyEditFixedExpensePage({ searchParams, params }: {
  searchParams: Promise<{ returnTo?: string; year?: string; month?: string }>;
  params: Promise<{ id: string }>;
}) {
  const query = await searchParams;
  const returnTo = query.returnTo
    ? fixedExpensesReturnTo(query.returnTo)
    : fixedExpensesHref(legacyFixedExpenseMonth(query.year, query.month));
  const { id } = await params;
  redirect(`/transactions/fixed/${encodeURIComponent(id)}/edit?returnTo=${encodeURIComponent(returnTo)}`);
}

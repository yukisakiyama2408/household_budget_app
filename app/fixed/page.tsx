import { redirect } from "next/navigation";
import { fixedExpensesHref, legacyFixedExpenseMonth } from "@/lib/fixed-expense-navigation";

export default async function LegacyFixedExpensesPage({ searchParams }: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  redirect(fixedExpensesHref(legacyFixedExpenseMonth(params.year, params.month)));
}

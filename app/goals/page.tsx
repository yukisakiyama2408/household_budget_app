import { redirect } from "next/navigation";
import { budgetSectionHref, type BudgetNavigationContext } from "@/lib/budget-navigation";

export default async function LegacyGoalsPage({ searchParams }: {
  searchParams: Promise<BudgetNavigationContext>;
}) {
  redirect(budgetSectionHref("goals", await searchParams));
}

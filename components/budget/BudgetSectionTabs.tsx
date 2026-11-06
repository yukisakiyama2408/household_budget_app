import Link from "next/link";
import { budgetSectionHref, type BudgetNavigationContext } from "@/lib/budget-navigation";

type Props = {
  active: "budget" | "goals";
  context?: BudgetNavigationContext;
};

export default function BudgetSectionTabs({ active, context }: Props) {
  return (
    <nav aria-label="予算の画面切り替え" className="flex border-b">
      {([{ key: "budget", label: "予算" }, { key: "goals", label: "目標" }] as const).map(({ key, label }) => (
        <Link key={key} href={budgetSectionHref(key, context)} aria-current={active === key ? "page" : undefined}
          className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-4 py-3 text-sm font-medium ${active === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

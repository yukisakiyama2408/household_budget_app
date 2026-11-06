import Link from "next/link";
import { fixedExpensesHref } from "@/lib/fixed-expense-navigation";
import { creditSettlementsHref } from "@/lib/credit-settlements";

type Props = {
  active: "transactions" | "fixed" | "settlements";
  month?: string;
  transactionParams?: Record<string, string | undefined>;
};

export default function TransactionSectionTabs({ active, month, transactionParams = {} }: Props) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(transactionParams)) {
    if (value) params.set(key, value);
  }
  if (month && !params.has("month")) params.set("month", month);
  const links = [
    { key: "transactions", label: "取引明細", href: params.size ? `/transactions?${params}` : "/transactions" },
    { key: "fixed", label: "固定費", href: fixedExpensesHref(month) },
    { key: "settlements", label: "カード引落", href: creditSettlementsHref(month) },
  ];

  return (
    <nav aria-label="収支の画面切り替え" className="flex border-b">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          aria-current={active === link.key ? "page" : undefined}
          className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium ${active === link.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

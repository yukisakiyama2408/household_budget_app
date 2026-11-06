"use client";

import { useRouter } from "next/navigation";
import { fixedExpensesHref } from "@/lib/fixed-expense-navigation";

export default function FixedExpenseMonthSelector({ month }: { month: string }) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
      対象月
      <input
        type="month"
        value={month}
        onChange={(event) => {
          if (event.target.value) router.push(fixedExpensesHref(event.target.value));
        }}
        className="h-11 min-w-0 rounded-md border bg-white px-3 text-gray-900"
      />
    </label>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { normalizeMonth } from "@/lib/fixed-expense-navigation";

type Props = {
  month: string;
  basePath: "/transactions/fixed" | "/transactions/settlements";
};

export default function TransactionMonthSelector({ month, basePath }: Props) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
      対象月
      <input
        type="month"
        value={month}
        onChange={(event) => {
          const selectedMonth = normalizeMonth(event.target.value);
          if (selectedMonth) router.push(`${basePath}?month=${selectedMonth}`);
        }}
        className="h-11 min-w-0 rounded-md border bg-white px-3 text-gray-900"
      />
    </label>
  );
}

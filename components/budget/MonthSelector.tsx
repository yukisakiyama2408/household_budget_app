"use client";

import { budgetSectionHref } from "@/lib/budget-navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
  month: number;
  extraParams?: string;
};

export default function MonthSelector({ year, month, extraParams }: Props) {
  const router = useRouter();

  function navigate(y: number, m: number) {
    router.push(budgetSectionHref("budget", { year: String(y), month: String(m), view: new URLSearchParams(extraParams).get("view") ?? "monthly" }));
  }

  function prev() {
    if (month === 1) navigate(year - 1, 12);
    else navigate(year, month - 1);
  }

  function next() {
    if (month === 12) navigate(year + 1, 1);
    else navigate(year, month + 1);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={prev}
        aria-label="前の月"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <label>
        <span className="sr-only">予算を設定する月</span>
        <input
          type="month"
          value={`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`}
          onChange={(event) => {
            if (!event.target.value) return;
            const [selectedYear, selectedMonth] = event.target.value.split("-").map(Number);
            navigate(selectedYear, selectedMonth);
          }}
          className="h-9 w-36 rounded-md border bg-white px-3 text-center text-sm font-semibold text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <Button variant="outline" size="icon" onClick={next} aria-label="次の月">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

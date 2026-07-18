"use client";

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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const monthOptions = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - 1 + index, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });

  function navigate(y: number, m: number) {
    const base = `/budget?year=${y}&month=${m}`;
    router.push(extraParams ? `${base}&${extraParams}` : base);
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
        disabled={isCurrentMonth}
        aria-label="前の月"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <label>
        <span className="sr-only">予算を設定する月</span>
        <select
          value={`${year}-${month}`}
          onChange={(event) => {
            const [selectedYear, selectedMonth] = event.target.value.split("-").map(Number);
            navigate(selectedYear, selectedMonth);
          }}
          className="h-9 w-36 rounded-md border bg-white px-3 text-center text-sm font-semibold text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {monthOptions.map((option) => (
            <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
              {option.year}年{option.month}月
            </option>
          ))}
        </select>
      </label>
      <Button variant="outline" size="icon" onClick={next} aria-label="次の月">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

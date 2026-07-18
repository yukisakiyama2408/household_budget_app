"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentWeekStart, getWeeksOfMonth } from "@/lib/dateUtils";

type Props = {
  year: number;
  month: number;
  weekStart: string;
};

export default function WeekSelector({ year, month, weekStart }: Props) {
  const router = useRouter();
  const currentWeekStart = getCurrentWeekStart();
  const weeks = getWeeksOfMonth(year, month).filter((week) => week.start >= currentWeekStart);
  const currentIndex = weeks.findIndex((w) => w.start === weekStart);
  const current = weeks[currentIndex] ?? weeks[0];

  function navigate(index: number) {
    const w = weeks[index];
    if (!w) return;
    router.push(`/budget?year=${year}&month=${month}&view=weekly&weekStart=${w.start}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(currentIndex - 1)}
        disabled={currentIndex <= 0}
        aria-label="前の週"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <label>
        <span className="sr-only">予算を設定する週</span>
        <select
          value={current?.start ?? ""}
          onChange={(event) => navigate(weeks.findIndex((week) => week.start === event.target.value))}
          className="h-9 w-40 rounded-md border bg-white px-3 text-center text-sm font-medium text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {weeks.map((week) => (
            <option key={week.start} value={week.start}>{week.label}</option>
          ))}
        </select>
      </label>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(currentIndex + 1)}
        disabled={currentIndex >= weeks.length - 1}
        aria-label="次の週"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

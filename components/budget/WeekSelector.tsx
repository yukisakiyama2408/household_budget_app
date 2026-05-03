"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeeksOfMonth } from "@/lib/dateUtils";

type Props = {
  year: number;
  month: number;
  weekStart: string;
};

export default function WeekSelector({ year, month, weekStart }: Props) {
  const router = useRouter();
  const weeks = getWeeksOfMonth(year, month);
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
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-36 text-center tabular-nums">
        {current?.label ?? ""}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(currentIndex + 1)}
        disabled={currentIndex >= weeks.length - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

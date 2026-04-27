"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
  month: number;
};

export default function MonthSelector({ year, month }: Props) {
  const router = useRouter();

  function navigate(y: number, m: number) {
    router.push(`/budget?year=${y}&month=${m}`);
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
      <Button variant="outline" size="icon" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-semibold w-32 text-center">{year}年{month}月</span>
      <Button variant="outline" size="icon" onClick={next}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

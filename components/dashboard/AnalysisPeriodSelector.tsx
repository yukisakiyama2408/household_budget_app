"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AnalysisPeriodOption = { value: string; label: string };

type Props = {
  value: string;
  options: AnalysisPeriodOption[];
  view?: string;
};

export default function AnalysisPeriodSelector({ value, options, view }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentIndex = options.findIndex((option) => option.value === value);

  function navigate(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextValue);
    if (view) params.set("view", view);
    params.delete("month");
    params.delete("year");
    params.delete("week");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <Button
        variant="outline"
        size="icon"
        onClick={() => options[currentIndex + 1] && navigate(options[currentIndex + 1].value)}
        disabled={currentIndex < 0 || currentIndex >= options.length - 1}
        aria-label="前の期間"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <label className="min-w-0 flex-1">
        <span className="sr-only">分析対象期間</span>
        <select
          value={value}
          onChange={(event) => navigate(event.target.value)}
          className="h-11 w-full min-w-0 max-w-full rounded-md border border-gray-300 bg-white px-2 text-center text-sm font-semibold text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-64"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <Button
        variant="outline"
        size="icon"
        onClick={() => options[currentIndex - 1] && navigate(options[currentIndex - 1].value)}
        disabled={currentIndex <= 0}
        aria-label="次の期間"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

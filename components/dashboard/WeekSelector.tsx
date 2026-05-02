"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  weekIndex: number;  // 0-based
  totalWeeks: number;
  label: string;
};

export default function WeekSelector({ weekIndex, totalWeeks, label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(delta: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", String(weekIndex + delta + 1)); // 1-based in URL
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(-1)}
        disabled={weekIndex === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-semibold w-36 text-center">{label}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(1)}
        disabled={weekIndex === totalWeeks - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

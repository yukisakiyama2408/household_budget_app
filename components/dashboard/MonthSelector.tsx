"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
  month: number;
};

export default function MonthSelector({ year, month }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", `${y}-${m}`);
    params.delete("year");
    router.push(`${pathname}?${params.toString()}`);
  }

  const label = `${year}年${month}月`;

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-semibold w-28 text-center">{label}</span>
      <Button variant="outline" size="icon" onClick={() => navigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

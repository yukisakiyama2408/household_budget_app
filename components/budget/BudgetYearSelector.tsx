"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
};

export default function BudgetYearSelector({ year }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(y: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    router.push(`/budget?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(year - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold w-20 text-center">{year}年</span>
      <Button variant="outline" size="icon" onClick={() => navigate(year + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

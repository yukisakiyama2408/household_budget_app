"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
};

export default function YearSelector({ year }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(y: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => navigate(year - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-semibold w-20 text-center">{year}年</span>
      <Button variant="outline" size="icon" onClick={() => navigate(year + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

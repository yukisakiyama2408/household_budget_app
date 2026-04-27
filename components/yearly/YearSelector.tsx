"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
};

export default function YearSelector({ year }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(y: number) {
    router.push(`${pathname}?year=${y}`);
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

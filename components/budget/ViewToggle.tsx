"use client";

import { budgetSectionHref } from "@/lib/budget-navigation";
import { useRouter } from "next/navigation";

type Props = {
  view: "monthly" | "weekly";
  year: number;
  month: number;
  weekStart: string;
};

export default function ViewToggle({ view, year, month, weekStart }: Props) {
  const router = useRouter();

  function switchTo(v: "monthly" | "weekly") {
    router.push(budgetSectionHref("budget", { view: v, month: v === "weekly" ? `${year}-${String(month).padStart(2, "0")}` : undefined, period: v === "weekly" ? weekStart : (view === "weekly" ? weekStart.slice(0, 7) : `${year}-${String(month).padStart(2, "0")}`) }));
  }

  return (
    <div className="flex rounded-md border overflow-hidden text-sm w-fit">
      {(["monthly", "weekly"] as const).map((v) => (
        <button
          key={v}
          aria-pressed={view === v}
          onClick={() => switchTo(v)}
          className={`px-4 py-1.5 transition-colors ${
            view === v ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {v === "monthly" ? "月次" : "週次"}
        </button>
      ))}
    </div>
  );
}

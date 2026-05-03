"use client";

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
    const base = `/budget?year=${year}&month=${month}`;
    router.push(v === "weekly" ? `${base}&view=weekly&weekStart=${weekStart}` : base);
  }

  return (
    <div className="flex rounded-md border overflow-hidden text-sm w-fit">
      {(["monthly", "weekly"] as const).map((v) => (
        <button
          key={v}
          onClick={() => switchTo(v)}
          className={`px-4 py-1.5 transition-colors ${
            view === v ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {v === "monthly" ? "月次" : "週次"}
        </button>
      ))}
    </div>
  );
}

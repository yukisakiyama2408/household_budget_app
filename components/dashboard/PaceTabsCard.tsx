"use client";

import { useState } from "react";
import PaceCard from "./PaceCard";
import WeeklyPaceCard from "./WeeklyPaceCard";
import type { PaceData } from "@/lib/data";

type Props = {
  pace: PaceData;
  weekLabel: string;
  weekStart: string;
  weeklyBudget: number;
  weeklyExpense: number;
  dayOfWeek: number;
};

export default function PaceTabsCard({ pace, weekLabel, weekStart, weeklyBudget, weeklyExpense, dayOfWeek }: Props) {
  const [tab, setTab] = useState<"monthly" | "weekly">("monthly");

  return (
    <div className="space-y-2">
      <div className="flex border-b">
        {(["monthly", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "monthly" ? "今月のペース" : "今週のペース"}
          </button>
        ))}
      </div>
      {tab === "monthly" ? (
        <PaceCard {...pace} />
      ) : (
        <WeeklyPaceCard
          weekLabel={weekLabel}
          weekStart={weekStart}
          weeklyBudget={weeklyBudget}
          weeklyExpense={weeklyExpense}
          dayOfWeek={dayOfWeek}
        />
      )}
    </div>
  );
}

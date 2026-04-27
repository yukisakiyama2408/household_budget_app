"use client";

import { useRouter, useSearchParams } from "next/navigation";

type View = "monthly" | "yearly" | "daily";

const tabs: { key: View; label: string }[] = [
  { key: "monthly", label: "月次" },
  { key: "yearly", label: "年次" },
  { key: "daily", label: "日次" },
];

export default function DashboardTabs({ activeView }: { activeView: View }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(view: View) {
    const params = new URLSearchParams();
    params.set("view", view);

    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (view === "monthly") {
      if (monthParam) {
        params.set("month", monthParam);
      } else if (yearParam) {
        const now = new Date();
        const y = parseInt(yearParam);
        const m = y === now.getFullYear() ? String(now.getMonth() + 1).padStart(2, "0") : "01";
        params.set("month", `${y}-${m}`);
      }
    } else {
      if (yearParam) {
        params.set("year", yearParam);
      } else if (monthParam) {
        params.set("year", monthParam.split("-")[0]);
      }
    }

    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => switchView(key)}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeView === key
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

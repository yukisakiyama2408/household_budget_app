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
    <select
      value={activeView}
      onChange={(e) => switchView(e.target.value as View)}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      {tabs.map(({ key, label }) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}

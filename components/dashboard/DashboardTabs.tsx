"use client";

import { useRouter, useSearchParams } from "next/navigation";

type View = "monthly" | "weekly" | "yearly" | "daily";

const tabs: { key: View; label: string }[] = [
  { key: "monthly", label: "月次" },
  { key: "weekly", label: "週次" },
  { key: "yearly", label: "年次" },
  { key: "daily", label: "日次" },
];

export default function DashboardTabs({ activeView, excludeDaily = false }: { activeView: View; excludeDaily?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(view: View) {
    const params = new URLSearchParams();
    params.set("view", view);
    const tab = searchParams.get("tab");
    if (tab) params.set("tab", tab);

    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={activeView}
      onChange={(e) => switchView(e.target.value as View)}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      {tabs.filter((tab) => !excludeDaily || tab.key !== "daily").map(({ key, label }) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}

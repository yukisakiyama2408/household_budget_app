"use client";

import { usePathname, useRouter } from "next/navigation";
import { resolveAnalysisSelection, switchAnalysisView } from "@/lib/analysis-navigation";

type View = "monthly" | "weekly" | "yearly" | "daily";

const tabs: { key: View; label: string }[] = [
  { key: "monthly", label: "月次" },
  { key: "weekly", label: "週次" },
  { key: "yearly", label: "年次" },
  { key: "daily", label: "日次" },
];

export default function DashboardTabs({ activeView, period, excludeDaily = false }: { activeView: View; period: string; excludeDaily?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchView(view: View) {
    const next = switchAnalysisView(resolveAnalysisSelection({ view: activeView, period }), view);
    router.push(`${pathname}?${new URLSearchParams({ view: next.view, period: next.period })}`);
  }

  return (
    <select
      aria-label="集計単位"
      value={activeView}
      onChange={(e) => switchView(e.target.value as View)}
      className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      {tabs.filter((tab) => !excludeDaily || tab.key !== "daily").map(({ key, label }) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}

"use client";

import { useState } from "react";

const PERIODS = [
  { value: "week", label: "今週" },
  { value: "prev_week", label: "先週" },
  { value: "current", label: "今月" },
  { value: "prev", label: "先月" },
  { value: "3months", label: "過去3ヶ月" },
  { value: "year", label: "今年" },
  { value: "all", label: "全データ" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export default function CsvExport() {
  const [period, setPeriod] = useState<Period>("current");

  function handleDownload() {
    window.location.href = `/api/export/csv?period=${period}`;
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-md border overflow-hidden text-sm">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 transition-colors ${
              period === p.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        CSVダウンロード
      </button>
    </div>
  );
}

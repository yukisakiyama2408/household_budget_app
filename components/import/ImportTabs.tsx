"use client";

import { useState } from "react";
import CsvImportForm from "./CsvImportForm";
import CreditCsvImportForm from "./CreditCsvImportForm";
import type { Category } from "@/types/database";

type Tab = "paypay" | "credit";

const tabs: { key: Tab; label: string }[] = [
  { key: "paypay", label: "PayPay" },
  { key: "credit", label: "クレジットカード" },
];

export default function ImportTabs({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<Tab>("paypay");

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "paypay" ? (
        <CsvImportForm categories={categories} />
      ) : (
        <CreditCsvImportForm categories={categories} />
      )}
    </div>
  );
}

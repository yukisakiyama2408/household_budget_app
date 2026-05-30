"use client";

import { useState } from "react";
import CsvImportForm from "./CsvImportForm";
import CreditCsvImportForm from "./CreditCsvImportForm";
import type { Category } from "@/types/database";

type Tab = "paypay" | "credit";

const tabs: { key: Tab; label: string; description: string }[] = [
  { key: "paypay", label: "PayPay", description: "PayPayの利用明細CSV" },
  { key: "credit", label: "クレジットカード", description: "カード利用明細CSV" },
];

export default function ImportTabs({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<Tab>("paypay");

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {tabs.map(({ key, label, description }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              tab === key
                ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="block text-sm font-bold">{label}</span>
            <span className="mt-1 block text-xs text-gray-500">{description}</span>
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

"use client";

import { useState } from "react";
import BudgetTabsCard, { type BudgetTabData } from "./BudgetTabsCard";
import RecentTransactionsCard from "./RecentTransactionsCard";
import type { TransactionWithCategory } from "@/lib/data";

type Props = {
  weeklyData: BudgetTabData;
  monthlyData: BudgetTabData;
  transactions: TransactionWithCategory[];
};

export default function BudgetTransactionsSection({
  weeklyData,
  monthlyData,
  transactions,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <BudgetTabsCard
        weeklyData={weeklyData}
        monthlyData={monthlyData}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
      <RecentTransactionsCard
        transactions={transactions}
        filterCategory={selectedCategory}
        onClearFilter={() => setSelectedCategory(null)}
      />
    </div>
  );
}

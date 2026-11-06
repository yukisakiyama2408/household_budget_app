"use client";

import { useState, type ReactNode } from "react";
import BudgetTabsCard, { type BudgetTabData } from "./BudgetTabsCard";
import RecentTransactionsCard from "./RecentTransactionsCard";
import type { TransactionWithCategory } from "@/lib/data";

type Props = {
  weeklyData: BudgetTabData;
  monthlyData: BudgetTabData;
  transactions: TransactionWithCategory[];
  goalCard: ReactNode;
};

export default function BudgetTransactionsSection({
  weeklyData,
  monthlyData,
  transactions,
  goalCard,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="min-w-0 lg:col-span-2">
        <BudgetTabsCard
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </div>
      <div className="min-w-0 lg:col-span-2">
        <RecentTransactionsCard
          transactions={transactions}
          filterCategory={selectedCategory}
          onClearFilter={() => setSelectedCategory(null)}
        />
      </div>
      <div className="min-w-0 lg:col-start-3 lg:row-start-1 lg:row-span-2">
        {goalCard}
      </div>
    </div>
  );
}

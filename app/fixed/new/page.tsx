import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import FixedExpenseForm from "@/components/fixed/FixedExpenseForm";
import { createFixedExpense } from "@/lib/actions";
import { getCategories } from "@/lib/data";

export default async function NewFixedExpensePage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/fixed"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          固定費一覧に戻る
        </Link>
        <h1 className="text-xl font-bold mb-6">固定費の新規登録</h1>
        <div className="bg-white rounded-lg border p-6">
          <FixedExpenseForm
            categories={categories}
            action={createFixedExpense}
            submitLabel="登録する"
          />
        </div>
      </div>
    </div>
  );
}

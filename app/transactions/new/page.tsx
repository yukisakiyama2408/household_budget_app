import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TransactionForm from "@/components/transactions/TransactionForm";
import { createTransaction } from "@/lib/actions";
import { getCategories } from "@/lib/data";

export default async function NewTransactionPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          一覧に戻る
        </Link>
        <h1 className="text-xl font-bold mb-6">新規登録</h1>
        <div className="bg-white rounded-lg border p-6">
          <TransactionForm
            categories={categories}
            action={createTransaction}
            submitLabel="登録する"
          />
        </div>
      </div>
    </div>
  );
}

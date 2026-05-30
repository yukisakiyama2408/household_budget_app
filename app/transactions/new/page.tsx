import Link from "next/link";
import { ChevronLeft, Upload } from "lucide-react";
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
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">新規登録</h1>
            <p className="mt-1 text-sm text-gray-500">1件ずつ手入力で収支を登録します。</p>
          </div>
          <Link
            href="/import"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            CSV
          </Link>
        </div>
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

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import EditTransactionForm from "@/components/transactions/EditTransactionForm";
import { getTransactionById, getCategories } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: Props) {
  const { id } = await params;
  const [transaction, categories] = await Promise.all([
    getTransactionById(parseInt(id)).catch(() => null),
    getCategories(),
  ]);

  if (!transaction) notFound();

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
        <h1 className="text-xl font-bold mb-6">編集</h1>
        <div className="bg-white rounded-lg border p-6">
          <EditTransactionForm
            transaction={transaction}
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
}

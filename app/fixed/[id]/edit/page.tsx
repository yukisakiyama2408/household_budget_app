import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import EditFixedExpenseForm from "@/components/fixed/EditFixedExpenseForm";
import { getFixedExpenseById, getCategories } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditFixedExpensePage({ params }: Props) {
  const { id } = await params;
  const [fixedExpense, categories] = await Promise.all([
    getFixedExpenseById(parseInt(id)).catch(() => null),
    getCategories(),
  ]);

  if (!fixedExpense) notFound();

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
        <h1 className="text-xl font-bold mb-6">固定費の編集</h1>
        <div className="bg-white rounded-lg border p-6">
          <EditFixedExpenseForm
            fixedExpense={fixedExpense}
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
}

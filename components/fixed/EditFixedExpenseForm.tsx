"use client";

import { useRouter } from "next/navigation";
import FixedExpenseForm from "./FixedExpenseForm";
import { updateFixedExpense, deleteFixedExpense } from "@/lib/actions";
import type { Category, FixedExpense } from "@/types/database";

type Props = {
  fixedExpense: FixedExpense;
  categories: Category[];
};

export default function EditFixedExpenseForm({ fixedExpense, categories }: Props) {
  const router = useRouter();
  const updateWithId = updateFixedExpense.bind(null, fixedExpense.id);

  async function handleDelete() {
    if (!confirm("この固定費を削除しますか？")) return;
    await deleteFixedExpense(fixedExpense.id);
    router.push("/fixed");
  }

  return (
    <FixedExpenseForm
      categories={categories}
      defaultValues={fixedExpense}
      action={updateWithId}
      submitLabel="更新する"
      onDelete={handleDelete}
    />
  );
}

"use client";

import FixedExpenseForm from "./FixedExpenseForm";
import { updateFixedExpense, deleteFixedExpense } from "@/lib/actions";
import type { Category, FixedExpense } from "@/types/database";

type Props = {
  fixedExpense: FixedExpense;
  categories: Category[];
  returnTo: string;
};

export default function EditFixedExpenseForm({ fixedExpense, categories, returnTo }: Props) {
  const updateWithId = updateFixedExpense.bind(null, fixedExpense.id);

  async function handleDelete() {
    if (!confirm("この固定費を削除しますか？")) return;
    await deleteFixedExpense(fixedExpense.id, returnTo);
  }

  return (
    <FixedExpenseForm
      returnTo={returnTo}
      categories={categories}
      defaultValues={fixedExpense}
      action={updateWithId}
      submitLabel="更新する"
      onDelete={handleDelete}
    />
  );
}

"use client";

import TransactionForm from "./TransactionForm";
import { updateTransaction, deleteTransaction } from "@/lib/actions";
import type { Category, Transaction } from "@/types/database";

type Props = {
  transaction: Transaction;
  categories: Category[];
  returnTo: string;
};

export default function EditTransactionForm({ transaction, categories, returnTo }: Props) {
  const updateWithId = updateTransaction.bind(null, transaction.id);

  async function handleDelete() {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteTransaction(transaction.id, returnTo);
  }

  return (
    <TransactionForm
      returnTo={returnTo}
      categories={categories}
      defaultValues={transaction}
      action={updateWithId}
      submitLabel="更新する"
      onDelete={handleDelete}
    />
  );
}

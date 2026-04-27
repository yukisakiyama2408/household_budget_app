"use client";

import { useRouter } from "next/navigation";
import TransactionForm from "./TransactionForm";
import { updateTransaction, deleteTransaction } from "@/lib/actions";
import type { Category, Transaction } from "@/types/database";

type Props = {
  transaction: Transaction;
  categories: Category[];
};

export default function EditTransactionForm({ transaction, categories }: Props) {
  const router = useRouter();
  const updateWithId = updateTransaction.bind(null, transaction.id);

  async function handleDelete() {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteTransaction(transaction.id);
    router.push("/transactions");
  }

  return (
    <TransactionForm
      categories={categories}
      defaultValues={transaction}
      action={updateWithId}
      submitLabel="更新する"
      onDelete={handleDelete}
    />
  );
}

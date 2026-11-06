"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { parseTransactionFilters, transactionFilterParams, type TransactionFiltersValue } from "@/lib/transactions/filters";
import type { Category } from "@/types/database";

type Props = { categories: Category[]; filters: TransactionFiltersValue; monthOptions: string[] };
type MultipleField = "months" | "types" | "categoryIds" | "payMethods" | "needs";

export default function TransactionFilters({ categories, filters, monthOptions }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters);
  const [isPending, startTransition] = useTransition();
  const latestDraft = useRef(filters);
  const lastRequested = useRef(transactionFilterParams(filters).toString());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);

  function cancelSearch() {
    if (searchTimer.current !== null) clearTimeout(searchTimer.current);
    searchTimer.current = null;
  }

  function navigate(next: TransactionFiltersValue) {
    cancelSearch();
    const params = transactionFilterParams(parseTransactionFilters(transactionFilterParams(next)));
    lastRequested.current = params.toString();
    startTransition(() => router.replace(params.size ? `/transactions?${params}` : "/transactions", { scroll: false }));
  }

  function update(next: TransactionFiltersValue, delaySearch = false) {
    latestDraft.current = next;
    setDraft(next);
    cancelSearch();
    if (delaySearch) {
      if (!composing.current) searchTimer.current = setTimeout(() => navigate(latestDraft.current), 350);
    } else {
      navigate(next);
    }
  }

  useEffect(() => () => {
    if (searchTimer.current !== null) clearTimeout(searchTimer.current);
  }, []);

  useEffect(() => {
    const applied = transactionFilterParams(filters).toString();
    if (isPending || searchTimer.current !== null || composing.current || applied === lastRequested.current) return;
    // Restore browser-history/externally supplied URL filters without overwriting in-flight selections.
    latestDraft.current = filters;
    lastRequested.current = applied;
    setDraft(filters);
  }, [filters, isPending]);

  function toggle(field: MultipleField, value: string) {
    const current = latestDraft.current;
    update({ ...current, [field]: current[field].includes(value)
      ? current[field].filter((item) => item !== value) : [...current[field], value] });
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composing.current) navigate(latestDraft.current);
  }

  const groups: { field: MultipleField; label: string; options: { value: string; label: string }[] }[] = [
    { field: "months", label: "月", options: monthOptions.map((month) => ({ value: month, label: `${month.slice(0, 4)}年${Number(month.slice(5))}月` })) },
    { field: "types", label: "収支", options: [{ value: "income", label: "収入" }, { value: "expense", label: "支出" }] },
    { field: "payMethods", label: "支払方法", options: [{ value: "Cash", label: "現金" }, { value: "Credit", label: "クレジット" }] },
    { field: "needs", label: "確認する項目", options: [{ value: "category", label: "カテゴリなし" }, { value: "store", label: "店舗なし（支出）" }] },
    { field: "categoryIds", label: "カテゴリ", options: categories.map((category) => ({ value: String(category.id), label: category.name })) },
  ];

  return (
    <aside aria-busy={isPending} className="min-w-0 rounded-lg border bg-white p-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
      <form onSubmit={apply} className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">絞り込み</h2>
          <button type="button" onClick={() => update({ months: [], types: [], payMethods: [], categoryIds: [], needs: [], q: "" })} className="min-h-11 text-xs text-indigo-600">すべて解除</button>
        </div>
        <p className="text-xs leading-relaxed text-gray-500">選択すると自動で反映されます。各項目は複数選択でき、未選択の項目はすべて表示します。</p>
        <label className="block space-y-2 text-sm font-medium text-gray-600">
          <span>検索</span>
          <input type="search" value={draft.q} maxLength={200}
            onChange={(event) => update({ ...latestDraft.current, q: event.target.value }, true)}
            onCompositionStart={() => { composing.current = true; cancelSearch(); }}
            onCompositionEnd={(event) => { composing.current = false; update({ ...latestDraft.current, q: event.currentTarget.value }, true); }}
            placeholder="内容・店舗で検索" className="h-11 w-full min-w-0 rounded-md border px-3 text-base font-normal" />
        </label>
        {draft.dateFrom && draft.dateTo && (
          <div className="rounded-md bg-indigo-50 p-3 text-xs text-indigo-700">
            <p>{draft.dateFrom}〜{draft.dateTo}の範囲を適用中</p>
            <button type="button" onClick={() => update({ ...latestDraft.current, dateFrom: undefined, dateTo: undefined })} className="mt-2 underline">期間範囲を解除して月で選ぶ</button>
          </div>
        )}
        {groups.map(({ field, label, options }) => (
          <details key={field} className="rounded-md border">
            <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-gray-700">{label} <span className="text-xs font-normal text-gray-500">{draft[field].length ? `${draft[field].length}件選択` : "すべて"}</span></summary>
            <fieldset disabled={field === "months" && !!draft.dateFrom} className="min-w-0 border-t p-2 disabled:opacity-50">
              <legend className="sr-only">{label}を複数選択</legend>
              <button type="button" onClick={() => update({ ...latestDraft.current, [field]: [] })} className="min-h-11 px-2 text-xs text-indigo-600">選択を解除（すべて表示）</button>
              <div className="max-h-48 overflow-y-auto">
                {options.map((option) => (
                  <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded px-2 text-sm hover:bg-gray-50">
                    <input type="checkbox" checked={draft[field].includes(option.value)} onChange={() => toggle(field, option.value)} className="h-4 w-4 shrink-0 accent-indigo-600" />
                    <span className="min-w-0 break-words">{option.label}</span>
                  </label>
                ))}
                {options.length === 0 && <p className="p-2 text-xs text-gray-500">選択できる項目がありません。</p>}
              </div>
            </fieldset>
          </details>
        ))}
        <p role="status" className="text-xs text-gray-500">{isPending ? "絞り込みを更新中…" : "選択した条件を自動で適用します。"}</p>
      </form>
    </aside>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/database";

type Props = {
  categories: Category[];
  defaultMonth?: string;
  categoryTotals?: {
    id: number;
    name: string;
    color: string;
    amount: number;
  }[];
};

export default function TransactionFilters({ categories, defaultMonth = "", categoryTotals = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/transactions?${params.toString()}`);
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    update("q", String(formData.get("q") ?? "").trim());
  }

  const monthParam = searchParams.get("month");
  const currentMonth = monthParam === "all" ? "" : (monthParam ?? defaultMonth);
  const currentQ = searchParams.get("q") ?? "";
  const selectedType = searchParams.get("type") ?? "";
  const selectedPayMethod = searchParams.get("pay_method") ?? "";
  const selectedCategoryId = searchParams.get("category_id") ?? "";
  const maxCategoryTotal = Math.max(...categoryTotals.map((c) => c.amount), 1);

  return (
    <aside className="rounded-lg border bg-white p-3 sm:p-4 lg:sticky lg:top-20">
      <h2 className="mb-3 text-sm font-bold text-gray-900">絞り込み</h2>

      <form onSubmit={handleSearch} className="mb-3">
        <label className="mb-1.5 block text-[11px] font-bold text-gray-500">検索</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            key={currentQ}
            name="q"
            defaultValue={currentQ}
            placeholder="内容・店舗で検索"
            className="h-10 pl-9 text-sm"
          />
        </div>
      </form>

      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="block text-[11px] font-bold text-gray-500">月</label>
          {currentMonth && (
            <button
              type="button"
              onClick={() => update("month", "all")}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
            >
              解除
            </button>
          )}
        </div>
        <Input
          type="month"
          className="h-10 text-sm"
          value={currentMonth}
          onChange={(e) => {
            update("month", e.target.value || "all");
          }}
        />
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-bold text-gray-500">収支</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["", "すべて"],
            ["income", "収入"],
            ["expense", "支出"],
          ].map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => update("type", value)}
              className={`h-8 rounded-full border px-3 text-xs font-bold transition-colors ${
                selectedType === value
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-bold text-gray-500">支払方法</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["", "すべて"],
            ["Cash", "Cash"],
            ["Credit", "Credit"],
          ].map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => update("pay_method", value)}
              className={`h-8 rounded-full border px-3 text-xs font-bold transition-colors ${
                selectedPayMethod === value
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold text-gray-500">カテゴリ</label>
        <Select
          value={selectedCategoryId}
          onValueChange={(v) => update("category_id", v === "all" ? "" : (v ?? ""))}
        >
          <SelectTrigger className="h-10 text-sm">
            <SelectValue placeholder="すべてのカテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categoryTotals.length > 0 && (
          <div className="mt-3 space-y-2">
            {categoryTotals.slice(0, 5).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => update("category_id", String(category.id))}
                className="grid w-full grid-cols-[10px_1fr_auto] items-center gap-2 text-left text-xs text-gray-500"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-gray-600">{category.name}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(8, Math.round((category.amount / maxCategoryTotal) * 100))}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </span>
                </span>
                <span className="font-bold tabular-nums text-gray-600">
                  ¥{category.amount.toLocaleString("ja-JP")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

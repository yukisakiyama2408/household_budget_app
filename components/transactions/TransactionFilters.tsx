"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
};

export default function TransactionFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(searchParams.get("month") ?? "");

  useEffect(() => {
    setMonth(searchParams.get("month") ?? "");
  }, [searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
      <Input
        type="month"
        className="col-span-2 sm:w-40"
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          update("month", e.target.value);
        }}
      />
      <Select
        value={searchParams.get("type") ?? ""}
        onValueChange={(v) => update("type", v === "all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="sm:w-32">
          <SelectValue placeholder="収支" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="income">収入</SelectItem>
          <SelectItem value="expense">支出</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("category_id") ?? ""}
        onValueChange={(v) => update("category_id", v === "all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="カテゴリ" />
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
      <Select
        value={searchParams.get("pay_method") ?? ""}
        onValueChange={(v) => update("pay_method", v === "all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="sm:w-32">
          <SelectValue placeholder="支払方法" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="Cash">Cash</SelectItem>
          <SelectItem value="Credit">Credit</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

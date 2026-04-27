"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, FixedExpense } from "@/types/database";

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type Props = {
  categories: Category[];
  defaultValues?: Partial<FixedExpense>;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  onDelete?: () => void;
};

export default function FixedExpenseForm({
  categories,
  defaultValues,
  action,
  submitLabel,
  onDelete,
}: Props) {
  const now = new Date();
  const [type, setType] = useState<string>(defaultValues?.type ?? "expense");
  const [hasEndMonth, setHasEndMonth] = useState<boolean>(
    defaultValues?.end_year != null
  );

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both"
  );

  return (
    <form action={action} className="space-y-5">
      {/* 収支区分 */}
      <div className="space-y-1.5">
        <Label>収支区分</Label>
        <div className="flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                type === t
                  ? t === "expense"
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t === "expense" ? "支出" : "収入"}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* 名前 */}
      <div className="space-y-1.5">
        <Label htmlFor="name">名前</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="例: 家賃"
          defaultValue={defaultValues?.name ?? ""}
        />
      </div>

      {/* 毎月の支払日 */}
      <div className="space-y-1.5">
        <Label htmlFor="day_of_month">毎月の支払日</Label>
        <div className="flex items-center gap-2">
          <Input
            id="day_of_month"
            name="day_of_month"
            type="number"
            required
            min={1}
            max={31}
            placeholder="例: 27"
            defaultValue={defaultValues?.day_of_month ?? ""}
            className="w-28"
          />
          <span className="text-sm text-gray-500">日</span>
        </div>
        <p className="text-xs text-gray-400">月末より大きい日付の場合は月末日に適用されます</p>
      </div>

      {/* 適用開始月 */}
      <div className="space-y-1.5">
        <Label>適用開始月</Label>
        <div className="flex items-center gap-2">
          <Select
            name="start_year"
            defaultValue={String(defaultValues?.start_year ?? now.getFullYear())}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            name="start_month"
            defaultValue={String(defaultValues?.start_month ?? now.getMonth() + 1)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)}>{m}月</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 適用終了月 */}
      <div className="space-y-1.5">
        <Label>適用終了月</Label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setHasEndMonth(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !hasEndMonth
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            未定
          </button>
          <button
            type="button"
            onClick={() => setHasEndMonth(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              hasEndMonth
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            月を指定
          </button>
        </div>
        {hasEndMonth ? (
          <div className="flex items-center gap-2">
            <Select
              name="end_year"
              defaultValue={String(defaultValues?.end_year ?? now.getFullYear())}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              name="end_month"
              defaultValue={String(defaultValues?.end_month ?? now.getMonth() + 1)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>{m}月</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-xs text-gray-400">終了月が決まっていない場合は「未定」を選択してください</p>
        )}
      </div>

      {/* カテゴリ */}
      <div className="space-y-1.5">
        <Label>カテゴリ</Label>
        <Select
          name="category_id"
          defaultValue={defaultValues?.category_id ? String(defaultValues.category_id) : ""}
        >
          <SelectTrigger>
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">なし</SelectItem>
            {filteredCategories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 金額 */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">金額（円）</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          required
          min={1}
          placeholder="例: 80000"
          defaultValue={defaultValues?.amount ?? ""}
        />
      </div>

      {/* 支払い方法・店舗（支出のみ） */}
      {type === "expense" && (
        <>
          <div className="space-y-1.5">
            <Label>支払い方法</Label>
            <Select
              name="pay_method"
              defaultValue={defaultValues?.pay_method ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">なし</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="store">店舗（任意）</Label>
            <Input
              id="store"
              name="store"
              type="text"
              placeholder="例: 〇〇不動産"
              defaultValue={defaultValues?.store ?? ""}
            />
          </div>
        </>
      )}

      {/* 状態（編集時のみ） */}
      {defaultValues?.id !== undefined && (
        <div className="space-y-1.5">
          <Label>状態</Label>
          <Select
            name="is_active"
            defaultValue={String(defaultValues.is_active ?? true)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">有効</SelectItem>
              <SelectItem value="false">無効</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            削除
          </Button>
        )}
      </div>
    </form>
  );
}

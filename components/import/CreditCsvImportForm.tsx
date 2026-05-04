"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { importTransactions, fetchTransactionsForDuplicateCheck } from "@/lib/actions";
import type { Category } from "@/types/database";

type ParsedRow = {
  date: string;
  content: string;
  amount: number;
  type: "income" | "expense";
  category_id: number | null;
  pay_method: "Cash" | "Credit" | null;
  store: string | null;
};

function parseCreditDate(raw: string): string {
  const m = raw.match(/(\d{4})年(\d{2})月(\d{2})日/);
  if (!m) return raw.trim().slice(0, 10).replace(/\//g, "-");
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseAmount(raw: string): number {
  const n = parseInt(raw.replace(/[¥,\s]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

export default function CreditCsvImportForm({ categories }: { categories: Category[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [existingTx, setExistingTx] = useState<{ date: string; amount: number; store: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ imported: number } | null>(null);

  function getDuplicateLevel(row: ParsedRow): "high" | "low" | null {
    const matches = existingTx.filter(
      (t) => t.date === row.date && t.amount === row.amount
    );
    if (matches.length === 0) return null;
    const storeMatch = matches.some(
      (t) => t.store && row.store && t.store === row.store
    );
    return storeMatch ? "high" : "low";
  }

  const indexedRows = rows.map((row, originalIndex) => ({ row, originalIndex }));
  const filteredIndexedRows = indexedRows.filter(({ row }) => {
    if (filterStart && row.date < filterStart) return false;
    if (filterEnd && row.date > filterEnd) return false;
    return true;
  });

  function handleFile(file: File) {
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data, meta }) => {
          if (!meta.fields || meta.fields.length === 0) {
            setError("CSVのヘッダーが読み取れませんでした。");
            return;
          }

          const headers = meta.fields;
          const typeCol = headers.find((h) => h.includes("種別"));
          const dateCol = headers.find((h) => h.includes("利用年月日") || h.includes("利用日"));
          const storeCol = headers.find((h) => h.includes("利用場所") || h.includes("利用先"));
          const contentCol = headers.find((h) => h.includes("利用内容"));
          const amountCol = headers.find((h) => h.includes("利用金額"));

          if (!dateCol || !amountCol) {
            setError(`日付・金額の列が見つかりませんでした。\n検出された列: ${headers.join(", ")}`);
            return;
          }

          const SKIP_TYPES = ["キャッシング"];

          const parsed: ParsedRow[] = [];
          for (const row of data) {
            const dateRaw = row[dateCol]?.trim();
            if (!dateRaw) continue;

            const txType = typeCol ? row[typeCol]?.trim() : "";
            if (txType && SKIP_TYPES.some((s) => txType.includes(s))) continue;

            const amountRaw = row[amountCol]?.trim() || "";
            const amount = parseAmount(amountRaw);
            if (amount === 0) continue;

            const isRefund = amount < 0;
            const absAmount = Math.abs(amount);
            const type: "income" | "expense" = isRefund ? "income" : "expense";

            const storeName = (storeCol ? row[storeCol]?.trim() : null) || null;
            const contentRaw = contentCol ? row[contentCol]?.trim() : null;
            const isDash = contentRaw === "−" || contentRaw === "-";
            const content = (!isDash && contentRaw) ? contentRaw : (storeName || "クレジット支払い");

            parsed.push({
              date: parseCreditDate(dateRaw),
              content,
              amount: absAmount,
              type,
              category_id: null,
              pay_method: "Credit",
              store: storeName,
            });
          }

          parsed.sort((a, b) => a.date.localeCompare(b.date));

          if (parsed.length === 0) {
            setError("インポートできる行がありませんでした。");
            return;
          }

          setRows(parsed);

          const minDate = parsed[0].date;
          const maxDate = parsed[parsed.length - 1].date;
          fetchTransactionsForDuplicateCheck(minDate, maxDate)
            .then(setExistingTx)
            .catch(() => {});
        },
      });
    };
    reader.readAsText(file, "Shift_JIS");
  }

  function updateRow(index: number, field: keyof ParsedRow, value: string | number | null) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImport() {
    const importTargets = filteredIndexedRows;
    startTransition(async () => {
      try {
        const res = await importTransactions(importTargets.map(({ row }) => row));
        setResult(res);
        const importedIndices = new Set(importTargets.map(({ originalIndex }) => originalIndex));
        setRows((prev) => prev.filter((_, i) => !importedIndices.has(i)));
        if (inputRef.current && rows.length === importTargets.length) {
          inputRef.current.value = "";
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "インポートに失敗しました");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          id="credit-csv-upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <label htmlFor="credit-csv-upload" className="cursor-pointer">
          <p className="text-sm text-gray-500 mb-2">クレジットカードの利用明細CSVをアップロード</p>
          <span className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors">
            ファイルを選択
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 whitespace-pre-wrap">
          {error}
        </p>
      )}

      {result && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          {result.imported}件をインポートしました。
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600 font-medium">日付で絞り込み</span>
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-sm text-gray-400">〜</span>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            {(filterStart || filterEnd) && (
              <button
                onClick={() => { setFilterStart(""); setFilterEnd(""); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                クリア
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredIndexedRows.length}件表示（全{rows.length}件）
            </p>
            <button
              onClick={handleImport}
              disabled={isPending || filteredIndexedRows.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isPending ? "インポート中..." : `${filteredIndexedRows.length}件をインポート`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">収支区分</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">日付</th>
                  <th className="py-2 pr-3 font-medium">内容</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">カテゴリ</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap text-right">金額（円）</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">支払い方法</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">店舗</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredIndexedRows.map(({ row, originalIndex }) => {
                  const dupLevel = getDuplicateLevel(row);
                  return (
                    <tr key={originalIndex} className={`border-b ${dupLevel === "high" ? "bg-orange-50" : dupLevel === "low" ? "bg-yellow-50" : "hover:bg-gray-50"}`}>
                      <td className="py-2 pr-3">
                        <select
                          value={row.type}
                          onChange={(e) => updateRow(originalIndex, "type", e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                        >
                          <option value="expense">支出</option>
                          <option value="income">収入</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{row.date}</td>
                      <td className="py-2 pr-3">
                        <input
                          className="w-full min-w-32 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          value={row.content}
                          onChange={(e) => updateRow(originalIndex, "content", e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={row.category_id ?? ""}
                          onChange={(e) =>
                            updateRow(originalIndex, "category_id", e.target.value ? parseInt(e.target.value) : null)
                          }
                          className="border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                        >
                          <option value="">未設定</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3 text-right font-medium tabular-nums whitespace-nowrap">
                        ¥{row.amount.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">Credit</td>
                      <td className="py-2 pr-3">
                        <input
                          className="w-full min-w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          value={row.store ?? ""}
                          onChange={(e) => updateRow(originalIndex, "store", e.target.value || null)}
                        />
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {dupLevel && (
                          <span className={`mr-2 text-xs px-1.5 py-0.5 rounded font-medium ${dupLevel === "high" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {dupLevel === "high" ? "重複の可能性大" : "重複の可能性"}
                          </span>
                        )}
                        <button
                          onClick={() => removeRow(originalIndex)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

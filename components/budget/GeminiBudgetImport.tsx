"use client";

import { useState, useTransition } from "react";
import {
  upsertBudget,
  upsertWeeklyBudget,
  upsertMonthlyTotalBudget,
  upsertWeeklyTotalBudget,
} from "@/lib/actions";

type CategoryEntry = { id: number; name: string };

type MonthlyProps = {
  type: "monthly";
  year: number;
  month: number;
  categories: CategoryEntry[];
};

type WeeklyProps = {
  type: "weekly";
  weekStart: string;
  categories: CategoryEntry[];
};

type Props = MonthlyProps | WeeklyProps;

function parseGeminiOutput(text: string): Map<string, number> {
  const result = new Map<string, number>();
  for (const line of text.split("\n")) {
    const match = line.match(/[-\s]*(.+?)：¥([\d,]+)/);
    if (!match) continue;
    const name = match[1].trim();
    const amount = parseInt(match[2].replace(/,/g, ""), 10);
    if (!isNaN(amount)) result.set(name, amount);
  }
  return result;
}

export default function GeminiBudgetImport(props: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const parsed = text ? parseGeminiOutput(text) : new Map<string, number>();

  const categoryEntries = props.categories
    .map((c) => ({ ...c, amount: parsed.get(c.name) }))
    .filter((c): c is CategoryEntry & { amount: number } => c.amount !== undefined);

  const totalKey =
    props.type === "monthly" ? "月次合計予算（上限）" : "週次合計予算（上限）";
  const totalAmount = parsed.get(totalKey);

  const hasData = categoryEntries.length > 0 || totalAmount !== undefined;

  function handleClose() {
    setOpen(false);
    setText("");
    setDone(false);
  }

  function handleRegister() {
    startTransition(async () => {
      const tasks: Promise<unknown>[] = [];

      for (const c of categoryEntries) {
        if (props.type === "monthly") {
          tasks.push(upsertBudget(props.year, props.month, c.id, c.amount));
        } else {
          tasks.push(upsertWeeklyBudget(props.weekStart, c.id, c.amount));
        }
      }

      if (totalAmount !== undefined) {
        if (props.type === "monthly") {
          tasks.push(upsertMonthlyTotalBudget(props.year, props.month, totalAmount));
        } else {
          tasks.push(upsertWeeklyTotalBudget(props.weekStart, totalAmount));
        }
      }

      await Promise.all(tasks);
      setDone(true);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-purple-600 hover:underline"
      >
        Gemini出力から一括登録
      </button>
    );
  }

  return (
    <div className="border border-purple-200 rounded-md p-4 space-y-3 bg-purple-50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-purple-800">Gemini出力を貼り付けて一括登録</p>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {done ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-green-700 font-medium">登録が完了しました</p>
          <button onClick={handleClose} className="text-xs text-gray-500 hover:underline">
            閉じる
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`【来${props.type === "monthly" ? "月" : "週"}の推奨予算】\n- 食費：¥XX,XXX\n- 外食費：¥XX,XXX\n...\n- ${totalKey}：¥XXX,XXX`}
            rows={6}
            className="w-full border rounded px-3 py-2 text-sm font-mono resize-none bg-white"
          />

          {hasData && (
            <div className="bg-white border rounded p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium mb-2">認識した予算：</p>
              {categoryEntries.map((c) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{c.name}</span>
                  <span className="tabular-nums font-medium">
                    ¥{c.amount.toLocaleString("ja-JP")}
                  </span>
                </div>
              ))}
              {totalAmount !== undefined && (
                <div className="flex justify-between text-sm border-t pt-1 mt-1">
                  <span className="text-gray-500">合計予算</span>
                  <span className="tabular-nums font-medium">
                    ¥{totalAmount.toLocaleString("ja-JP")}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isPending || !hasData}
            className="w-full py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "登録中…" : "一括登録する"}
          </button>
        </>
      )}
    </div>
  );
}

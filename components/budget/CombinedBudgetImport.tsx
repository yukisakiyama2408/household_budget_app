"use client";

import { useState, useTransition } from "react";
import {
  upsertBudget,
  upsertMonthlyTotalBudget,
  upsertWeeklyBudget,
  upsertWeeklyTotalBudget,
} from "@/lib/actions";
import { getWeeksOfMonth } from "@/lib/dateUtils";

type CategoryEntry = { id: number; name: string };

type Props = {
  year: number;
  month: number;
  monthLabel: string;
  categories: CategoryEntry[];
};

type Section = {
  categories: Map<string, number>;
  total: number | undefined;
};

function parseOutput(text: string, weeksCount: number): { monthly: Section; weeks: Section[] } {
  const monthly: Section = { categories: new Map(), total: undefined };
  const weeks: Section[] = Array.from({ length: weeksCount }, () => ({
    categories: new Map(),
    total: undefined,
  }));

  type CurrentSection = "none" | "monthly" | number;
  let current: CurrentSection = "none";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();

    // 月次セクション検出：「月次」と「予算」を含む行
    if (trimmed.includes("月次") && trimmed.includes("予算") && !trimmed.match(/第\d+週/)) {
      current = "monthly";
      continue;
    }

    // 週次セクション検出：「第N週」
    const weekMatch = trimmed.match(/第(\d+)週/);
    if (weekMatch) {
      const idx = parseInt(weekMatch[1]) - 1;
      if (idx >= 0 && idx < weeksCount) current = idx;
      continue;
    }

    if (current === "none") continue;

    // 「- カテゴリ：¥金額」行をパース
    const match = trimmed.match(/^[-*]*\s*\**([^*\n：:]+?)\**\s*[：:]\s*¥?\s*([\d,]+)/);
    if (!match) continue;
    const name = match[1].trim();
    const amount = parseInt(match[2].replace(/,/g, ""), 10);
    if (isNaN(amount) || amount < 0) continue;

    const target = current === "monthly" ? monthly : weeks[current as number];
    if (name.includes("合計予算")) {
      target.total = amount;
    } else {
      target.categories.set(name, amount);
    }
  }

  return { monthly, weeks };
}

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function CombinedBudgetImport({ year, month, monthLabel, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const allWeeks = getWeeksOfMonth(year, month);
  const parsed = text ? parseOutput(text, allWeeks.length) : null;

  const monthlyCategoryEntries = parsed
    ? categories
        .map((c) => ({ ...c, amount: parsed.monthly.categories.get(c.name) }))
        .filter((c): c is CategoryEntry & { amount: number } => c.amount !== undefined)
    : [];

  const weeklyEntries = parsed
    ? allWeeks.map((week, i) => ({
        week,
        categoryEntries: categories
          .map((c) => ({ ...c, amount: parsed.weeks[i]?.categories.get(c.name) }))
          .filter((c): c is CategoryEntry & { amount: number } => c.amount !== undefined),
        total: parsed.weeks[i]?.total,
      }))
    : [];

  const hasMonthlyData = monthlyCategoryEntries.length > 0 || (parsed?.monthly.total !== undefined);
  const hasWeeklyData = weeklyEntries.some((w) => w.categoryEntries.length > 0 || w.total !== undefined);
  const hasData = hasMonthlyData || hasWeeklyData;

  function handleClose() {
    setOpen(false);
    setText("");
    setDone(false);
  }

  function handleRegister() {
    startTransition(async () => {
      const tasks: Promise<unknown>[] = [];

      for (const c of monthlyCategoryEntries) {
        tasks.push(upsertBudget(year, month, c.id, c.amount));
      }
      if (parsed?.monthly.total !== undefined) {
        tasks.push(upsertMonthlyTotalBudget(year, month, parsed.monthly.total));
      }

      for (const { week, categoryEntries, total } of weeklyEntries) {
        for (const c of categoryEntries) {
          tasks.push(upsertWeeklyBudget(week.start, c.id, c.amount));
        }
        if (total !== undefined) {
          tasks.push(upsertWeeklyTotalBudget(week.start, total));
        }
      }

      await Promise.all(tasks);
      setDone(true);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-purple-600 hover:underline">
        ChatGPT出力から一括登録
      </button>
    );
  }

  return (
    <div className="border border-purple-200 rounded-md p-4 space-y-3 bg-purple-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-800">ChatGPT出力を貼り付けて一括登録</p>
          <p className="text-xs text-purple-500 mt-0.5">
            {monthLabel}の月次予算＋全{allWeeks.length}週の週次予算を登録します
          </p>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
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
            placeholder={`【来月の推奨予算（月次）】\n- 食費：¥XX,XXX\n...\n- 月次合計予算（上限）：¥XXX,XXX\n\n第1週（MM/DD〜MM/DD）\n- 食費：¥XX,XXX\n...`}
            rows={8}
            className="w-full border rounded px-3 py-2 text-sm font-mono resize-none bg-white"
          />

          {hasData && (
            <div className="bg-white border rounded p-3 space-y-3 text-sm">
              {hasMonthlyData && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">月次予算</p>
                  {monthlyCategoryEntries.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-gray-600">{c.name}</span>
                      <span className="tabular-nums font-medium">{fmt(c.amount)}</span>
                    </div>
                  ))}
                  {parsed?.monthly.total !== undefined && (
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-gray-500">合計予算</span>
                      <span className="tabular-nums font-medium">{fmt(parsed.monthly.total)}</span>
                    </div>
                  )}
                </div>
              )}
              {hasWeeklyData && weeklyEntries.map(({ week, categoryEntries, total }, i) => {
                if (categoryEntries.length === 0 && total === undefined) return null;
                return (
                  <div key={week.start} className="space-y-1 border-t pt-2">
                    <p className="text-xs font-medium text-gray-500">第{i + 1}週（{week.label}）</p>
                    {categoryEntries.map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span className="text-gray-600">{c.name}</span>
                        <span className="tabular-nums font-medium">{fmt(c.amount)}</span>
                      </div>
                    ))}
                    {total !== undefined && (
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-500">合計予算</span>
                        <span className="tabular-nums font-medium">{fmt(total)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
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

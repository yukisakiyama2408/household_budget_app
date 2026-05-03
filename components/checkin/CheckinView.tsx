"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordCheckin } from "@/app/actions/checkin";
import type { WeekSummaryData } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function diffPct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function DiffBadge({ pct, higherIsWorse }: { pct: number | null; higherIsWorse?: boolean }) {
  if (pct === null) return null;
  const isUp = pct > 0;
  const isBad = higherIsWorse ? isUp : !isUp;
  const color = isBad ? "text-red-500" : "text-green-600";
  return (
    <span className={`text-xs ${color}`}>
      {isUp ? "▲" : "▼"}{Math.abs(pct)}% vs先週
    </span>
  );
}

function SummaryRow({
  label,
  current,
  prev,
  higherIsWorse,
}: {
  label: string;
  current: number;
  prev: number;
  higherIsWorse?: boolean;
}) {
  const pct = diffPct(current, prev);
  const isBalance = !higherIsWorse && label === "収支";
  const color = isBalance
    ? current >= 0 ? "text-green-700" : "text-red-600"
    : higherIsWorse ? "text-red-600" : "text-green-700";

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-3">
        <DiffBadge pct={pct} higherIsWorse={higherIsWorse} />
        <span className={`font-medium tabular-nums ${color}`}>{fmt(current)}</span>
      </div>
    </div>
  );
}

export default function CheckinView({
  currentWeek,
  prevWeek,
  alreadyCheckedIn,
  weekStart,
}: {
  currentWeek: WeekSummaryData;
  prevWeek: WeekSummaryData;
  alreadyCheckedIn: boolean;
  weekStart: string;
}) {
  const [done, setDone] = useState(alreadyCheckedIn);
  const [loading, setLoading] = useState(false);

  async function handleCheckin() {
    setLoading(true);
    await recordCheckin(weekStart);
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {done ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm font-medium text-green-800">
          ✓ 今週（{currentWeek.label}）のチェックイン完了
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-900">今週（{currentWeek.label}）のチェックインをしましょう</p>
          <button
            onClick={handleCheckin}
            disabled={loading}
            className="flex-shrink-0 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "チェックイン完了"}
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">今週の収支</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryRow label="支出" current={currentWeek.expense} prev={prevWeek.expense} higherIsWorse />
          <SummaryRow label="収入" current={currentWeek.income} prev={prevWeek.income} />
          <div className="border-t pt-3">
            <SummaryRow
              label="収支"
              current={currentWeek.income - currentWeek.expense}
              prev={prevWeek.income - prevWeek.expense}
            />
          </div>
        </CardContent>
      </Card>

      {currentWeek.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カテゴリ別支出</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 font-medium text-left">カテゴリ</th>
                  <th className="pb-2 font-medium text-right">今週</th>
                  <th className="pb-2 font-medium text-right">先週</th>
                  <th className="pb-2 font-medium text-right">差分</th>
                </tr>
              </thead>
              <tbody>
                {currentWeek.categories.map((c) => {
                  const prevCat = prevWeek.categories.find((p) => p.name === c.name);
                  const prevAmt = prevCat?.amount ?? 0;
                  const delta = c.amount - prevAmt;
                  return (
                    <tr key={String(c.id ?? "none")} className="border-b last:border-0">
                      <td className="py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-red-500">
                        {fmt(c.amount)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-gray-400">
                        {prevAmt > 0 ? fmt(prevAmt) : "-"}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums text-xs ${
                          delta > 0 ? "text-red-500" : delta < 0 ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {delta !== 0
                          ? `${delta > 0 ? "+" : "-"}${fmt(Math.abs(delta))}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="pt-2.5 text-gray-700">合計</td>
                  <td className="pt-2.5 text-right tabular-nums text-red-500">
                    {fmt(currentWeek.expense)}
                  </td>
                  <td className="pt-2.5 text-right tabular-nums text-gray-400">
                    {prevWeek.expense > 0 ? fmt(prevWeek.expense) : "-"}
                  </td>
                  <td
                    className={`pt-2.5 text-right tabular-nums text-xs ${
                      currentWeek.expense - prevWeek.expense > 0
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {prevWeek.expense > 0
                      ? `${currentWeek.expense - prevWeek.expense > 0 ? "+" : "-"}${fmt(
                          Math.abs(currentWeek.expense - prevWeek.expense)
                        )}`
                      : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

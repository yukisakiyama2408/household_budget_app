import { NextRequest, NextResponse } from "next/server";
import { getTransactions, getGoalsWithProgress } from "@/lib/data";

function getWeekBounds(baseDate: Date): { dateFrom: string; dateTo: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = baseDate.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(baseDate);
  mon.setDate(baseDate.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { dateFrom: fmt(mon), dateTo: fmt(sun) };
}

function getPeriodRange(period: string): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (period === "week") {
    const { dateFrom, dateTo } = getWeekBounds(now);
    return { dateFrom, dateTo, label: `week-${dateFrom}` };
  }
  if (period === "prev_week") {
    const prev = new Date(now);
    prev.setDate(now.getDate() - 7);
    const { dateFrom, dateTo } = getWeekBounds(prev);
    return { dateFrom, dateTo, label: `week-${dateFrom}` };
  }
  if (period === "prev") {
    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;
    const lastDay = new Date(py, pm, 0).getDate();
    return {
      dateFrom: `${py}-${pad(pm)}-01`,
      dateTo: `${py}-${pad(pm)}-${pad(lastDay)}`,
      label: `${py}-${pad(pm)}`,
    };
  }
  if (period === "3months") {
    const startM = m - 2 <= 0 ? m + 10 : m - 2;
    const startY = m - 2 <= 0 ? y - 1 : y;
    const lastDay = new Date(y, m, 0).getDate();
    return {
      dateFrom: `${startY}-${pad(startM)}-01`,
      dateTo: `${y}-${pad(m)}-${pad(lastDay)}`,
      label: `${startY}-${pad(startM)}_${y}-${pad(m)}`,
    };
  }
  if (period === "year") {
    return {
      dateFrom: `${y}-01-01`,
      dateTo: `${y}-12-31`,
      label: `${y}`,
    };
  }
  if (period === "all") {
    return { dateFrom: "", dateTo: "", label: "all" };
  }
  // default: current month
  const lastDay = new Date(y, m, 0).getDate();
  return {
    dateFrom: `${y}-${pad(m)}-01`,
    dateTo: `${y}-${pad(m)}-${pad(lastDay)}`,
    label: `${y}-${pad(m)}`,
  };
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(req: NextRequest) {
  const period = new URL(req.url).searchParams.get("period") ?? "current";
  const { dateFrom, dateTo, label } = getPeriodRange(period);

  const [transactions, goals] = await Promise.all([
    getTransactions({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    getGoalsWithProgress(),
  ]);

  const BOM = "﻿";
  const txHeader = "日付,内容,カテゴリ,金額,種別,支払方法,店舗";
  const txRows = transactions.map((t) =>
    [
      t.date,
      escapeCsv(t.content),
      escapeCsv(t.categories?.name ?? ""),
      t.amount,
      t.type === "income" ? "収入" : "支出",
      t.pay_method ?? "",
      escapeCsv(t.store ?? ""),
    ].join(",")
  );

  const savingsGoals = goals.filter((g) => g.type === "savings");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goalSection =
    savingsGoals.length > 0
      ? [
          "",
          "# 貯金目標の進捗",
          "目標名,目標額,現在残高,達成率(%),期限,残り日数",
          ...savingsGoals.map((g) => {
            const pct = g.target_amount > 0 ? Math.round((g.currentAmount / g.target_amount) * 100) : 0;
            const daysLeft = g.deadline
              ? Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : "";
            return [
              escapeCsv(g.title),
              g.target_amount,
              g.currentAmount,
              pct,
              g.deadline ?? "",
              daysLeft,
            ].join(",");
          }),
        ]
      : [];

  const csv = BOM + [txHeader, ...txRows, ...goalSection].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kakeibo-${label}.csv"`,
    },
  });
}

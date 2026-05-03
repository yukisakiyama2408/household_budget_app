import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/data";

function getPeriodRange(period: string): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");

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

  const transactions = await getTransactions({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });

  const BOM = "﻿";
  const header = "日付,内容,カテゴリ,金額,種別,支払方法,店舗";
  const rows = transactions.map((t) =>
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

  const csv = BOM + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kakeibo-${label}.csv"`,
    },
  });
}

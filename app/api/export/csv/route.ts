import { NextRequest, NextResponse } from "next/server";
import {
  getTransactions,
  getCurrentBalance,
  getWishlistItems,
  getBudgetData,
  getWeeklyBudgetData,
  getYearlyTrend,
  TransactionWithCategory,
} from "@/lib/data";
import { getWeeksOfMonth } from "@/lib/dateUtils";

// ── ユーティリティ ───────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getWeekBounds(baseDate: Date): { dateFrom: string; dateTo: string } {
  const day = baseDate.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(baseDate);
  mon.setDate(baseDate.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { dateFrom: fmtDate(mon), dateTo: fmtDate(sun) };
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const TX_HEADER = "日付,内容,カテゴリ,金額,種別,支払方法,店舗";

function buildTxRows(transactions: TransactionWithCategory[]): string[] {
  return transactions.map((t) =>
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
}

function buildWishlistSection(
  items: Awaited<ReturnType<typeof getWishlistItems>>,
  balance: number
): string[] {
  if (items.length === 0) return [];
  return [
    "",
    "# 欲しいものリスト",
    "タイトル,金額,現在残高,購入可能度(%),優先度,メモ",
    ...items.map((item) => [
      escapeCsv(item.title), item.price, balance,
      item.price > 0 ? Math.round((balance / item.price) * 100) : 0,
      item.priority, escapeCsv(item.memo),
    ].join(",")),
  ];
}

function toCsvResponse(lines: string[], label: string): NextResponse {
  const BOM = "﻿";
  const csv = BOM + lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kakeibo-${label}.csv"`,
    },
  });
}

// 既存のCsvExportコンポーネント向け期間計算
function getPeriodRange(period: string): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

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
    return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31`, label: `${y}` };
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

// ── メインハンドラ ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const period = searchParams.get("period") ?? "current";
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  if (period === "custom") {
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const requestedView = searchParams.get("analysisView");
    const analysisView = ["monthly", "weekly", "yearly"].includes(requestedView ?? "")
      ? requestedView
      : "monthly";
    const validDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!validDate.test(dateFrom) || !validDate.test(dateTo) || dateFrom > dateTo) {
      return NextResponse.json({ error: "分析対象期間が不正です。" }, { status: 400 });
    }

    const [transactions, wishlistItems, balance] = await Promise.all([
      getTransactions({ dateFrom, dateTo }),
      getWishlistItems(),
      getCurrentBalance(),
    ]);
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = transactions.filter((transaction) => transaction.type === "expense");
    const totalExpense = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    const lines = [
      `# 対象期間: ${dateFrom}〜${dateTo}`,
      "",
      "## 収支サマリー",
      "収入,支出,収支",
      [income, totalExpense, income - totalExpense].join(","),
      "",
      "## 取引明細",
      TX_HEADER,
      ...buildTxRows(transactions),
      "",
      "## カテゴリ別集計",
      "カテゴリ,支出合計,割合(%)",
    ];
    const categoryTotals = new Map<string, number>();
    for (const transaction of expenses) {
      const category = transaction.categories?.name ?? "未分類";
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + transaction.amount);
    }
    for (const [category, amount] of [...categoryTotals].sort((a, b) => b[1] - a[1])) {
      lines.push([escapeCsv(category), amount, totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0].join(","));
    }

    if (analysisView === "weekly" || analysisView === "monthly") {
      const dailyTotals = new Map<string, { income: number; expense: number }>();
      for (const transaction of transactions) {
        const current = dailyTotals.get(transaction.date) ?? { income: 0, expense: 0 };
        current[transaction.type] += transaction.amount;
        dailyTotals.set(transaction.date, current);
      }
      lines.push("", "## 日別収支推移", "日付,収入,支出,収支");
      for (const [date, totals] of [...dailyTotals].sort(([a], [b]) => a.localeCompare(b))) {
        lines.push([date, totals.income, totals.expense, totals.income - totals.expense].join(","));
      }
    }

    if (analysisView === "monthly") {
      const [year, month] = dateFrom.split("-").map(Number);
      const budgetItems = await getBudgetData(year, month);
      lines.push("", "## 月次予算と実績", "カテゴリ,予算,実績,残予算,消化率(%)");
      for (const item of budgetItems) {
        if (item.budgetAmount === 0 && item.actualAmount === 0) continue;
        lines.push([
          escapeCsv(item.category.name), item.budgetAmount, item.actualAmount,
          item.budgetAmount - item.actualAmount,
          item.budgetAmount > 0 ? Math.round((item.actualAmount / item.budgetAmount) * 100) : "",
        ].join(","));
      }
    }

    if (analysisView === "yearly") {
      const monthlyTotals = new Map<string, { income: number; expense: number }>();
      for (const transaction of transactions) {
        const month = transaction.date.slice(0, 7);
        const current = monthlyTotals.get(month) ?? { income: 0, expense: 0 };
        current[transaction.type] += transaction.amount;
        monthlyTotals.set(month, current);
      }
      lines.push("", "## 月別収支推移", "月,収入,支出,収支");
      for (const [month, totals] of [...monthlyTotals].sort(([a], [b]) => a.localeCompare(b))) {
        lines.push([month, totals.income, totals.expense, totals.income - totals.expense].join(","));
      }
    }

    lines.push(...buildWishlistSection(wishlistItems, balance));
    return toCsvResponse(lines, `${dateFrom}_${dateTo}`);
  }

  // ── 週次統合（ChatGPT用: 先週＋今週） ──────────────────
  if (period === "weekly") {
    const requestedTargetStart = searchParams.get("targetStart");
    const requestedTargetEnd = searchParams.get("targetEnd");
    const validDate = /^\d{4}-\d{2}-\d{2}$/;
    const targetStart =
      requestedTargetStart && validDate.test(requestedTargetStart)
        ? requestedTargetStart
        : getWeekBounds(now).dateFrom;
    const targetEnd =
      requestedTargetEnd && validDate.test(requestedTargetEnd)
        ? requestedTargetEnd
        : getWeekBounds(now).dateTo;
    const [targetYear, targetMonth] = targetStart.split("-").map(Number);
    const thisWeek = getWeekBounds(now);
    const prevBase = new Date(now);
    prevBase.setDate(now.getDate() - 7);
    const lastWeek = getWeekBounds(prevBase);

    // 直近4週間分を一括取得
    const trendBase = new Date(now);
    trendBase.setDate(now.getDate() - 21);
    const trendStart = getWeekBounds(trendBase).dateFrom;

    const [allTx, weeklyBudgetItems, wishlistItems, balance, targetMonthlyBudgetItems] = await Promise.all([
      getTransactions({ dateFrom: trendStart, dateTo: thisWeek.dateTo }),
      getWeeklyBudgetData(y, m, thisWeek.dateFrom, thisWeek.dateTo),
      getWishlistItems(),
      getCurrentBalance(),
      getBudgetData(targetYear, targetMonth),
    ]);

    const lastWeekTx = allTx.filter((t) => t.date >= lastWeek.dateFrom && t.date <= lastWeek.dateTo);
    const thisWeekTx = allTx.filter((t) => t.date >= thisWeek.dateFrom && t.date <= thisWeek.dateTo);

    const lines: string[] = [];
    lines.push(`# 予算設定対象期間: ${targetStart}〜${targetEnd}`);
    lines.push(`# 分析対象期間: ${lastWeek.dateFrom}〜${thisWeek.dateTo}`);
    lines.push("");

    lines.push(`## 先週の取引明細 (${lastWeek.dateFrom}〜${lastWeek.dateTo})`);
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(lastWeekTx));
    lines.push("");

    lines.push(`## 今週の取引明細 (${thisWeek.dateFrom}〜${thisWeek.dateTo})`);
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(thisWeekTx));
    lines.push("");

    // カテゴリ別集計（先週 vs 今週 vs 週次予算）
    const lastWeekCatMap = new Map<string, number>();
    for (const t of lastWeekTx.filter((t) => t.type === "expense")) {
      const name = t.categories?.name ?? "未分類";
      lastWeekCatMap.set(name, (lastWeekCatMap.get(name) ?? 0) + t.amount);
    }

    lines.push("## カテゴリ別集計（先週 vs 今週 vs 週次予算）");
    lines.push("カテゴリ,先週実績,今週実績,週次予算,達成率(%)(今週)");
    for (const item of weeklyBudgetItems) {
      const lastAmt = lastWeekCatMap.get(item.category.name) ?? 0;
      if (lastAmt === 0 && item.weeklyActual === 0 && item.weeklyBudget === 0) continue;
      const pct = item.weeklyBudget > 0 ? Math.round((item.weeklyActual / item.weeklyBudget) * 100) : "";
      lines.push([escapeCsv(item.category.name), lastAmt, item.weeklyActual, item.weeklyBudget, pct].join(","));
    }
    lines.push("");

    // 直近4週間の週別推移
    const weekWindows: { start: string; end: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const base = new Date(now);
      base.setDate(now.getDate() - i * 7);
      const { dateFrom: ws, dateTo: we } = getWeekBounds(base);
      if (!weekWindows.find((w) => w.start === ws)) weekWindows.push({ start: ws, end: we });
    }

    const catNames = Array.from(
      new Set(allTx.filter((t) => t.type === "expense").map((t) => t.categories?.name ?? "未分類"))
    );

    lines.push("## 直近4週間の週別推移");
    lines.push(["週開始", ...catNames.map(escapeCsv), "合計"].join(","));
    for (const { start: ws, end: we } of weekWindows) {
      const weekTx = allTx.filter((t) => t.type === "expense" && t.date >= ws && t.date <= we);
      const catTotals = catNames.map((name) =>
        weekTx.filter((t) => (t.categories?.name ?? "未分類") === name).reduce((s, t) => s + t.amount, 0)
      );
      const total = catTotals.reduce((s, v) => s + v, 0);
      lines.push([ws, ...catTotals, total].join(","));
    }

    // 予算設定対象月の月次予算と残予算
    let monthActualTotal = 0;
    lines.push("");
    lines.push(`## 対象月の月次予算と残予算 (${targetYear}年${targetMonth}月)`);
    lines.push("カテゴリ,月次予算,対象月実績,残予算,消化率(%)");
    let monthBudgetTotal = 0;
    for (const item of targetMonthlyBudgetItems) {
      const actual = item.actualAmount;
      if (item.budgetAmount === 0 && actual === 0) continue;
      const remaining = item.budgetAmount - actual;
      const pct = item.budgetAmount > 0 ? Math.round((actual / item.budgetAmount) * 100) : "";
      lines.push([escapeCsv(item.category.name), item.budgetAmount, actual, remaining, pct].join(","));
      monthBudgetTotal += item.budgetAmount;
      monthActualTotal += actual;
    }
    lines.push(
      ["合計", monthBudgetTotal, monthActualTotal, monthBudgetTotal - monthActualTotal,
        monthBudgetTotal > 0 ? Math.round((monthActualTotal / monthBudgetTotal) * 100) : ""].join(",")
    );

    lines.push(...buildWishlistSection(wishlistItems, balance));
    return toCsvResponse(lines, `budget-${targetStart}_${targetEnd}`);
  }

  // ── 月次統合（ChatGPT用: 先月＋今月） ──────────────────
  if (period === "monthly") {
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    const prevMonthStart = `${py}-${pad(pm)}-01`;
    const prevMonthEnd = `${py}-${pad(pm)}-${pad(new Date(py, pm, 0).getDate())}`;
    const thisMonthStart = `${y}-${pad(m)}-01`;
    const thisMonthEnd = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;

    // 3ヶ月推移用に2ヶ月前から取得
    const mm2 = m - 2 <= 0 ? m + 10 : m - 2;
    const yy2 = m - 2 <= 0 ? y - 1 : y;
    const twoMonthsAgoStart = `${yy2}-${pad(mm2)}-01`;

    const [allTx, budgetItems, wishlistItems, balance] = await Promise.all([
      getTransactions({ dateFrom: twoMonthsAgoStart, dateTo: thisMonthEnd }),
      getBudgetData(y, m),
      getWishlistItems(),
      getCurrentBalance(),
    ]);

    const prevMonthTx = allTx.filter((t) => t.date >= prevMonthStart && t.date <= prevMonthEnd);
    const thisMonthTx = allTx.filter((t) => t.date >= thisMonthStart && t.date <= thisMonthEnd);

    const lines: string[] = [];
    lines.push(`# 対象期間: ${py}年${pm}月〜${y}年${m}月`);
    lines.push("");

    lines.push(`## 先月の取引明細 (${py}年${pm}月)`);
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(prevMonthTx));
    lines.push("");

    lines.push(`## 今月の取引明細 (${y}年${m}月)`);
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(thisMonthTx));
    lines.push("");

    // カテゴリ別集計（先月 vs 今月 vs 月次予算）
    const prevCatMap = new Map<string, number>();
    for (const t of prevMonthTx.filter((t) => t.type === "expense")) {
      const name = t.categories?.name ?? "未分類";
      prevCatMap.set(name, (prevCatMap.get(name) ?? 0) + t.amount);
    }

    lines.push("## カテゴリ別集計（先月 vs 今月 vs 月次予算）");
    lines.push("カテゴリ,先月実績,今月実績,月次予算,達成率(%)(今月),過不足(今月)");
    for (const item of budgetItems) {
      const prevAmt = prevCatMap.get(item.category.name) ?? 0;
      if (prevAmt === 0 && item.actualAmount === 0 && item.budgetAmount === 0) continue;
      const pct = item.budgetAmount > 0 ? Math.round((item.actualAmount / item.budgetAmount) * 100) : "";
      const diff = item.budgetAmount > 0 ? item.actualAmount - item.budgetAmount : "";
      lines.push([escapeCsv(item.category.name), prevAmt, item.actualAmount, item.budgetAmount, pct, diff].join(","));
    }
    lines.push("");

    // 直近3ヶ月の月別収支推移
    const months = [{ y: yy2, m: mm2 }, { y: py, m: pm }, { y, m }];
    lines.push("## 直近3ヶ月の月別収支推移");
    lines.push("月,収入,支出,収支");
    for (const { y: yy, m: mm } of months) {
      const start = `${yy}-${pad(mm)}-01`;
      const end = `${yy}-${pad(mm)}-${pad(new Date(yy, mm, 0).getDate())}`;
      const mTx = allTx.filter((t) => t.date >= start && t.date <= end);
      const income = mTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = mTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      lines.push([`${yy}-${pad(mm)}`, income, expense, income - expense].join(","));
    }

    // 今月の週別実績
    const currentMonthWeeks = getWeeksOfMonth(y, m);
    const weekCatNames = Array.from(
      new Set(thisMonthTx.filter((t) => t.type === "expense").map((t) => t.categories?.name ?? "未分類"))
    );
    if (weekCatNames.length > 0) {
      lines.push("");
      lines.push(`## 今月の週別実績 (${y}年${m}月)`);
      lines.push(["週", ...weekCatNames.map(escapeCsv), "合計"].join(","));
      for (const week of currentMonthWeeks) {
        const weekTx = thisMonthTx.filter((t) => t.type === "expense" && t.date >= week.start && t.date <= week.end);
        const catAmounts = weekCatNames.map((name) =>
          weekTx.filter((t) => (t.categories?.name ?? "未分類") === name).reduce((s, t) => s + t.amount, 0)
        );
        const total = catAmounts.reduce((s, v) => s + v, 0);
        lines.push([week.label, ...catAmounts, total].join(","));
      }
    }

    lines.push(...buildWishlistSection(wishlistItems, balance));
    return toCsvResponse(lines, `monthly-${y}-${pad(m)}`);
  }

  // ── 既存のperiod（CsvExportコンポーネント向け） ─────────
  const { dateFrom, dateTo, label } = getPeriodRange(period);
  const isMonthPeriod = period === "current" || period === "prev";
  const isLongPeriod = period === "3months" || period === "year" || period === "all";

  const [transactions, wishlistItems, balance] = await Promise.all([
    getTransactions({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    getWishlistItems(),
    getCurrentBalance(),
  ]);

  const lines: string[] = [];

  if (isMonthPeriod) {
    const [yy, mm] = dateFrom.split("-").map(Number);
    const budgetItems = await getBudgetData(yy, mm);

    lines.push(`# 対象期間: ${yy}年${mm}月`);
    lines.push("");
    lines.push("## 取引明細");
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(transactions));
    lines.push("");
    lines.push("## カテゴリ別集計（月次予算vs実績）");
    lines.push("カテゴリ,支出合計,月次予算,達成率(%),過不足");
    for (const item of budgetItems) {
      if (item.actualAmount === 0 && item.budgetAmount === 0) continue;
      const pct = item.budgetAmount > 0 ? Math.round((item.actualAmount / item.budgetAmount) * 100) : "";
      const diff = item.budgetAmount > 0 ? item.actualAmount - item.budgetAmount : "";
      lines.push([escapeCsv(item.category.name), item.actualAmount, item.budgetAmount, pct, diff].join(","));
    }
  } else if (isLongPeriod) {
    const yearlyTrend = await getYearlyTrend(y);
    const activeTrend = yearlyTrend.filter((r) => r.income > 0 || r.expense > 0);

    lines.push(`# 対象期間: ${dateFrom || "全期間"}〜${dateTo || ""}`);
    lines.push("");
    lines.push("## 取引明細");
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(transactions));
    lines.push("");
    lines.push("## 月別収支推移");
    lines.push("月,収入,支出,収支");
    for (const row of activeTrend) {
      lines.push([row.month, row.income, row.expense, row.income - row.expense].join(","));
    }

    const catNames = Array.from(
      new Set(transactions.filter((t) => t.type === "expense").map((t) => t.categories?.name ?? "未分類"))
    );
    if (catNames.length > 0 && activeTrend.length > 0) {
      const monthLabels = activeTrend.map((r) => r.month);
      lines.push("");
      lines.push("## カテゴリ別月別集計");
      lines.push(["カテゴリ", ...monthLabels].join(","));
      for (const catName of catNames) {
        const amounts = monthLabels.map((mon) => {
          const [yy, mm] = mon.split("-").map(Number);
          const start = `${yy}-${pad(mm)}-01`;
          const end = `${yy}-${pad(mm)}-${pad(new Date(yy, mm, 0).getDate())}`;
          return transactions
            .filter(
              (t) =>
                t.type === "expense" &&
                (t.categories?.name ?? "未分類") === catName &&
                t.date >= start &&
                t.date <= end
            )
            .reduce((s, t) => s + t.amount, 0);
        });
        lines.push([escapeCsv(catName), ...amounts].join(","));
      }
    }
  } else {
    // week / prev_week
    lines.push(`# 対象期間: ${dateFrom}〜${dateTo}`);
    lines.push("");
    lines.push("## 取引明細");
    lines.push(TX_HEADER);
    lines.push(...buildTxRows(transactions));
  }

  lines.push(...buildWishlistSection(wishlistItems, balance));
  return toCsvResponse(lines, label);
}

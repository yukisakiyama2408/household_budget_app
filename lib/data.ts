import { createClient } from "@/utils/supabase/server";
import type { Budget, Category, CreditSettlement, FeatureRequest, FixedExpense, FixedExpenseLog, Transaction, WishlistItem } from "@/types/database";
import { getWeekBudgetPeriods } from "@/lib/dateUtils";

export type PaceData = {
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  totalExpense: number;
  totalBudget: number;
  dailyAverage: number;
  projectedTotal: number;
  projectedDiff: number;  // 正 = 超過, 負 = 余り
  safeDaily: number;
  budgetRemaining: number;
};

export function calcPace(
  year: number,
  month: number,
  totalExpense: number,
  totalBudget: number
): PaceData {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0);

  const dailyAverage = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
  const projectedTotal = Math.round(dailyAverage * daysInMonth);
  const projectedDiff = totalBudget > 0 ? projectedTotal - totalBudget : 0;
  const budgetRemaining = totalBudget - totalExpense;
  const safeDaily = daysRemaining > 0 ? Math.max(budgetRemaining, 0) / daysRemaining : 0;

  return {
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    totalExpense,
    totalBudget,
    dailyAverage,
    projectedTotal,
    projectedDiff,
    safeDaily,
    budgetRemaining,
  };
}

export type FixedExpenseWithCategory = FixedExpense & {
  categories: { name: string; color: string | null } | null;
};

export type BudgetItem = {
  category: Category;
  budgetAmount: number;
  actualAmount: number;
};

export type DayEntry = {
  income: number;
  cashExpense: number;    // Cash払いのみ（残高計算に使用）
  creditExpense: number;  // Credit払い（参考表示用）
};

export type MonthDailyData = {
  year: number;
  month: number;
  daysInMonth: number;
  totalIncome: number;
  totalCashExpense: number;
  totalCreditExpense: number;
  days: Record<number, DayEntry>;
  startBalance: number;
  creditSettlement: number;
  settlementDay: number;
  settlementDate: string | null;
};

const PAGE_SIZE = 1000;

async function fetchAllTransactions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: any
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await baseQuery.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data ?? []) as Transaction[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function getDailyData(year: number): Promise<MonthDailyData[]> {
  const supabase = await createClient();

  // 選択年より前の収支合計（残高計算: 収入 - Cash支出 のみ）
  const prevRows = await fetchAllTransactions(
    supabase.from("transactions").select("*").lt("date", `${year}-01-01`)
  );

  // 選択年より前のクレジット引き落とし合計
  const { data: prevSettlements, error: prevSetError } = await supabase
    .from("credit_settlements")
    .select("*")
    .lt("year", year);
  if (prevSetError) throw prevSetError;

  const prevSettlementTotal = ((prevSettlements ?? []) as CreditSettlement[]).reduce(
    (sum, s) => sum + s.amount, 0
  );
  let runningBalance = prevRows.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.pay_method === "Cash") return sum - t.amount;
    return sum;
  }, 0) - prevSettlementTotal;

  // 選択年のすべての収支を日付順に取得（ページネーションで全件）
  const rows = await fetchAllTransactions(
    supabase
      .from("transactions")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: true })
  );

  // 選択年のクレジット引き落とし取得
  const { data: settlementData, error: setError } = await supabase
    .from("credit_settlements")
    .select("*")
    .eq("year", year);
  if (setError) throw setError;

  const settlementMap = new Map<number, { amount: number; day: number; date: string }>(
    ((settlementData ?? []) as CreditSettlement[]).map((s) => {
      const day = parseInt(s.settlement_date.split("-")[2], 10);
      return [s.month, { amount: s.amount, day, date: s.settlement_date }];
    })
  );

  // 日付ごとに集計
  const dayMap = new Map<string, DayEntry>();
  for (const t of rows) {
    const entry = dayMap.get(t.date) ?? { income: 0, cashExpense: 0, creditExpense: 0 };
    if (t.type === "income") {
      entry.income += t.amount;
    } else if (t.pay_method === "Cash") {
      entry.cashExpense += t.amount;
    } else {
      entry.creditExpense += t.amount;
    }
    dayMap.set(t.date, entry);
  }

  // 月ごとにまとめる
  const result: MonthDailyData[] = [];
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    const monthStr = `${year}-${String(m).padStart(2, "0")}`;
    const startBalance = runningBalance;
    const settlementInfo = settlementMap.get(m);
    const creditSettlement = settlementInfo?.amount ?? 0;
    const settlementDay = settlementInfo?.day ?? 27;
    const settlementDate = settlementInfo?.date ?? null;

    let totalIncome = 0;
    let totalCashExpense = 0;
    let totalCreditExpense = 0;
    const days: Record<number, DayEntry> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthStr}-${String(d).padStart(2, "0")}`;
      const entry = dayMap.get(dateStr) ?? { income: 0, cashExpense: 0, creditExpense: 0 };
      days[d] = entry;
      totalIncome += entry.income;
      totalCashExpense += entry.cashExpense;
      totalCreditExpense += entry.creditExpense;
      runningBalance += entry.income - entry.cashExpense;
      if (d === settlementDay) {
        runningBalance -= creditSettlement;
      }
    }

    result.push({ year, month: m, daysInMonth, totalIncome, totalCashExpense, totalCreditExpense, days, startBalance, creditSettlement, settlementDay, settlementDate });
  }

  return result;
}

export type WeekCategoryData = {
  id: number | null;
  name: string;
  color: string;
  amount: number;
};

export type WeekData = {
  label: string;
  startDate: string;
  endDate: string;
  income: number;
  expense: number;
  reimbursement: number;
  effectiveExpense: number;
  categories: WeekCategoryData[];
};

export async function getWeeklyData(year: number, month: number): Promise<WeekData[]> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const monthStart = new Date(year, month - 1, 1);
  const dow = monthStart.getDay();
  const firstMonday = new Date(monthStart);
  firstMonday.setDate(firstMonday.getDate() - (dow === 0 ? 6 : dow - 1));

  const monthEnd = new Date(year, month, 0);
  const dowEnd = monthEnd.getDay();
  const lastSunday = new Date(monthEnd);
  lastSunday.setDate(lastSunday.getDate() + (dowEnd === 0 ? 0 : 7 - dowEnd));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, type, category_id, categories(name, color, offset_category_id)")
    .gte("date", fmtDate(firstMonday))
    .lte("date", fmtDate(lastSunday));
  if (error) throw error;
  const rows = (data ?? []) as {
    date: string;
    amount: number;
    type: string;
    category_id: number | null;
    categories: { name: string; color: string | null; offset_category_id: number | null } | null;
  }[];

  const weeks: WeekData[] = [];
  const cursor = new Date(firstMonday);

  while (cursor <= lastSunday) {
    const wStart = new Date(cursor);
    const wEnd = new Date(cursor);
    wEnd.setDate(wEnd.getDate() + 6);

    const wStartStr = fmtDate(wStart);
    const wEndStr = fmtDate(wEnd);

    const [, sm, sd] = wStartStr.split("-");
    const [, em, ed] = wEndStr.split("-");
    const label =
      sm === em
        ? `${parseInt(sm)}/${parseInt(sd)}-${parseInt(ed)}`
        : `${parseInt(sm)}/${parseInt(sd)}-${parseInt(em)}/${parseInt(ed)}`;

    const weekTx = rows.filter((t) => t.date >= wStartStr && t.date <= wEndStr);
    const income = weekTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = weekTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const reimbursement = weekTx
      .filter((t) => t.type === "income" && t.categories?.offset_category_id != null)
      .reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, WeekCategoryData>();
    for (const tx of weekTx.filter((t) => t.type === "expense")) {
      const key = String(tx.category_id ?? "none");
      const name = tx.categories?.name ?? "未分類";
      const color = tx.categories?.color ?? "#B3B3B3";
      const prev = catMap.get(key) ?? { id: tx.category_id, name, color, amount: 0 };
      catMap.set(key, { ...prev, amount: prev.amount + tx.amount });
    }
    for (const tx of weekTx.filter((t) => t.type === "income" && t.categories?.offset_category_id != null)) {
      const key = String(tx.categories!.offset_category_id!);
      const existing = catMap.get(key);
      if (existing) {
        catMap.set(key, { ...existing, amount: Math.max(0, existing.amount - tx.amount) });
      }
    }
    const categories = Array.from(catMap.values()).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

    weeks.push({ label, startDate: wStartStr, endDate: wEndStr, income, expense, reimbursement, effectiveExpense: expense - reimbursement, categories });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

export type DailyTrendPoint = {
  day: number;
  actual: number;
  average: number;
};

export async function getDailySpendingTrend(year: number, month: number): Promise<DailyTrendPoint[]> {
  const supabase = await createClient();
  const pad = (n: number) => String(n).padStart(2, "0");
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;

  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount")
    .eq("type", "expense")
    .gte("date", `${year}-${pad(month)}-01`)
    .lte("date", `${year}-${pad(month)}-${pad(daysInMonth)}`);
  if (error) throw error;

  const dailyMap = new Map<number, number>();
  for (const tx of (data ?? []) as { date: string; amount: number }[]) {
    const day = parseInt(tx.date.split("-")[2]);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + tx.amount);
  }

  const WINDOW = 7;
  const result: DailyTrendPoint[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const actual = dailyMap.get(d) ?? 0;
    let sum = 0;
    for (let i = Math.max(1, d - WINDOW + 1); i <= d; i++) {
      sum += dailyMap.get(i) ?? 0;
    }
    const count = d < WINDOW ? d : WINDOW;
    result.push({ day: d, actual, average: Math.round(sum / count) });
  }

  return result;
}

export type WeekSummaryData = {
  startDate: string;
  endDate: string;
  label: string;
  income: number;
  expense: number;
  reimbursement: number;
  effectiveExpense: number;
  categories: WeekCategoryData[];
};

export async function getWeekSummaryForDates(startDate: string, endDate: string): Promise<WeekSummaryData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, type, category_id, categories(name, color, offset_category_id)")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;

  const rows = (data ?? []) as {
    date: string;
    amount: number;
    type: string;
    category_id: number | null;
    categories: { name: string; color: string | null; offset_category_id: number | null } | null;
  }[];

  const income = rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const reimbursement = rows
    .filter((t) => t.type === "income" && t.categories?.offset_category_id != null)
    .reduce((s, t) => s + t.amount, 0);

  const catMap = new Map<string, WeekCategoryData>();
  for (const tx of rows.filter((t) => t.type === "expense")) {
    const key = String(tx.category_id ?? "none");
    const name = tx.categories?.name ?? "未分類";
    const color = tx.categories?.color ?? "#B3B3B3";
    const prev = catMap.get(key) ?? { id: tx.category_id, name, color, amount: 0 };
    catMap.set(key, { ...prev, amount: prev.amount + tx.amount });
  }
  for (const tx of rows.filter((t) => t.type === "income" && t.categories?.offset_category_id != null)) {
    const key = String(tx.categories!.offset_category_id!);
    const existing = catMap.get(key);
    if (existing) {
      catMap.set(key, { ...existing, amount: Math.max(0, existing.amount - tx.amount) });
    }
  }
  const categories = Array.from(catMap.values()).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const [, sm, sd] = startDate.split("-");
  const [, em, ed] = endDate.split("-");
  const label =
    sm === em
      ? `${parseInt(sm)}/${parseInt(sd)}-${parseInt(ed)}`
      : `${parseInt(sm)}/${parseInt(sd)}-${parseInt(em)}/${parseInt(ed)}`;

  return { startDate, endDate, label, income, expense, reimbursement, effectiveExpense: expense - reimbursement, categories };
}

export async function getCheckinForWeek(weekStart: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("check_ins") as any)
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();
  // テーブル未作成時は false として扱う（42P01 = undefined_table）
  if (error) {
    if (error.code === "42P01") return false;
    throw error;
  }
  return data !== null;
}

export type GoalType = "savings" | "expense";

export type Goal = {
  id: number;
  title: string;
  type: GoalType;
  target_amount: number;
  deadline: string | null;
  category_id: number | null;
  created_at: string;
};

export type GoalWithProgress = Goal & {
  currentAmount: number;
  progress: number;  // 0–1 (capped)
  isOnTrack: boolean;
  categoryName: string | null;
  categoryColor: string | null;
};

export async function getGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("goals") as any)
    .select("*, categories(name, color)")
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }

  const goals = (data ?? []) as (Goal & {
    categories: { name: string; color: string | null } | null;
  })[];
  if (goals.length === 0) return [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 貯金目標：日次表と同じ今日時点の残高
  const savingsGoals = goals.filter((g) => g.type === "savings");
  const currentBalance = savingsGoals.length > 0 ? await getCurrentBalance() : 0;

  const expenseCategoryIds = goals
    .filter((g) => g.type === "expense" && g.category_id != null)
    .map((g) => g.category_id as number);

  const categoryExpenses = new Map<number, number>();
  if (expenseCategoryIds.length > 0) {
    const { start, end } = getMonthRange(year, month);
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("date", start)
      .lt("date", end)
      .in("category_id", expenseCategoryIds);
    if (txError) throw txError;
    for (const tx of (txData ?? []) as { category_id: number; amount: number }[]) {
      categoryExpenses.set(tx.category_id, (categoryExpenses.get(tx.category_id) ?? 0) + tx.amount);
    }
  }

  return goals.map((g) => {
    const currentAmount =
      g.type === "savings"
        ? currentBalance
        : (g.category_id ? (categoryExpenses.get(g.category_id) ?? 0) : 0);
    const rawProgress = g.target_amount > 0 ? currentAmount / g.target_amount : 0;
    const isOnTrack = g.type === "savings" ? rawProgress >= 1 : currentAmount <= g.target_amount;

    return {
      ...g,
      currentAmount,
      progress: Math.min(rawProgress, 1),
      isOnTrack,
      categoryName: g.categories?.name ?? null,
      categoryColor: g.categories?.color ?? null,
    };
  });
}

export async function getCreditSettlements(year: number): Promise<CreditSettlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_settlements")
    .select("*")
    .eq("year", year);
  if (error) throw error;
  return (data ?? []) as CreditSettlement[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getTransactions({
  month,
  type,
  categoryId,
  payMethod,
  q,
  needs,
  limit,
  dateFrom,
  dateTo,
}: {
  month?: string;
  type?: string;
  categoryId?: string;
  payMethod?: string;
  q?: string;
  needs?: string;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end =
      m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    query = query.gte("date", start).lt("date", end);
  }
  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (type && (type === "income" || type === "expense")) {
    query = query.eq("type", type);
  }
  if (categoryId) {
    query = query.eq("category_id", parseInt(categoryId));
  }
  if (payMethod && (payMethod === "Cash" || payMethod === "Credit")) {
    query = query.eq("pay_method", payMethod);
  }
  const search = q?.trim().replaceAll(",", " ");
  if (search) {
    query = query.or(`content.ilike.%${search}%,store.ilike.%${search}%`);
  }
  if (needs === "category") {
    query = query.is("category_id", null);
  }
  if (needs === "store") {
    query = query.is("store", null).eq("type", "expense");
  }
  if (limit) {
    query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TransactionWithCategory[];
  }

  // limit 未指定時は全件ページネーション取得
  const all: TransactionWithCategory[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data ?? []) as TransactionWithCategory[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function getCurrentBalance(): Promise<number> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [allRows, { data: settlements, error: setError }] = await Promise.all([
    fetchAllTransactions(supabase.from("transactions").select("*").lte("date", todayStr)),
    supabase.from("credit_settlements").select("*").lte("settlement_date", todayStr),
  ]);
  if (setError) throw setError;

  const txBalance = allRows.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.pay_method === "Cash") return sum - t.amount;
    return sum;
  }, 0);

  const settlementTotal = ((settlements ?? []) as CreditSettlement[]).reduce(
    (sum, s) => sum + s.amount, 0
  );

  return txBalance - settlementTotal;
}

const wishlistPriorityOrder = { next: 0, high: 1, medium: 2, low: 3, "": 4 } as const;

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .is("purchased_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }
  return ((data ?? []) as WishlistItem[]).sort(
    (a, b) => wishlistPriorityOrder[a.priority] - wishlistPriorityOrder[b.priority]
  );
}

export async function getTransactionById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function getTransactionDateBounds(): Promise<{ earliest: string; latest: string } | null> {
  const supabase = await createClient();
  const [earliestResult, latestResult] = await Promise.all([
    supabase.from("transactions").select("date").order("date", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("transactions").select("date").order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (earliestResult.error) throw earliestResult.error;
  if (latestResult.error) throw latestResult.error;
  if (!earliestResult.data || !latestResult.data) return null;
  return {
    earliest: (earliestResult.data as { date: string }).date,
    latest: (latestResult.data as { date: string }).date,
  };
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function getMonthlySummary(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const [{ data: txData, error: txError }, { data: reimData, error: reimError }] = await Promise.all([
    supabase.from("transactions").select("type, amount").gte("date", start).lt("date", end),
    supabase.from("transactions").select("amount, categories(offset_category_id)").eq("type", "income").gte("date", start).lt("date", end),
  ]);
  if (txError) throw txError;
  if (reimError) throw reimError;

  const rows = (txData ?? []) as { type: string; amount: number }[];
  const income = rows.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = rows.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const reimbursement = ((reimData ?? []) as { amount: number; categories: { offset_category_id: number | null } | null }[])
    .filter((t) => t.categories?.offset_category_id != null)
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, reimbursement, effectiveExpense: expense - reimbursement, balance: income - expense };
}

export type TransactionWithCategory = Transaction & {
  categories: { name: string; color: string | null } | null;
};

export async function getCategoryBreakdown(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, category_id, categories(name, color, offset_category_id)")
    .gte("date", start)
    .lt("date", end);

  if (error) throw error;

  type Row = { type: string; amount: number; category_id: number | null; categories: { name: string; color: string | null; offset_category_id: number | null } | null };
  const rows = (data ?? []) as Row[];

  const map = new Map<number | "none", { name: string; color: string; amount: number }>();

  for (const t of rows.filter((r) => r.type === "expense")) {
    const key = t.category_id ?? "none";
    const name = t.categories?.name ?? "その他";
    const color = t.categories?.color ?? "#B3B3B3";
    const prev = map.get(key) ?? { name, color, amount: 0 };
    map.set(key, { ...prev, amount: prev.amount + t.amount });
  }

  for (const t of rows.filter((r) => r.type === "income" && r.categories?.offset_category_id != null)) {
    const targetId = t.categories!.offset_category_id!;
    const existing = map.get(targetId);
    if (existing) {
      map.set(targetId, { ...existing, amount: Math.max(0, existing.amount - t.amount) });
    }
  }

  return Array.from(map.values())
    .filter((v) => v.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export async function getYearlyTrend(year: number) {
  const supabase = await createClient();

  const [rows, { data: reimData, error: reimError }] = await Promise.all([
    fetchAllTransactions(
      supabase.from("transactions").select("date, type, amount").gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`).order("date", { ascending: true })
    ),
    supabase.from("transactions").select("date, amount, categories(offset_category_id)").eq("type", "income").gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`),
  ]);
  if (reimError) throw reimError;

  const map = new Map<string, { income: number; expense: number; reimbursement: number }>();

  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    map.set(key, { income: 0, expense: 0, reimbursement: 0 });
  }

  for (const t of rows) {
    const key = t.date.slice(0, 7);
    const prev = map.get(key) ?? { income: 0, expense: 0, reimbursement: 0 };
    if (t.type === "income") prev.income += t.amount;
    else prev.expense += t.amount;
    map.set(key, prev);
  }

  for (const t of ((reimData ?? []) as { date: string; amount: number; categories: { offset_category_id: number | null } | null }[])) {
    if (t.categories?.offset_category_id == null) continue;
    const key = t.date.slice(0, 7);
    const prev = map.get(key);
    if (prev) prev.reimbursement += t.amount;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense, reimbursement }]) => ({ month, income, expense, reimbursement, effectiveExpense: expense - reimbursement }));
}

export async function getYearlySummary(year: number) {
  const supabase = await createClient();

  const [rows, { data: reimData, error: reimError }] = await Promise.all([
    fetchAllTransactions(
      supabase.from("transactions").select("type, amount").gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`)
    ),
    supabase.from("transactions").select("amount, categories(offset_category_id)").eq("type", "income").gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`),
  ]);
  if (reimError) throw reimError;

  const income = rows.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = rows.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const reimbursement = ((reimData ?? []) as { amount: number; categories: { offset_category_id: number | null } | null }[])
    .filter((t) => t.categories?.offset_category_id != null)
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, reimbursement, effectiveExpense: expense - reimbursement, balance: income - expense };
}

export type YearlyBudgetData = {
  budgetAmount: number;
  actualAmount: number;
};

export async function getYearlyBudget(year: number): Promise<YearlyBudgetData> {
  const supabase = await createClient();

  const [{ data: budgetData, error: budgetError }, summary] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("yearly_budgets") as any).select("*").eq("year", year).maybeSingle(),
    getYearlySummary(year),
  ]);

  if (budgetError) throw budgetError;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    budgetAmount: (budgetData as any)?.amount ?? 0,
    actualAmount: summary.expense,
  };
}

export async function getFixedExpenses(): Promise<FixedExpenseWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*, categories(name, color)")
    .order("day_of_month", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FixedExpenseWithCategory[];
}

export async function getFixedExpenseLogs(): Promise<FixedExpenseLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_expense_logs")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FixedExpenseLog[];
}

export async function getFixedExpenseById(id: number): Promise<FixedExpense> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as FixedExpense;
}

export async function getBudgetData(year: number, month: number): Promise<BudgetItem[]> {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const [
    { data: categoryData, error: catError },
    { data: budgetData, error: budgetError },
    { data: txData, error: txError },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("display_order", { ascending: true }),
    supabase.from("budgets").select("*").eq("year", year).eq("month", month),
    supabase.from("transactions").select("type, amount, category_id, categories(offset_category_id)").gte("date", start).lt("date", end),
  ]);

  if (catError) throw catError;
  if (budgetError) throw budgetError;
  if (txError) throw txError;

  const categories = (categoryData ?? []) as Category[];
  const budgets = (budgetData ?? []) as Budget[];

  type TxRow = { type: string; amount: number; category_id: number | null; categories: { offset_category_id: number | null } | null };
  const transactions = (txData ?? []) as TxRow[];

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b.amount]));

  const actualMap = new Map<number, number>();
  for (const t of transactions) {
    if (t.type === "expense" && t.category_id != null) {
      actualMap.set(t.category_id, (actualMap.get(t.category_id) ?? 0) + t.amount);
    } else if (t.type === "income" && t.categories?.offset_category_id != null) {
      const targetId = t.categories.offset_category_id;
      actualMap.set(targetId, Math.max(0, (actualMap.get(targetId) ?? 0) - t.amount));
    }
  }

  return categories
    .filter((c) => c.type === "expense" || c.type === "both")
    .map((c) => ({
      category: c,
      budgetAmount: budgetMap.get(c.id) ?? 0,
      actualAmount: actualMap.get(c.id) ?? 0,
    }));
}

export type WeeklyBudgetPeriodItem = {
  start: string;
  end: string;
  label: string;
  year: number;
  month: number;
  monthlyBudget: number;
  budgetSet: number | null;
  budgetDerived: number;
  budget: number;
  actual: number;
};

export type WeeklyBudgetItem = {
  category: Category;
  periods: WeeklyBudgetPeriodItem[];
  weeklyBudget: number;
  weeklyActual: number;
};

export async function getWeeklyBudgetData(
  _year: number,
  _month: number,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyBudgetItem[]> {
  const supabase = await createClient();
  const periods = getWeekBudgetPeriods(weekStart, weekEnd);

  const [
    { data: categoryData, error: catError },
    periodBudgetResult,
    ...monthlyBudgetResults
  ] = await Promise.all([
    supabase.from("categories").select("*").order("display_order", { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("weekly_budget_periods") as any)
      .select("period_start, period_end, category_id, amount")
      .gte("period_start", weekStart)
      .lte("period_end", weekEnd),
    ...periods.map((period) =>
      supabase.from("budgets").select("*").eq("year", period.year).eq("month", period.month)
    ),
  ]);

  if (catError) throw catError;
  for (const result of monthlyBudgetResults) {
    if (result.error) throw result.error;
  }
  if (periodBudgetResult.error) throw periodBudgetResult.error;

  const categories = (categoryData ?? []) as Category[];
  const periodBudgets = (periodBudgetResult.data ?? []) as {
    period_start: string;
    period_end: string;
    category_id: number;
    amount: number;
  }[];
  const monthlyBudgetMaps = monthlyBudgetResults.map(
    (result) => new Map(((result.data ?? []) as Budget[]).map((budget) => [budget.category_id, budget.amount]))
  );
  const periodBudgetMap = new Map(
    periodBudgets.map((budget) => [
      `${budget.period_start}:${budget.period_end}:${budget.category_id}`,
      budget.amount,
    ])
  );
  const actualByPeriodAndCategory = new Map<string, number>();

  const periodTransactionResults = await Promise.all(
    periods.map((period) =>
      supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("type", "expense")
        .gte("date", period.start)
        .lte("date", period.end)
    )
  );
  for (const [periodIndex, result] of periodTransactionResults.entries()) {
    if (result.error) throw result.error;
    for (const tx of (result.data ?? []) as { category_id: number | null; amount: number }[]) {
      if (tx.category_id == null) continue;
      const key = `${periodIndex}:${tx.category_id}`;
      actualByPeriodAndCategory.set(key, (actualByPeriodAndCategory.get(key) ?? 0) + tx.amount);
    }
  }

  return categories
    .filter((c) => c.type === "expense" || c.type === "both")
    .map((category) => {
      const periodItems = periods.map((period, periodIndex) => {
        const monthlyBudget = monthlyBudgetMaps[periodIndex].get(category.id) ?? 0;
        const budgetDerived =
          period.weeksInMonth > 0 ? Math.round(monthlyBudget / period.weeksInMonth) : 0;
        const budgetSet =
          periodBudgetMap.get(`${period.start}:${period.end}:${category.id}`) ?? null;

        return {
          start: period.start,
          end: period.end,
          label: period.label,
          year: period.year,
          month: period.month,
          monthlyBudget,
          budgetSet,
          budgetDerived,
          budget: budgetSet ?? budgetDerived,
          actual: actualByPeriodAndCategory.get(`${periodIndex}:${category.id}`) ?? 0,
        };
      });

      return {
        category,
        periods: periodItems,
        weeklyBudget: periodItems.reduce((sum, period) => sum + period.budget, 0),
        weeklyActual: periodItems.reduce((sum, period) => sum + period.actual, 0),
      };
    });
}

export async function getMonthlyTotalBudget(year: number, month: number): Promise<number> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("monthly_total_budgets") as any)
    .select("amount")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (error && error.code !== "42P01") throw error;
  return (data as { amount: number } | null)?.amount ?? 0;
}

export async function getWeeklyTotalBudget(weekStart: string): Promise<number> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("weekly_total_budgets") as any)
    .select("amount")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error && error.code !== "42P01") throw error;
  return (data as { amount: number } | null)?.amount ?? 0;
}

export async function hasMonthlyBudget(year: number, month: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .limit(1);
  if (error) throw error;
  return ((data ?? []) as unknown[]).length > 0;
}

export async function hasWeeklyBudget(weekStart: string): Promise<boolean> {
  const supabase = await createClient();
  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  weekStartDate.setDate(weekStartDate.getDate() + 6);
  const weekEnd = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, "0")}-${String(weekStartDate.getDate()).padStart(2, "0")}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("weekly_budget_periods") as any)
    .select("category_id")
    .gte("period_start", weekStart)
    .lte("period_end", weekEnd)
    .limit(1);
  if (error) throw error;
  return ((data ?? []) as unknown[]).length > 0;
}

export async function getFeatureRequests(): Promise<FeatureRequest[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("feature_requests") as any)
    .select("*")
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false });

  if (error && error.code !== "42P01") throw error;
  return (data ?? []) as FeatureRequest[];
}

export async function getFeatureRequestSuggestions(limit = 8): Promise<Pick<FeatureRequest, "id" | "title" | "category" | "votes">[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("feature_requests") as any)
    .select("id, title, category, votes")
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && error.code !== "42P01") throw error;
  return (data ?? []) as Pick<FeatureRequest, "id" | "title" | "category" | "votes">[];
}

import { createClient } from "@/utils/supabase/server";
import type { Budget, Category, CreditSettlement, FixedExpense, FixedExpenseLog, Transaction } from "@/types/database";

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

  const settlementMap = new Map<number, number>(
    ((settlementData ?? []) as CreditSettlement[]).map((s) => [s.month, s.amount])
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
    const creditSettlement = settlementMap.get(m) ?? 0;

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
      if (d === 27) {
        runningBalance -= creditSettlement;
      }
    }

    result.push({ year, month: m, daysInMonth, totalIncome, totalCashExpense, totalCreditExpense, days, startBalance, creditSettlement });
  }

  return result;
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
  limit,
}: {
  month?: string;
  type?: string;
  categoryId?: string;
  limit?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end =
      m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    query = query.gte("date", start).lt("date", end);
  }
  if (type && (type === "income" || type === "expense")) {
    query = query.eq("type", type);
  }
  if (categoryId) {
    query = query.eq("category_id", parseInt(categoryId));
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TransactionWithCategory[];
}

export async function getCurrentBalance(): Promise<number> {
  const supabase = await createClient();

  const [allRows, { data: settlements, error: setError }] = await Promise.all([
    fetchAllTransactions(supabase.from("transactions").select("*")),
    supabase.from("credit_settlements").select("*"),
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

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", start)
    .lt("date", end);

  if (error) throw error;

  const rows = (data ?? []) as Transaction[];
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

type TransactionWithCategory = Transaction & {
  categories: { name: string; color: string | null } | null;
};

export async function getCategoryBreakdown(year: number, month: number) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .eq("type", "expense")
    .gte("date", start)
    .lt("date", end);

  if (error) throw error;

  const rows = (data ?? []) as TransactionWithCategory[];
  const map = new Map<string, { amount: number; color: string }>();

  for (const t of rows) {
    const name = t.categories?.name ?? "その他";
    const color = t.categories?.color ?? "#B3B3B3";
    const prev = map.get(name) ?? { amount: 0, color };
    map.set(name, { amount: prev.amount + t.amount, color });
  }

  return Array.from(map.entries())
    .map(([name, { amount, color }]) => ({ name, amount, color }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getYearlyTrend(year: number) {
  const supabase = await createClient();

  const rows = await fetchAllTransactions(
    supabase
      .from("transactions")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: true })
  );
  const map = new Map<string, { income: number; expense: number }>();

  // 1〜12月分を初期化（データなしの月も表示するため）
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    map.set(key, { income: 0, expense: 0 });
  }

  for (const t of rows) {
    const key = t.date.slice(0, 7);
    const prev = map.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") prev.income += t.amount;
    else prev.expense += t.amount;
    map.set(key, prev);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => ({ month, income, expense }));
}

export async function getYearlySummary(year: number) {
  const supabase = await createClient();

  const rows = await fetchAllTransactions(
    supabase
      .from("transactions")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
  );
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
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
    supabase.from("transactions").select("*").eq("type", "expense").gte("date", start).lt("date", end),
  ]);

  if (catError) throw catError;
  if (budgetError) throw budgetError;
  if (txError) throw txError;

  const categories = (categoryData ?? []) as Category[];
  const budgets = (budgetData ?? []) as Budget[];
  const transactions = (txData ?? []) as Transaction[];

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b.amount]));

  const actualMap = new Map<number, number>();
  for (const t of transactions) {
    if (t.category_id != null) {
      actualMap.set(t.category_id, (actualMap.get(t.category_id) ?? 0) + t.amount);
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

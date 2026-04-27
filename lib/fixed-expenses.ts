import { createClient } from "@/utils/supabase/server";
import type { FixedExpense, FixedExpenseLog } from "@/types/database";

export async function applyFixedExpenses(
  year: number,
  month: number
): Promise<{ applied: number; skipped: number }> {
  const supabase = await createClient();

  const { data: fixedData, error: fixedError } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("is_active", true);
  if (fixedError) throw fixedError;
  const fixedExpenses = (fixedData ?? []) as FixedExpense[];

  if (fixedExpenses.length === 0) return { applied: 0, skipped: 0 };

  const { data: logData, error: logError } = await supabase
    .from("fixed_expense_logs")
    .select("fixed_expense_id")
    .eq("year", year)
    .eq("month", month);
  if (logError) throw logError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appliedIds = new Set((logData ?? []).map((l: any) => l.fixed_expense_id as number));

  let applied = 0;
  let skipped = 0;

  for (const fe of fixedExpenses) {
    if (appliedIds.has(fe.id)) {
      skipped++;
      continue;
    }

    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(fe.day_of_month, lastDay);
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .insert({
        date,
        content: fe.name,
        type: fe.type,
        category_id: fe.category_id,
        amount: fe.amount,
        pay_method: fe.pay_method,
        store: fe.store,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .single();
    if (txError) throw txError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logInsertError } = await (supabase.from("fixed_expense_logs") as any).insert({
      fixed_expense_id: fe.id,
      year,
      month,
      transaction_id: txData.id,
    });
    if (logInsertError) throw logInsertError;

    applied++;
  }

  return { applied, skipped };
}

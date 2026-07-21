"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { MonthDailyData } from "@/lib/data";
import MonthSelector from "@/components/dashboard/MonthSelector";
import CreditSettlementForm from "./CreditSettlementForm";

type Props = {
  data: MonthDailyData;
  showMonthSelector?: boolean;
};

const weekdays = ["月", "火", "水", "木", "金", "土", "日"];
const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;

export default function DailyTable({ data, showMonthSelector = true }: Props) {
  const {
    year, month, daysInMonth, totalIncome, totalCashExpense,
    days, startBalance, creditSettlement, settlementDay, settlementDate,
  } = data;
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const updateToday = () => setToday(new Date());
    updateToday();
    const timer = window.setInterval(updateToday, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const balances: number[] = [];
  let running = startBalance;
  for (let day = 1; day <= daysInMonth; day++) {
    const entry = days[day] ?? { income: 0, cashExpense: 0, creditExpense: 0 };
    const settlement = day === settlementDay ? creditSettlement : 0;
    running += entry.income - entry.cashExpense - settlement;
    balances.push(running);
  }

  const dayNumbers = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const startWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const trailingCells = (7 - ((startWeekday + daysInMonth) % 7)) % 7;
  const totalExpense = totalCashExpense + creditSettlement;
  const endBalance = balances.at(-1) ?? startBalance;
  const isToday = (day: number) =>
    today !== null && today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        {showMonthSelector && <MonthSelector year={year} month={month} />}
        <div className="grid grid-cols-3 gap-5 text-right text-xs tabular-nums sm:gap-8">
          <div>
            <p className="text-gray-400">収入</p>
            <p className="mt-1 font-bold text-emerald-700">{yen(totalIncome)}</p>
          </div>
          <div>
            <p className="text-gray-400">支出</p>
            <p className="mt-1 font-bold text-rose-600">{yen(totalExpense)}</p>
          </div>
          <div>
            <p className="text-gray-400">月末残高</p>
            <p className={`mt-1 font-bold ${endBalance < 0 ? "text-rose-600" : "text-gray-800"}`}>{yen(endBalance)}</p>
          </div>
        </div>
      </header>

      <CreditSettlementForm
        year={year}
        month={month}
        currentAmount={creditSettlement}
        settlementDate={settlementDate}
      />

      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {weekdays.map((weekday, index) => (
            <div key={weekday} className={`border-r px-3 py-2 text-center text-xs font-bold last:border-r-0 ${index >= 5 ? "text-indigo-500" : "text-gray-500"}`}>
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startWeekday }, (_, index) => (
            <div key={`leading-${index}`} className="min-h-32 border-b border-r bg-slate-50/60" />
          ))}
          {dayNumbers.map((day, index) => {
            const entry = days[day] ?? { income: 0, cashExpense: 0, creditExpense: 0 };
            const expense = entry.cashExpense + (day === settlementDay ? creditSettlement : 0);
            const weekday = (startWeekday + index) % 7;
            return (
              <article key={day} className="min-h-32 border-b border-r bg-white p-3 transition-colors hover:bg-indigo-50/30">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${isToday(day) ? "bg-indigo-600 text-white" : weekday >= 5 ? "text-indigo-500" : "text-gray-700"}`}>
                  {day}
                </span>
                <div className="mt-4 space-y-1.5 text-xs tabular-nums">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-gray-400"><ArrowDownLeft className="h-3 w-3" />収入</span>
                    <strong className={entry.income ? "text-emerald-700" : "font-normal text-gray-300"}>
                      {entry.income ? `+${yen(entry.income)}` : "—"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-gray-400"><ArrowUpRight className="h-3 w-3" />支出</span>
                    <strong className={expense ? "text-rose-600" : "font-normal text-gray-300"}>
                      {expense ? `-${yen(expense)}` : "—"}
                    </strong>
                  </div>
                </div>
                <div className="mt-3 border-t border-dashed pt-2 text-[11px] text-gray-400">
                  残高
                  <span className={`float-right font-medium tabular-nums ${balances[index] < 0 ? "text-rose-600" : "text-gray-600"}`}>
                    {yen(balances[index])}
                  </span>
                </div>
              </article>
            );
          })}
          {Array.from({ length: trailingCells }, (_, index) => (
            <div key={`trailing-${index}`} className="min-h-32 border-b border-r bg-slate-50/60" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-gray-200 sm:grid-cols-2 md:hidden">
        {dayNumbers.map((day, index) => {
          const entry = days[day] ?? { income: 0, cashExpense: 0, creditExpense: 0 };
          const expense = entry.cashExpense + (day === settlementDay ? creditSettlement : 0);
          return (
            <div key={day} className="bg-white p-4">
              <p className="mb-3 flex items-center font-bold text-gray-800">
                {month}月
                <span className={`mx-0.5 grid h-7 w-7 place-items-center rounded-full ${isToday(day) ? "bg-indigo-600 text-white" : ""}`}>{day}</span>
                日 <span className="ml-1 text-xs font-medium text-gray-400">({weekdays[(startWeekday + index) % 7]})</span>
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                <div><p className="text-gray-400">収入</p><p className="mt-1 font-semibold text-emerald-700">{entry.income ? `+${yen(entry.income)}` : "—"}</p></div>
                <div><p className="text-gray-400">支出</p><p className="mt-1 font-semibold text-rose-600">{expense ? `-${yen(expense)}` : "—"}</p></div>
                <div><p className="text-gray-400">残高</p><p className={`mt-1 font-semibold ${balances[index] < 0 ? "text-rose-600" : "text-gray-700"}`}>{yen(balances[index])}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

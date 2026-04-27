import type { MonthDailyData } from "@/lib/data";
import CreditSettlementForm from "./CreditSettlementForm";

type Props = {
  data: MonthDailyData;
};

function fmt(amount: number) {
  return amount === 0 ? "¥0" : `¥${amount.toLocaleString("ja-JP")}`;
}

export default function DailyTable({ data }: Props) {
  const {
    year, month, daysInMonth,
    totalIncome, totalCashExpense,
    days, startBalance, creditSettlement,
  } = data;

  // 日ごとの残高を計算（収入 - Cash支出 - クレジット引き落とし(27日)）
  const balances: number[] = [];
  let running = startBalance;
  for (let d = 1; d <= daysInMonth; d++) {
    const entry = days[d] ?? { income: 0, cashExpense: 0, creditExpense: 0 };
    const settlement = d === 27 ? creditSettlement : 0;
    running += entry.income - entry.cashExpense - settlement;
    balances.push(running);
  }

  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="mb-8">
      <div className="text-sm font-semibold text-white bg-orange-400 px-3 py-1.5 rounded-t-md">
        {year}年{month}月
      </div>
      <div className="border border-t-0 rounded-b-md px-3 pt-2">
        <CreditSettlementForm year={year} month={month} currentAmount={creditSettlement} />
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr className="bg-orange-50">
                <th className="sticky left-0 z-10 bg-orange-50 border px-2 py-1.5 text-left font-medium w-20" />
                <th className="border px-2 py-1.5 text-right font-medium whitespace-nowrap w-24">
                  合計金額
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} className={`border px-1.5 py-1.5 text-right font-medium w-16 ${d === 27 && creditSettlement > 0 ? "bg-purple-50" : ""}`}>
                    {d}日
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 収入行 */}
              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border px-2 py-1.5 font-medium text-green-700">
                  収入
                </td>
                <td className="border px-2 py-1.5 text-right tabular-nums text-green-700 font-medium">
                  {fmt(totalIncome)}
                </td>
                {dayNumbers.map((d) => {
                  const v = days[d]?.income ?? 0;
                  return (
                    <td key={d} className="border px-1.5 py-1.5 text-right tabular-nums">
                      {v > 0
                        ? <span className="text-green-700">{fmt(v)}</span>
                        : <span className="text-gray-300">¥0</span>}
                    </td>
                  );
                })}
              </tr>

              {/* 支出行（Cash払い + 27日のクレジット引き落とし） */}
              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border px-2 py-1.5 font-medium text-red-600">
                  支出
                </td>
                <td className="border px-2 py-1.5 text-right tabular-nums text-red-600 font-medium">
                  {fmt(totalCashExpense + creditSettlement)}
                </td>
                {dayNumbers.map((d) => {
                  const v = days[d]?.cashExpense ?? 0;
                  const s = d === 27 ? creditSettlement : 0;
                  const total = v + s;
                  return (
                    <td key={d} className={`border px-1.5 py-1.5 text-right tabular-nums ${d === 27 && s > 0 ? "bg-purple-50" : ""}`}>
                      {total > 0
                        ? <span className="text-red-600">{fmt(total)}</span>
                        : <span className="text-gray-300">¥0</span>}
                    </td>
                  );
                })}
              </tr>

              {/* 残高行 */}
              <tr className="bg-gray-50 hover:bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-50 border px-2 py-1.5 font-medium">
                  残高
                </td>
                <td className="border px-2 py-1.5 text-right tabular-nums text-muted-foreground text-xs">
                  前月末: {fmt(startBalance)}
                </td>
                {dayNumbers.map((d, i) => {
                  const bal = balances[i];
                  return (
                    <td key={d} className={`border px-1.5 py-1.5 text-right tabular-nums font-medium ${d === 27 && creditSettlement > 0 ? "bg-purple-50" : ""} ${bal >= 0 ? "text-gray-800" : "text-red-600"}`}>
                      {fmt(bal)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

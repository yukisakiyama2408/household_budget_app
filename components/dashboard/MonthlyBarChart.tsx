"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DataItem = {
  month: string;
  income: number;
  expense: number;
};

type Props = {
  data: DataItem[];
};

function formatMonth(yyyymm: string) {
  const [, m] = yyyymm.split("-");
  return `${parseInt(m)}月`;
}

export default function MonthlyBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        データがありません
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, month: formatMonth(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={formatted} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) =>
            `¥${typeof value === "number" ? value.toLocaleString("ja-JP") : value}`
          }
        />
        <Legend />
        <Bar dataKey="income" name="収入" fill="#4CAF50" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="支出" fill="#FF6384" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

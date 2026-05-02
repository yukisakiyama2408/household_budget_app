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

type WeekItem = {
  label: string;
  income: number;
  expense: number;
};

export default function WeeklyBarChart({ data }: { data: WeekItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
          tick={{ fontSize: 12 }}
        />
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

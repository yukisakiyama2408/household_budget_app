"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DataItem = {
  name: string;
  amount: number;
  color: string;
};

type Props = {
  data: DataItem[];
};

export default function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        データがありません
      </div>
    );
  }

  // Recharts v3: fillをデータに含めることでCell不要
  const chartData = data.map((d) => ({ ...d, value: d.amount, fill: d.color }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        />
        <Tooltip
          formatter={(value) =>
            `¥${typeof value === "number" ? value.toLocaleString("ja-JP") : value}`
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

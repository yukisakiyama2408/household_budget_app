"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Point = {
  day: number;
  actual: number;
  average: number;
};

function yFormatter(v: number) {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  if (v >= 1000) return `¥${(v / 1000).toFixed(0)}k`;
  return `¥${v}`;
}

export default function TrendLineChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(v) => `${v}日`}
          tick={{ fontSize: 11 }}
          interval={4}
        />
        <YAxis
          tickFormatter={yFormatter}
          tick={{ fontSize: 11 }}
          width={52}
        />
        <Tooltip
          labelFormatter={(v) => `${v}日`}
          formatter={(value, name) => [
            `¥${typeof value === "number" ? value.toLocaleString("ja-JP") : value}`,
            name,
          ]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="actual"
          name="実績"
          stroke="#94a3b8"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="average"
          name="7日移動平均"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = {
  label: string;
  pace: number;
  actual: number | null;
  forecast: number | null;
};

type Props = {
  dailySpending: Record<string, number>;
  budget: number;
  startDate: string;
  endDate: string;
  today: string;
  view: "monthly" | "weekly";
  title?: string;
  showWrapper?: boolean;
};

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function buildChartData(
  dailySpending: Record<string, number>,
  budget: number,
  startDate: string,
  endDate: string,
  today: string,
  view: "monthly" | "weekly"
): ChartPoint[] {
  const dates = getDatesInRange(startDate, endDate);
  const totalDays = dates.length;

  let cumulative = 0;
  const todayIdx = dates.findIndex((d) => d === today);
  const effectiveTodayIdx = todayIdx >= 0 ? todayIdx : dates.filter((d) => d < today).length - 1;

  const points = dates.map((date, i) => {
    const dayNum = i + 1;
    const pace = totalDays > 0 ? Math.round((budget * dayNum) / totalDays) : 0;
    const isPast = date <= today;
    if (isPast) cumulative += dailySpending[date] ?? 0;

    let label: string;
    if (view === "weekly") {
      const [, m, d] = date.split("-");
      label = `${parseInt(m)}/${parseInt(d)}`;
    } else {
      const day = parseInt(date.split("-")[2]);
      const isLast = i === totalDays - 1;
      label = day === 1 || day % 5 === 0 || isLast ? String(day) : "";
    }

    return {
      date,
      label,
      pace,
      actual: isPast ? cumulative : null,
      forecast: null as number | null,
    };
  });

  // 今日以降の予測線（2日以上のデータがあれば表示）
  if (effectiveTodayIdx >= 1) {
    const cumulativeToday = points[effectiveTodayIdx].actual ?? 0;
    const avgDaily = cumulativeToday / (effectiveTodayIdx + 1);
    for (let i = effectiveTodayIdx; i < points.length; i++) {
      points[i].forecast = Math.round(cumulativeToday + (i - effectiveTodayIdx) * avgDaily);
    }
  }

  return points;
}

function fmtYen(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value != null);
  if (!items.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-2 text-xs space-y-0.5">
      <p className="font-medium text-gray-500 mb-1">{label}</p>
      {items.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}：{fmtYen(p.value!)}
        </p>
      ))}
    </div>
  );
}

export default function SpendingTrendChart({
  dailySpending,
  budget,
  startDate,
  endDate,
  today,
  view,
  title,
  showWrapper = true,
}: Props) {
  if (budget <= 0) return null;

  const data = buildChartData(dailySpending, budget, startDate, endDate, today, view);
  const hasForecast = data.some((d) => d.forecast != null);

  const maxValue = Math.max(budget, ...data.map((d) => d.forecast ?? d.actual ?? 0));
  const yMax = Math.ceil((maxValue * 1.15) / 10000) * 10000 || budget * 2;

  const yFormatter = (v: number) =>
    v === 0 ? "" : v >= 10000 ? `${v / 10000}万` : `${Math.round(v / 1000)}k`;

  const lastForecast = [...data].reverse().find((d) => d.forecast != null)?.forecast ?? 0;
  const willOverBudget = hasForecast && lastForecast > budget;
  const chartTitle = title ?? (view === "monthly" ? "今月のペース" : "今週のペース");
  const showTitleRow = showWrapper || hasForecast;

  const chartContent = (
    <div className="space-y-2">
      {showTitleRow && (
        <div className="flex items-center justify-between">
          {showWrapper && <p className="text-sm font-medium text-gray-500">{chartTitle}</p>}
          {hasForecast && (
            <p className={`text-xs font-medium${!showWrapper ? " ml-auto" : ""} ${willOverBudget ? "text-red-600" : "text-green-700"}`}>
              {willOverBudget
                ? `予算オーバー見込み（+${fmtYen(lastForecast - budget)}）`
                : "予算内に収まる見込み"}
            </p>
          )}
        </div>
      )}
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart data={data} margin={{ top: 4, right: 32, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={yFormatter}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              width={34}
              domain={[0, yMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={budget}
              stroke="#EF4444"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: "予算", position: "insideTopRight", fontSize: 10, fill: "#EF4444", dy: -4 }}
            />
            <Line
              type="monotone"
              dataKey="pace"
              name="理想ペース"
              stroke="#D1D5DB"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
            {hasForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="予測"
                stroke="#818CF8"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            )}
            <Line
              type="monotone"
              dataKey="actual"
              name="実績"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-indigo-600" />実績
        </span>
        {hasForecast && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-indigo-400" style={{ backgroundImage: "repeating-linear-gradient(to right, #818CF8 0, #818CF8 4px, transparent 4px, transparent 6px)" }} />予測
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-gray-300" style={{ backgroundImage: "repeating-linear-gradient(to right, #D1D5DB 0, #D1D5DB 4px, transparent 4px, transparent 7px)" }} />理想ペース
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-red-400" style={{ backgroundImage: "repeating-linear-gradient(to right, #EF4444 0, #EF4444 4px, transparent 4px, transparent 7px)" }} />予算上限
        </span>
      </div>
    </div>
  );

  if (!showWrapper) return chartContent;

  return (
    <div className="border rounded-md p-4">
      {chartContent}
    </div>
  );
}

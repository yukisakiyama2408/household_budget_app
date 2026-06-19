import Link from "next/link";
import type { GoalWithProgress } from "@/lib/data";

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function fmtSigned(n: number) {
  return `${n < 0 ? "-" : ""}¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type Props = {
  goals: GoalWithProgress[];
};

const DONUT_R = 44;
const DONUT_C = 2 * Math.PI * DONUT_R; // ~276.46

export default function GoalHeroCard({ goals }: Props) {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl p-5 border bg-card flex flex-col h-full" style={{ minHeight: "260px" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-[13px] font-semibold">目標の進捗</div>
          <Link href="/budget" className="text-[11px] text-muted-foreground hover:underline">
            管理 →
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">目標が設定されていません</p>
        </div>
      </div>
    );
  }

  const goal = goals[0];
  const isSavings = goal.type === "savings";
  const pct = Math.round(goal.progress * 100);
  const isOver = !goal.isOnTrack;
  const days = goal.deadline ? daysUntil(goal.deadline) : null;
  const dashOffset = DONUT_C * (1 - goal.progress);

  const strokeColor = isSavings ? "#3b82f6" : isOver ? "#ef4444" : "#22c55e";
  const textColor = strokeColor;
  const statusLabel = isSavings ? (pct >= 100 ? "達成！" : "達成中") : isOver ? "超過" : "順調";

  const remaining = Math.abs(goal.target_amount - goal.currentAmount);

  return (
    <div className="rounded-2xl p-5 border bg-card flex flex-col h-full" style={{ minHeight: "260px" }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[13px] font-semibold">目標の進捗</div>
        <Link href="/budget" className="text-[11px] text-muted-foreground hover:underline">
          管理 →
        </Link>
      </div>

      <div
        className="text-[11px] font-semibold px-2.5 py-0.5 rounded self-start mb-2"
        style={{
          background: isSavings ? "rgba(59,130,246,0.12)" : "rgba(249,115,22,0.12)",
          color: isSavings ? "#3b82f6" : "#f97316",
        }}
      >
        {isSavings ? "貯蓄" : "支出削減"}
      </div>

      <div
        className="font-semibold mb-4 leading-snug"
        style={{ fontSize: "18px", letterSpacing: "-0.3px" }}
      >
        {goal.title}
      </div>

      <div className="flex items-center gap-5 mb-4">
        <div className="relative flex-shrink-0" style={{ width: 104, height: 104 }}>
          <svg width="104" height="104">
            <circle cx="52" cy="52" r={DONUT_R} fill="none" stroke="#f1f2f6" strokeWidth="8" />
            <circle
              cx="52"
              cy="52"
              r={DONUT_R}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={DONUT_C}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 52 52)"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="tabular-nums font-bold"
              style={{ fontSize: "22px", letterSpacing: "-0.5px", color: textColor }}
            >
              {pct}%
            </div>
            <div className="text-[10px] text-muted-foreground">{statusLabel}</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            {isSavings ? "目標まであと" : isOver ? "上限を超過" : "上限まであと"}
          </div>
          <div
            className="font-bold tabular-nums mb-1"
            style={{ fontSize: "18px", letterSpacing: "-0.5px", color: textColor }}
          >
            {fmt(remaining)}
          </div>
          {days !== null && (
            <div className="text-[11px] text-muted-foreground">
              期限まで残り{" "}
              <span
                className="font-semibold"
                style={{ color: days < 0 ? "#ef4444" : days <= 30 ? "#ca8a04" : "inherit" }}
              >
                {Math.abs(days)}日
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto border-t pt-3 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">{isSavings ? "現在の残高" : "今月の支出"}</span>
          <span className="font-semibold tabular-nums">{fmtSigned(goal.currentAmount)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">目標金額</span>
          <span className="font-semibold tabular-nums">{fmt(goal.target_amount)}</span>
        </div>
      </div>
    </div>
  );
}

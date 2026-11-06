type Props = {
  balance: number;
  year: number;
  month: number;
  dateLabel: string;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function BalanceHeroCard({ balance, year, month, dateLabel }: Props) {
  const isNegative = balance < 0;

  return (
    <div
      className="rounded-2xl p-6 text-white relative overflow-hidden flex flex-col lg:flex-row lg:items-end lg:justify-between lg:gap-x-8 lg:flex-wrap"
      style={{
        background: isNegative
          ? "linear-gradient(135deg, #dc2626, #ef4444)"
          : "linear-gradient(135deg, #2c5be5, #5b7ef0)",
        boxShadow: isNegative
          ? "0 8px 30px rgba(220,38,38,0.3)"
          : "0 8px 30px rgba(44,91,229,0.3)",
      }}
    >
      <div className="flex w-full justify-between items-center mb-1.5">
        <div className="text-[11px] opacity-85" style={{ letterSpacing: "1.5px" }}>
          BALANCE · {year}年{month}月
        </div>
        <div
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          {dateLabel}
        </div>
      </div>

      <div className="mb-1.5 whitespace-nowrap text-[13px] opacity-90 lg:mb-0 lg:py-2 lg:text-base">現在の残高</div>

      <div
        className="whitespace-nowrap tabular-nums leading-none"
        style={{ fontSize: "clamp(38px,5vw,64px)", fontWeight: 700, letterSpacing: "-2.4px" }}
      >
        {isNegative ? "-" : ""}
        {fmt(balance)}
      </div>

      {/* Decorative rings */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: "-70px",
          top: "-70px",
          width: "200px",
          height: "200px",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: "-30px",
          top: "-30px",
          width: "120px",
          height: "120px",
          border: "1px solid rgba(255,255,255,0.13)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: "10px",
          top: "10px",
          width: "40px",
          height: "40px",
          background: "rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

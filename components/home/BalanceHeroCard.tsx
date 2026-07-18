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
      className="rounded-2xl p-6 text-white relative overflow-hidden flex flex-col h-full"
      style={{
        background: isNegative
          ? "linear-gradient(135deg, #dc2626, #ef4444)"
          : "linear-gradient(135deg, #2c5be5, #5b7ef0)",
        boxShadow: isNegative
          ? "0 8px 30px rgba(220,38,38,0.3)"
          : "0 8px 30px rgba(44,91,229,0.3)",
        minHeight: "260px",
      }}
    >
      <div className="flex justify-between items-center mb-1.5">
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

      <div className="mb-1.5 whitespace-nowrap text-[13px] opacity-90">現在の残高</div>

      <div
        className="mb-4 whitespace-nowrap tabular-nums leading-none"
        style={{ fontSize: "clamp(38px,5vw,64px)", fontWeight: 700, letterSpacing: "-2.4px" }}
      >
        {isNegative ? "-" : ""}
        {fmt(balance)}
      </div>

      <div className="flex-1 relative mt-auto" style={{ minHeight: "70px" }}>
        <svg
          viewBox="0 0 300 80"
          preserveAspectRatio="none"
          className="w-full h-full block absolute inset-0"
        >
          <defs>
            <linearGradient id="balHeroGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 C30,55 50,48 75,42 C100,36 125,30 150,38 C175,46 200,28 225,22 C250,16 275,18 300,12 L300,80 L0,80 Z"
            fill="url(#balHeroGrad)"
          />
          <path
            d="M0,60 C30,55 50,48 75,42 C100,36 125,30 150,38 C175,46 200,28 225,22 C250,16 275,18 300,12"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeOpacity="0.9"
          />
          <circle cx="300" cy="12" r="4" fill="#fff" />
        </svg>
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

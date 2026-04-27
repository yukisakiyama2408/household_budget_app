import { Card, CardContent } from "@/components/ui/card";

type Props = {
  income: number;
  expense: number;
  balance: number;
};

function fmt(n: number) {
  return `¥${Math.abs(n).toLocaleString("ja-JP")}`;
}

export default function SummaryCards({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card>
        <CardContent className="p-3 pt-3">
          <p className="text-xs text-muted-foreground">収入</p>
          <p className="text-sm sm:text-xl font-bold text-green-600 tabular-nums mt-0.5">
            {fmt(income)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 pt-3">
          <p className="text-xs text-muted-foreground">支出</p>
          <p className="text-sm sm:text-xl font-bold text-red-500 tabular-nums mt-0.5">
            {fmt(expense)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 pt-3">
          <p className="text-xs text-muted-foreground">収支</p>
          <p className={`text-sm sm:text-xl font-bold tabular-nums mt-0.5 ${balance >= 0 ? "text-blue-600" : "text-red-500"}`}>
            {balance < 0 ? "-" : ""}{fmt(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

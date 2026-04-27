import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  income: number;
  expense: number;
  balance: number;
};

function formatAmount(amount: number) {
  return `¥${Math.abs(amount).toLocaleString("ja-JP")}`;
}

export default function SummaryCards({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            収入
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatAmount(income)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            支出
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-500">
            {formatAmount(expense)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            収支
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-500"}`}
          >
            {balance < 0 ? "-" : ""}
            {formatAmount(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

type DataItem = {
  name: string;
  amount: number;
  color: string;
};

type Props = {
  data: DataItem[];
};

export default function CategoryTable({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        データがありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 font-medium">カテゴリ</th>
            <th className="text-right py-2 font-medium">金額</th>
            <th className="text-right py-2 font-medium">割合</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="py-2 flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                {row.name}
              </td>
              <td className="py-2 text-right tabular-nums">
                ¥{row.amount.toLocaleString("ja-JP")}
              </td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {total > 0 ? ((row.amount / total) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2">合計</td>
            <td className="py-2 text-right tabular-nums">
              ¥{total.toLocaleString("ja-JP")}
            </td>
            <td className="py-2 text-right text-muted-foreground">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

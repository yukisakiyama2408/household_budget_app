import Link from "next/link";

type Props = {
  monthlyMissing: boolean;
  weeklyMissing: boolean;
};

export default function BudgetAlertBanner({ monthlyMissing, weeklyMissing }: Props) {
  if (!monthlyMissing && !weeklyMissing) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
      {monthlyMissing && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">⚠</span>
            <span className="text-amber-800">今月の月次予算が未設定です</span>
          </div>
          <Link href="/budget" className="text-xs text-amber-700 font-medium hover:underline whitespace-nowrap flex-shrink-0">
            設定する →
          </Link>
        </div>
      )}
      {weeklyMissing && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">⚠</span>
            <span className="text-amber-800">今週の週次予算が未設定です</span>
          </div>
          <Link href="/budget?view=weekly" className="text-xs text-amber-700 font-medium hover:underline whitespace-nowrap flex-shrink-0">
            設定する →
          </Link>
        </div>
      )}
    </div>
  );
}

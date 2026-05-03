import Link from "next/link";

export default function CheckinBanner({ weekLabel }: { weekLabel: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-blue-900">今週のチェックイン</p>
        <p className="text-xs text-blue-700 mt-0.5">{weekLabel}</p>
      </div>
      <Link
        href="/checkin"
        className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
      >
        チェックインする →
      </Link>
    </div>
  );
}

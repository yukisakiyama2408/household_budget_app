import FeatureRequestBoard from "@/components/feedback/FeatureRequestBoard";
import { getFeatureRequests } from "@/lib/data";

export default async function FeatureRequestsPage() {
  const requests = await getFeatureRequests();
  const waitingCount = requests.filter((request) => request.status === "検討中").length;
  const nextCount = requests.filter((request) => request.status === "次に対応").length;
  const doneCount = requests.filter((request) => request.status === "対応済み").length;
  const resolvedMetrics = [
    { label: "受付中", value: `${waitingCount}件`, tone: "bg-indigo-50 text-indigo-700" },
    { label: "次に対応", value: `${nextCount}件`, tone: "bg-amber-50 text-amber-700" },
    { label: "対応済み", value: `${doneCount}件`, tone: "bg-teal-50 text-teal-700" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-950">改善要望</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              投稿済みの要望を確認し、投票と対応状況を見られるページです。
              新しい要望はグローバルヘッダーの「改善要望」から送信します。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[330px]">
            {resolvedMetrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border bg-white p-3">
                <p className="text-[11px] font-bold text-gray-500">{metric.label}</p>
                <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-sm font-bold ${metric.tone}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <FeatureRequestBoard requests={requests} />
      </div>
    </main>
  );
}

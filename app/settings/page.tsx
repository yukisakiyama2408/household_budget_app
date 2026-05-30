import PushSubscribeButton from "@/components/push/PushSubscribeButton";
import Link from "next/link";

const settingLinks = [
  {
    title: "カテゴリ",
    description: "収入・支出カテゴリ、色、相殺カテゴリを管理します。",
    href: "/budget?tab=categories",
  },
  {
    title: "固定費",
    description: "家賃や返済など、毎月発生する収支を管理します。",
    href: "/budget?tab=fixed",
  },
  {
    title: "目標",
    description: "貯蓄目標や支出削減目標を予算ページで確認・追加します。",
    href: "/budget",
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold">設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          アプリの運用に関わる管理項目をまとめています。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">管理</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {settingLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
            >
              <div className="text-sm font-bold text-gray-900">{item.title}</div>
              <p className="mt-2 text-xs leading-5 text-gray-500">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">プッシュ通知</h2>
        <p className="text-sm text-gray-500">
          月次・週次予算が未登録のとき、毎週月曜と毎月1日の朝9時に通知します。
        </p>
        <div className="border rounded-md p-4">
          <PushSubscribeButton />
        </div>
      </section>
    </div>
  );
}

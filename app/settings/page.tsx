import Link from "next/link";
import PushSubscribeButton from "@/components/push/PushSubscribeButton";
import LogoutButton from "@/components/auth/LogoutButton";

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold">設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          カテゴリ、通知、アカウントなど、アプリ共通の項目を管理します。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">改善要望</h2>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">要望の送信や投票、対応状況の確認ができます。</p>
          <Link href="/settings/feedback" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 hover:underline">改善要望を開く →</Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">アカウント</h2>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">この端末のログインセッションを終了します。</p>
          <LogoutButton />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">カテゴリ</h2>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">収支や予算で使うカテゴリを管理します。</p>
          <Link href="/settings/categories" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 hover:underline">カテゴリ管理を開く →</Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">固定費</h2>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">毎月の収支と月への反映は、収支の固定費画面で管理します。</p>
          <Link href="/transactions/fixed" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 hover:underline">固定費管理を開く →</Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">プッシュ通知</h2>
        <p className="text-sm text-gray-500">
          月次・週次予算が未登録のとき、毎週月曜と毎月1日の朝9時に通知します。
        </p>
        <div className="border rounded-lg bg-white p-4">
          <PushSubscribeButton />
        </div>
      </section>
    </div>
  );
}

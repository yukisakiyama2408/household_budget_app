import PushSubscribeButton from "@/components/push/PushSubscribeButton";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold">設定</h1>

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

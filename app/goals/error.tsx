"use client";

export default function GoalsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center">
        <h1 className="text-base font-bold text-red-900">目標ページを読み込めませんでした</h1>
        <p className="mt-2 text-sm text-red-700">
          一時的な通信エラーの可能性があります。時間をおいて再度お試しください。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}

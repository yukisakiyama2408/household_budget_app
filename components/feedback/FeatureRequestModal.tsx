"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { createFeatureRequest } from "@/app/actions/feature-requests";
import type { FeatureRequest } from "@/types/database";

type Props = {
  open: boolean;
  onClose: () => void;
  suggestions: Pick<FeatureRequest, "id" | "title" | "category" | "votes">[];
};

const categories = ["収支入力", "予算", "分析", "通知", "インポート", "設定", "その他"];

export default function FeatureRequestModal({ open, onClose, suggestions }: Props) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const similarRequests = useMemo(() => {
    const normalized = title.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return suggestions
      .filter((request) => {
        const target = `${request.title} ${request.category}`.toLowerCase();
        return normalized
          .split(/\s+/)
          .some((word) => word.length >= 2 && target.includes(word));
      })
      .slice(0, 2);
  }, [suggestions, title]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setLoading(true);
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const result = await createFeatureRequest(formData);
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    setSubmittedTitle(result.title ?? trimmedTitle);
    setTitle("");
    setDetail("");
    setCategory(categories[0]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/35 px-3 py-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="改善要望を閉じる"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-gray-950">改善要望を送る</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              欲しい機能や困っていることを短く送れます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedTitle && (
          <div className="border-b border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            「{submittedTitle}」を送信しました。
          </div>
        )}

        {errorMessage && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-gray-600">タイトル</span>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="例: レシート画像から自動入力したい"
              autoFocus
            />
          </label>

          {similarRequests.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-800">似ている要望があります</p>
              <div className="mt-2 space-y-2">
                {similarRequests.map((request) => (
                  <div key={request.id} className="rounded-md bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                    <span className="font-bold">{request.title}</span>
                    <span className="ml-2 text-amber-700">{request.votes}票</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-gray-600">カテゴリ</span>
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-gray-600">困っていること</span>
            <textarea
              name="detail"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              className="min-h-28 w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="今の運用で手間になっていること、欲しい画面、確認したい情報を書きます。"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!title.trim() || loading}
          >
            <Lightbulb className="h-4 w-4" />
            {loading ? "送信中..." : "送信"}
          </button>
        </form>
      </div>
    </div>
  );
}

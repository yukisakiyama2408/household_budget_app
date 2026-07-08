"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  CheckCircle2,
  CircleDot,
  Lightbulb,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";
import { voteFeatureRequest } from "@/app/actions/feature-requests";
import type { FeatureRequest, FeatureRequestStatus } from "@/types/database";

const statusStyles: Record<FeatureRequestStatus, string> = {
  検討中: "bg-gray-100 text-gray-700",
  次に対応: "bg-indigo-50 text-indigo-700",
  対応済み: "bg-teal-50 text-teal-700",
};

function getStatusIcon(status: FeatureRequestStatus) {
  if (status === "対応済み") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "次に対応") return <Sparkles className="h-4 w-4" />;
  return <CircleDot className="h-4 w-4" />;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export default function FeatureRequestBoard({ requests: initialRequests }: { requests: FeatureRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [votingIds, setVotingIds] = useState<number[]>([]);

  const visibleRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests
      .filter((request) => {
        if (!normalized) return true;
        return `${request.title} ${request.detail} ${request.category} ${request.status}`
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => b.votes - a.votes);
  }, [requests, query]);

  async function vote(id: number) {
    if (votingIds.includes(id)) return;
    setVotingIds((current) => [...current, id]);
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, votes: request.votes + 1 } : request
      )
    );
    try {
      await voteFeatureRequest(id);
    } catch {
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, votes: Math.max(0, request.votes - 1) } : request
        )
      );
    } finally {
      setVotingIds((current) => current.filter((votingId) => votingId !== id));
    }
  }

  return (
    <section className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">要望ボード</h2>
            <p className="mt-1 text-xs text-gray-500">
              投稿済みの要望を確認し、必要なものに投票できます。
            </p>
          </div>
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="要望を検索"
            />
          </label>
        </div>
      </div>

      {visibleRequests.length === 0 ? (
        <div className="px-4 py-14 text-center text-sm text-gray-500">
          {query.trim() ? "一致する要望がありません。" : "まだ改善要望がありません。"}
        </div>
      ) : (
        <div className="divide-y">
          {visibleRequests.map((request) => (
          <article key={request.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => vote(request.id)}
              disabled={votingIds.includes(request.id)}
              className="flex h-16 flex-col items-center justify-center rounded-lg border bg-gray-50 text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              aria-label={`${request.title}に投票`}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-bold tabular-nums">{request.votes}</span>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${statusStyles[request.status]}`}
                >
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                  {request.category}
                </span>
                <span className="text-xs text-gray-400">
                  {request.created_by}・{formatDate(request.created_at)}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-gray-950">{request.title}</h3>
              {request.detail && (
                <p className="mt-1 text-sm leading-6 text-gray-600">{request.detail}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  優先度の参考にします
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {request.comments_count}件のコメント
                </span>
              </div>
            </div>
          </article>
          ))}
        </div>
      )}
    </section>
  );
}

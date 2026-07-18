"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { WishlistItem } from "@/types/database";

const DISPLAY_COUNT = 3;
const ROTATION_INTERVAL = 5000;

function yen(value: number) {
  return `${value < 0 ? "-" : ""}¥${Math.abs(value).toLocaleString("ja-JP")}`;
}

export default function WishlistHeroCard({ items, balance }: { items: WishlistItem[]; balance: number }) {
  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.ceil(items.length / DISPLAY_COUNT);

  useEffect(() => {
    if (items.length <= DISPLAY_COUNT) return;
    const timer = window.setInterval(() => {
      setActivePage((current) => (current + 1) % pageCount);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [items.length, pageCount]);

  const visibleItems = useMemo(() => {
    if (items.length <= DISPLAY_COUNT) return items;
    const startIndex = activePage * DISPLAY_COUNT;
    return Array.from(
      { length: Math.min(DISPLAY_COUNT, items.length) },
      (_, offset) => items[(startIndex + offset) % items.length]
    );
  }, [activePage, items]);

  return (
    <div className="flex min-h-[260px] min-w-0 flex-col rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold">欲しいものリスト</div>
        <div className="flex items-center gap-3">
          {pageCount > 1 && (
            <div className="flex gap-1" aria-label={`${pageCount}ページ中${activePage + 1}ページ目`}>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActivePage(index)}
                  aria-label={`${index + 1}ページ目を表示`}
                  className={`h-1.5 rounded-full transition-all ${index === activePage ? "w-4 bg-indigo-500" : "w-1.5 bg-gray-200 hover:bg-gray-300"}`}
                />
              ))}
            </div>
          )}
          <Link href="/wishlist" className="text-[11px] text-muted-foreground hover:underline">管理 →</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ShoppingBag className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-muted-foreground">欲しいものはありません</p>
          <Link href="/wishlist" className="mt-3 text-xs font-bold text-indigo-600 hover:underline">追加する</Link>
        </div>
      ) : (
        <div key={activePage} className="mt-4 flex flex-1 flex-col gap-2.5 animate-in fade-in duration-500">
          {visibleItems.map((item) => {
            const percent = item.price > 0 ? Math.round((balance / item.price) * 100) : 0;
            const affordable = balance >= item.price;
            return (
              <div key={item.id} className="flex min-w-0 flex-col gap-3 rounded-xl border bg-gray-50/60 p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${affordable ? "bg-teal-50 text-teal-600" : "bg-indigo-50 text-indigo-600"}`}>
                    {affordable ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold leading-4 text-gray-900">{item.title}</p>
                  </div>
                </div>
                <div className="shrink-0 sm:w-[48%]">
                  <p className={`mb-1 text-right text-xs font-bold tabular-nums ${affordable ? "text-teal-600" : "text-indigo-600"}`}>{percent}%</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full ${affordable ? "bg-teal-500" : "bg-indigo-500"}`} style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] font-bold tabular-nums text-gray-500">{yen(item.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

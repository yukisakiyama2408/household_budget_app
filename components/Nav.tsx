"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { House, ArrowLeftRight, Wallet, ChartNoAxesCombined, Settings } from "lucide-react";
import NewEntryButton from "./NewEntryButton";

const links = [
  { href: "/", label: "ホーム", icon: House },
  { href: "/transactions", label: "収支", icon: ArrowLeftRight },
  { href: "/budget", label: "予算", icon: Wallet },
  { href: "/analysis", label: "分析", icon: ChartNoAxesCombined },
];

export default function Nav({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const settingsClass = `inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${active("/settings") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`;
  const brand = (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-bold text-indigo-600">
      <Image src="/icon.png" alt="" width={36} height={36} className="rounded-lg" />
      マネメモ
    </Link>
  );

  function primaryLinks(mobile: boolean) {
    return links.map(({ href, label, icon: Icon }) => (
      <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
        className={`${mobile ? "flex min-h-16 flex-col justify-center gap-1 text-xs" : "flex min-h-12 gap-3 rounded-lg px-3 text-sm"} relative items-center font-medium transition-colors ${active(href) ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span>{label}</span>
        {href === "/budget" && alertCount > 0 && (
          <span className={mobile ? "absolute right-1/4 top-2 h-2 w-2 rounded-full bg-red-500" : "ml-auto h-2 w-2 rounded-full bg-red-500"}>
            <span className="sr-only">未設定の予算があります</span>
          </span>
        )}
      </Link>
    ));
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r bg-white px-4 py-5 lg:flex">
        <div className="px-2">{brand}</div>
        <div className="my-6"><NewEntryButton key={pathname} /></div>
        <nav aria-label="メインナビゲーション" className="space-y-2">{primaryLinks(false)}</nav>
        <Link href="/settings" aria-current={active("/settings") ? "page" : undefined} className={`${settingsClass} mt-auto`}>
          <Settings aria-hidden="true" className="h-5 w-5" />設定
        </Link>
      </aside>
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b bg-white px-4 lg:hidden">
        {brand}
        <div className="flex items-center gap-1">
          <Link href="/settings" aria-current={active("/settings") ? "page" : undefined} className={settingsClass}>
            <Settings aria-hidden="true" className="h-5 w-5" /><span className="sr-only">設定</span>
          </Link>
          <NewEntryButton key={pathname} />
        </div>
      </header>
      <nav aria-label="メインナビゲーション" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryLinks(true)}
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import FeatureRequestModal from "@/components/feedback/FeatureRequestModal";
import type { FeatureRequest } from "@/types/database";

const links = [
  { href: "/transactions", label: "収支" },
  { href: "/budget", label: "予算" },
  { href: "/monthly", label: "分析" },
];

const settingsLink = { href: "/settings", label: "設定" };

type Props = {
  alertCount?: number;
  featureRequestSuggestions?: Pick<FeatureRequest, "id" | "title" | "category" | "votes">[];
};

export default function Nav({ alertCount = 0, featureRequestSuggestions = [] }: Props) {
  const pathname = usePathname();
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <>
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center h-16 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/" className="font-bold text-xl pl-4 pr-4 flex-shrink-0 whitespace-nowrap text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2">
            <Image src="/icon.png" alt="マネメモ" width={40} height={40} className="rounded-lg" />
            マネメモ
          </Link>
          <div className="flex items-center gap-1 pr-3">
            {links.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              const showBadge = href === "/budget" && alertCount > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3 py-2 rounded text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                  {showBadge && (
                    <span className="absolute top-1.5 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded px-3 py-2 text-base font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              改善要望
            </button>
            <Link
              href={settingsLink.href}
              className={`relative px-3 py-2 rounded text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                pathname.startsWith(settingsLink.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {settingsLink.label}
            </Link>
          </div>
        </div>
      </nav>
      <FeatureRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        suggestions={featureRequestSuggestions}
      />
    </>
  );
}

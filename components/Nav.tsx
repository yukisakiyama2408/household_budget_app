"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/monthly", label: "月次" },
  { href: "/yearly", label: "年次" },
  { href: "/daily", label: "日次" },
  { href: "/transactions", label: "収支" },
  { href: "/budget", label: "予算" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-5xl mx-auto flex items-center h-12 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <span className="font-bold text-sm pl-4 pr-3 flex-shrink-0 whitespace-nowrap">家計簿</span>
        <div className="flex items-center gap-0.5 pr-3">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                pathname === href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/monthly", label: "統計" },
  { href: "/transactions", label: "収支" },
  { href: "/budget", label: "予算" },
  { href: "/fixed", label: "固定費" },
  { href: "/checkin", label: "チェックイン" },
  { href: "/insights", label: "インサイト" },
  { href: "/goals", label: "目標" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center h-12 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Link href="/" className="font-bold text-sm pl-4 pr-3 flex-shrink-0 whitespace-nowrap hover:text-gray-600 transition-colors">家計簿</Link>
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

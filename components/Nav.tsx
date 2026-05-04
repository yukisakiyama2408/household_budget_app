"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/transactions", label: "収支" },
  { href: "/budget", label: "予算" },
  { href: "/monthly", label: "分析" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-indigo-600 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center h-16 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Link href="/" className="font-bold text-base pl-4 pr-4 flex-shrink-0 whitespace-nowrap text-white hover:text-indigo-200 transition-colors">家計簿</Link>
        <div className="flex items-center gap-1 pr-3">
          {links.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-indigo-200 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/transactions", label: "収支" },
  { href: "/budget", label: "予算" },
  { href: "/monthly", label: "分析" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center h-16 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Link href="/" className="font-bold text-xl pl-4 pr-4 flex-shrink-0 whitespace-nowrap text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2">
          <Image src="/icon.png" alt="マネメモ" width={40} height={40} className="rounded-lg" />
          マネメモ
        </Link>
        <div className="flex items-center gap-1 pr-3">
          {links.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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

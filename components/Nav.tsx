"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "月次" },
  { href: "/yearly", label: "年次" },
  { href: "/daily", label: "日次" },
  { href: "/transactions", label: "収支" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-12">
        <span className="font-bold text-base mr-4">家計簿</span>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

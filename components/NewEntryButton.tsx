"use client";

import { transactionEntryHref, transactionImportHref } from "@/lib/transactions/entry-links";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

export default function NewEntryButton({ returnTo }: { returnTo?: string }) {
  const [destination, setDestination] = useState("/transactions");
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setDestination(returnTo ?? `${window.location.pathname}${window.location.search}`);
          setOpen((v) => !v);
        }}
        className="min-h-11 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
      >
        + 新規登録
      </button>

      {open && (
        <div id={menuId} className="absolute right-0 lg:left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <Link
            href={transactionEntryHref("new", destination)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            手入力
          </Link>
          <Link
            href={transactionImportHref(destination)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            CSVをアップロード
          </Link>
        </div>
      )}
    </div>
  );
}

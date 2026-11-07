"use client";

import { useRef, useState } from "react";
import FeatureRequestModal from "./FeatureRequestModal";
import type { FeatureRequest } from "@/types/database";

export default function FeatureRequestLauncher({ suggestions }: { suggestions: Pick<FeatureRequest, "id" | "title" | "category" | "votes">[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700">改善要望を送る</button>
      <FeatureRequestModal open={open} onClose={() => { setOpen(false); trigger.current?.focus(); }} suggestions={suggestions} />
    </>
  );
}

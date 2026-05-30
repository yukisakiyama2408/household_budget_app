import { createClient } from "@/utils/supabase/server";
import ImportTabs from "@/components/import/ImportTabs";
import type { Category } from "@/types/database";
import Link from "next/link";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">CSVインポート</h1>
          <p className="mt-1 text-sm text-gray-500">
            CSVを読み込み、カテゴリや重複候補を確認してから取引として登録します。
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
        >
          手入力で登録
        </Link>
      </div>
      <ImportTabs categories={(categories ?? []) as Category[]} />
    </div>
  );
}

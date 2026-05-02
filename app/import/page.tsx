import { createClient } from "@/utils/supabase/server";
import CsvImportForm from "@/components/import/CsvImportForm";
import type { Category } from "@/types/database";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-lg font-semibold mb-6">CSVインポート</h1>
      <CsvImportForm categories={(categories ?? []) as Category[]} />
    </div>
  );
}

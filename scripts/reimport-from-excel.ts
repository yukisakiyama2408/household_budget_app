import * as path from "path";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const CATEGORY_MAP: Record<string, string> = {
  クレジット引き落とし: "その他",
};

function toDateStr(val: unknown): string {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "number") {
    // ExcelのシリアルDate
    const date = XLSX.SSF.parse_date_code(val);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  return String(val);
}

async function main() {
  // カテゴリマップ取得
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name");
  if (catError) throw new Error(`カテゴリ取得失敗: ${catError.message}`);

  const categoryMap = new Map<string, number>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (categories as any[]).map((c: any) => [c.name, c.id])
  );

  // Excelを読み込む
  const filePath = path.join(__dirname, "../家計簿（回答）.xlsx");
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets["フォームの回答 1"];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    header: ["timestamp", "date", "content", "category", "amount", "payMethod", "store", "type", "extra"],
    defval: null,
    range: 1, // ヘッダー行スキップ
  });

  console.log(`Excel行数: ${rawRows.length}`);

  const records = [];
  const skipped = [];

  for (const row of rawRows) {
    const typeRaw = row["type"];
    if (typeRaw !== "収入" && typeRaw !== "支出") {
      skipped.push(row);
      continue;
    }
    const amount = row["amount"];
    if (typeof amount !== "number" || amount <= 0) {
      skipped.push(row);
      continue;
    }

    const type = typeRaw === "収入" ? "income" : "expense";
    const csvCategory = (row["category"] as string | null)?.trim() ?? "";
    const mappedCategory = CATEGORY_MAP[csvCategory] ?? csvCategory;
    const category_id = mappedCategory
      ? (categoryMap.get(mappedCategory) ?? null)
      : null;

    const payMethodRaw = (row["payMethod"] as string | null)?.trim();
    const pay_method =
      payMethodRaw === "Credit" || payMethodRaw === "Cash"
        ? payMethodRaw
        : null;

    const storeRaw = row["store"] != null ? String(row["store"]).trim() : null;

    records.push({
      date: toDateStr(row["date"]),
      content: ((row["content"] as string) ?? "").trim(),
      category_id,
      amount: Math.round(amount),
      type,
      pay_method,
      store: storeRaw || null,
    });
  }

  console.log(`インポート対象: ${records.length}件 / スキップ: ${skipped.length}件`);

  // 既存データを削除
  console.log("既存データを削除中...");
  const { error: delError } = await supabase
    .from("transactions")
    .delete()
    .gte("id", 0);
  if (delError) throw new Error(`削除失敗: ${delError.message}`);

  // バッチ挿入
  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("transactions") as any).insert(batch);
    if (error) throw new Error(`挿入失敗 (${i}件目〜): ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r${inserted}/${records.length}件 完了`);
  }

  console.log("\n✅ 再インポート完了");
}

main().catch((e) => {
  console.error("❌ エラー:", e.message);
  process.exit(1);
});

import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

// .envを手動でロード（tsx実行時はdotenvが不要な場合もあるが念のため）
import "dotenv/config";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// CSVカテゴリ名 → DBカテゴリ名 のマッピング（差異があるもののみ記載）
const CATEGORY_MAP: Record<string, string> = {
  クレジット引き落とし: "その他",
};

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/[¥,\s]/g, ""), 10);
}

function parseDate(raw: string): string {
  // "2023/07/20" → "2023-07-20"
  return raw.trim().replace(/\//g, "-");
}

async function main() {
  // カテゴリ一覧を取得してname→idのマップを作る
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name");

  if (catError) throw new Error(`カテゴリ取得失敗: ${catError.message}`);

  const categoryMap = new Map<string, number>(
    (categories as { id: number; name: string }[]).map((c) => [c.name, c.id])
  );

  // CSVを読み込む
  const csvPath = path.join(
    __dirname,
    "../original_data/家計簿（回答） のコピー - フォームの回答 1.csv"
  );
  const csvText = fs.readFileSync(csvPath, "utf-8");

  const { data: rows } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const records = [];
  const skipped = [];

  for (const row of rows) {
    const typeRaw = row["収支別"]?.trim();
    if (typeRaw !== "収入" && typeRaw !== "支出") {
      skipped.push(row);
      continue;
    }

    const amountRaw = row["金額"]?.trim();
    const amount = parseAmount(amountRaw);
    if (isNaN(amount) || amount <= 0) {
      skipped.push(row);
      continue;
    }

    const type = typeRaw === "収入" ? "income" : "expense";

    // カテゴリをマッピング
    const csvCategory = row["カテゴリ"]?.trim();
    const mappedCategory = CATEGORY_MAP[csvCategory] ?? csvCategory;
    const category_id = mappedCategory
      ? (categoryMap.get(mappedCategory) ?? null)
      : null;

    const payMethodRaw = row["Credit/Cash"]?.trim();
    const pay_method =
      payMethodRaw === "Credit" || payMethodRaw === "Cash"
        ? payMethodRaw
        : null;

    records.push({
      date: parseDate(row["日付"]),
      content: row["内容"]?.trim(),
      category_id,
      amount,
      type,
      pay_method,
      store: row["店舗"]?.trim() || null,
    });
  }

  console.log(`インポート対象: ${records.length}件`);
  console.log(`スキップ: ${skipped.length}件`);

  // 100件ずつバッチ挿入
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("transactions").insert(batch as any);
    if (error) throw new Error(`挿入失敗 (${i}件目〜): ${error.message}`);
    inserted += batch.length;
    console.log(`${inserted}/${records.length}件 完了`);
  }

  console.log("✅ インポート完了");
}

main().catch((e) => {
  console.error("❌ エラー:", e.message);
  process.exit(1);
});

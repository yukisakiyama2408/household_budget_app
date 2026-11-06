type DuplicateRow = { date: string; amount: number; store: string | null };
type DuplicateIndex = Map<string, Set<string>>;

export function buildDuplicateIndex(rows: DuplicateRow[]): DuplicateIndex {
  const index: DuplicateIndex = new Map();
  for (const row of rows) {
    if (Number.isNaN(row.amount)) continue;
    const key = `${row.date}:${row.amount}`;
    let stores = index.get(key);
    if (!stores) {
      stores = new Set();
      index.set(key, stores);
    }
    if (row.store) stores.add(row.store);
  }
  return index;
}

export function getDuplicateLevel(index: DuplicateIndex, row: DuplicateRow): "high" | "low" | null {
  if (Number.isNaN(row.amount)) return null;
  const stores = index.get(`${row.date}:${row.amount}`);
  if (!stores) return null;
  return row.store && stores.has(row.store) ? "high" : "low";
}

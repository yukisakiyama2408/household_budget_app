"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import type { Category, CategoryType } from "@/types/database";

const TYPE_LABELS: Record<CategoryType, string> = {
  income: "収入",
  expense: "支出",
  both: "両方",
};

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
  "#6B7280", "#111827",
];

function ColorPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [color, setColor] = useState(defaultValue ?? PRESET_COLORS[5]);
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={color} />
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border border-gray-300"
          title="カスタムカラー"
        />
      </div>
    </div>
  );
}

function CategoryCard({ cat, onEdit }: { cat: Category; onEdit: (cat: Category) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`「${cat.name}」を削除しますか？\n取引に使用されている場合は削除できません。`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCategory(cat.id);
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col">
      <div className="h-10" style={{ backgroundColor: cat.color ?? "#B3B3B3" }} />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
        <div className="flex items-center gap-3 mt-auto pt-1">
          <button
            onClick={() => onEdit(cat)}
            className="text-xs text-indigo-600 hover:underline"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 hover:underline disabled:opacity-50"
          >
            削除
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setSaving(true);
    await createCategory(new FormData(e.currentTarget));
    setAdding(false);
    setSaving(false);
  }

  async function handleUpdate(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    await updateCategory(editTarget.id, new FormData(e.currentTarget));
    setEditTarget(null);
    setSaving(false);
  }

  const modal = editTarget || adding ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) { setEditTarget(null); setAdding(false); } }}
    >
      <form
        onSubmit={editTarget ? handleUpdate : handleCreate}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">{editTarget ? "カテゴリを編集" : "カテゴリを追加"}</p>
          <button type="button" onClick={() => { setEditTarget(null); setAdding(false); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">名前</label>
          <input
            name="name"
            required
            defaultValue={editTarget?.name ?? ""}
            placeholder="例：食費"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">種別</label>
          <select
            name="type"
            defaultValue={editTarget?.type ?? "expense"}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
            <option value="both">両方</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">色</label>
          <ColorPicker name="color" defaultValue={editTarget?.color} />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => { setEditTarget(null); setAdding(false); }}
            className="px-5 py-2.5 border text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{categories.length}件</p>
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            + カテゴリを追加
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-center py-16 text-sm text-gray-400">カテゴリがありません</p>
        ) : (
          <div className="space-y-6">
            {(["expense", "income", "both"] as const).map((type) => {
              const items = categories.filter((c) => c.type === type);
              if (items.length === 0) return null;
              return (
                <div key={type} className="space-y-2">
                  <p className="text-lg font-bold text-gray-700">{TYPE_LABELS[type]}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {items.map((cat) => (
                      <CategoryCard key={cat.id} cat={cat} onEdit={setEditTarget} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal}
    </>
  );
}

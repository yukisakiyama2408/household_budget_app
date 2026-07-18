"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ExternalLink, Link2, Pencil, Plus, ShoppingBag, Wallet, X } from "lucide-react";
import {
  createWishlistItem,
  markWishlistItemPurchased,
  restoreWishlistItem,
  updateWishlistItem,
} from "@/app/actions/wishlist";
import type { WishlistItem, WishlistPriority } from "@/types/database";

const priorityLabels: Record<WishlistPriority, string> = {
  next: "次に買う", high: "優先度 高", medium: "優先度 中", low: "優先度 低", "": "",
};
const priorityStyles: Record<WishlistPriority, string> = {
  next: "bg-rose-50 text-rose-700", high: "bg-orange-50 text-orange-700",
  medium: "bg-amber-50 text-amber-700", low: "bg-gray-100 text-gray-600", "": "",
};

function yen(value: number) {
  return `${value < 0 ? "-" : ""}¥${Math.abs(value).toLocaleString("ja-JP")}`;
}

type Props = { initialItems: WishlistItem[]; balance: number };

export default function WishlistView({ initialItems, balance }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [purchasingIds, setPurchasingIds] = useState<number[]>([]);
  const [recentlyPurchased, setRecentlyPurchased] = useState<WishlistItem | null>(null);
  const [actionError, setActionError] = useState("");

  const affordableCount = useMemo(() => items.filter((item) => balance >= item.price).length, [balance, items]);

  function openAddForm() {
    setEditingItem(null);
    setFormError("");
    setFormOpen(true);
  }
  function openEditForm(item: WishlistItem) {
    setEditingItem(item);
    setFormError("");
    setFormOpen(true);
  }
  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingItem(null);
    setFormError("");
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const formData = new FormData(event.currentTarget);
    try {
      if (editingItem) {
        const updatedItem = await updateWishlistItem(editingItem.id, formData);
        setItems((current) => current.map((item) => item.id === updatedItem.id ? updatedItem : item));
      } else {
        const createdItem = await createWishlistItem(formData);
        setItems((current) => [createdItem, ...current]);
      }
      setFormOpen(false);
      setEditingItem(null);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  async function purchase(item: WishlistItem) {
    if (purchasingIds.includes(item.id)) return;
    setActionError("");
    setPurchasingIds((current) => [...current, item.id]);
    try {
      await Promise.all([
        markWishlistItemPurchased(item.id),
        new Promise((resolve) => window.setTimeout(resolve, 650)),
      ]);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setRecentlyPurchased(item);
      router.refresh();
    } catch {
      setActionError("購入済みに変更できませんでした。もう一度お試しください。");
    } finally {
      setPurchasingIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function undoPurchase() {
    if (!recentlyPurchased) return;
    const item = recentlyPurchased;
    setRecentlyPurchased(null);
    await restoreWishlistItem(item.id);
    setItems((current) => [item, ...current]);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faff_0%,#f9fafb_38%,#f9fafb_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">欲しいものリスト</h1>
          <button type="button" onClick={openAddForm} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />欲しいものを追加
          </button>
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200"><Wallet className="h-6 w-6" /></div>
              <div><p className="text-xs font-bold text-gray-500">現在の残高</p><p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-gray-950">{yen(balance)}</p></div>
            </div>
            <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800"><span className="font-bold">{affordableCount}件</span><span className="ml-1 text-xs">は今の残高で購入できます</span></div>
          </div>
        </section>

        {items.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const rawPercent = item.price > 0 ? Math.round((balance / item.price) * 100) : 0;
              const barPercent = Math.max(0, Math.min(rawPercent, 100));
              const affordable = balance >= item.price;
              const isPurchasing = purchasingIds.includes(item.id);
              return (
                <article key={item.id} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-500 ${isPurchasing ? "scale-[0.98] border-teal-300 opacity-60 shadow-none" : ""}`}>
                  <div className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-teal-50/95 transition-all duration-300 ${isPurchasing ? "opacity-100" : "opacity-0"}`}>
                    <div className={`flex flex-col items-center text-teal-700 transition-all duration-500 ${isPurchasing ? "scale-100" : "scale-75"}`}><CheckCircle2 className="h-10 w-10" /><p className="mt-2 text-sm font-bold">購入済みにしました</p></div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${affordable ? "bg-teal-50 text-teal-600" : "bg-indigo-50 text-indigo-600"}`}>{affordable ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-bold text-gray-950">{item.title}</h2>{item.priority && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityStyles[item.priority]}`}>{priorityLabels[item.priority]}</span>}</div>
                        <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-gray-900">{yen(item.price)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button type="button" onClick={() => openEditForm(item)} aria-label={`${item.title}を編集`} className="rounded-lg border p-2 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                      <a href={item.url} target="_blank" rel="noreferrer" aria-label={`${item.title}の商品ページを開く`} className="rounded-lg border p-2 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><ExternalLink className="h-4 w-4" /></a>
                    </div>
                  </div>
                  {item.memo && <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">{item.memo}</p>}
                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between gap-3"><p className="text-[11px] font-bold text-gray-400">購入可能度</p><p className={`text-sm font-bold tabular-nums ${affordable ? "text-teal-600" : "text-indigo-600"}`}>{rawPercent}%</p></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${affordable ? "bg-teal-500" : "bg-indigo-500"}`} style={{ width: `${barPercent}%` }} /></div>
                    <div className="mt-2 flex justify-between text-[11px] text-gray-400"><span>残高 {yen(balance)}</span><span>価格 {yen(item.price)}</span></div>
                  </div>
                  <button type="button" onClick={() => purchase(item)} disabled={isPurchasing} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 text-xs font-bold text-teal-700 hover:bg-teal-100 disabled:cursor-wait"><Check className="h-4 w-4" />購入済みにする</button>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed bg-white px-4 py-14 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-gray-300" /><p className="mt-3 text-sm font-bold text-gray-700">欲しいものはありません</p><p className="mt-1 text-xs text-gray-400">新しく見つけたものを追加してみましょう。</p></div>
        )}
        {actionError && <p className="mt-4 text-center text-xs font-bold text-red-600" role="alert">{actionError}</p>}
      </div>

      {recentlyPurchased && <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-xl"><span className="min-w-0 truncate">「{recentlyPurchased.title}」を購入済みにしました</span><button type="button" onClick={undoPurchase} className="shrink-0 text-xs font-bold text-indigo-300 hover:text-indigo-200">元に戻す</button></div>}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <form key={editingItem?.id ?? "new"} onSubmit={saveItem} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-gray-950">{editingItem ? "欲しいものを編集" : "欲しいものを追加"}</h2><p className="mt-1 text-xs text-gray-500">商品情報を入力してください。</p></div><button type="button" onClick={closeForm} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label="閉じる"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5"><span className="text-xs font-bold text-gray-600">タイトル</span><input name="title" required maxLength={120} defaultValue={editingItem?.title ?? ""} className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-gray-600">金額</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span><input name="price" required type="number" min="1" inputMode="numeric" defaultValue={editingItem?.price ?? ""} className="h-10 w-full rounded-lg border pl-7 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></div></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-gray-600">URL</span><div className="relative"><Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input name="url" required type="url" defaultValue={editingItem?.url ?? ""} className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></div></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-gray-600">メモ <span className="font-normal text-gray-400">（任意）</span></span><textarea name="memo" rows={3} maxLength={300} defaultValue={editingItem?.memo ?? ""} className="w-full resize-none rounded-lg border px-3 py-2 text-sm leading-5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-bold text-gray-600">優先度 <span className="font-normal text-gray-400">（任意）</span></span><select name="priority" defaultValue={editingItem?.priority ?? ""} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">未設定</option><option value="next">次に買う</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label>
            </div>
            {formError && <p className="mt-4 text-xs font-bold text-red-600" role="alert">{formError}</p>}
            <div className="mt-6 flex gap-3"><button type="button" onClick={closeForm} disabled={saving} className="h-10 flex-1 rounded-lg border text-sm font-bold text-gray-600 hover:bg-gray-50">キャンセル</button><button type="submit" disabled={saving} className="h-10 flex-1 rounded-lg bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "保存中…" : editingItem ? "変更を保存" : "追加する"}</button></div>
          </form>
        </div>
      )}
    </main>
  );
}

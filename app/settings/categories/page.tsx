import Link from "next/link";
import CategoryManager from "@/components/categories/CategoryManager";
import { getCategories } from "@/lib/data";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/settings" className="inline-flex min-h-11 items-center text-sm text-indigo-600 hover:underline">← 設定に戻る</Link>
      <div>
        <h1 className="text-xl font-bold">カテゴリ管理</h1>
        <p className="mt-1 text-sm text-gray-500">収支・予算・固定費で使うカテゴリを追加・編集します。</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}

import WishlistView from "@/components/wishlist/WishlistView";
import { getCurrentBalance, getWishlistItems } from "@/lib/data";

export default async function WishlistPage() {
  const [balance, items] = await Promise.all([getCurrentBalance(), getWishlistItems()]);
  return <WishlistView initialItems={items} balance={balance} />;
}

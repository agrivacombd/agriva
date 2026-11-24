import Link from "next/link";
import PlantWishlistClient from "@/components/plant-market/PlantWishlistClient";
export const metadata = { title: "আমার Wishlist | AGRIVA Plant Market", robots: { index: false, follow: false } };
export default function PlantWishlistPage() {
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-6xl"><Link href="/plant-market" className="font-bold text-emerald-800 underline">← Plant Market</Link><h1 className="mt-4 text-3xl font-black">আমার Wishlist ❤️</h1><p className="mt-2 text-sm text-slate-600">এই তালিকা আপনার বর্তমান browser-এ সংরক্ষিত থাকে।</p><div className="mt-6"><PlantWishlistClient/></div></div></main>;
}

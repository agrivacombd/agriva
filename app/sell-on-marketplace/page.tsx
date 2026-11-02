import type { Metadata } from "next";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";
export const metadata: Metadata = {
  title: "Marketplace Seller হন | AGRIVA",
  description: "বীজ, সার, কৃষি উপকরণ ও কৃষিপণ্য বিক্রির জন্য AGRIVA Marketplace Seller হিসেবে আলাদাভাবে আবেদন করুন।",
  alternates: { canonical: "/sell-on-marketplace" },
};
export default function SellOnMarketplacePage() {
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-12 text-[#17351f] sm:px-6">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_.9fr]">
      <section><a href="/marketplace" className="font-bold text-emerald-800">← Marketplace</a><p className="mt-8 text-xs font-black uppercase tracking-widest text-emerald-700">Marketplace Seller Application</p><h1 className="mt-3 text-4xl font-black">AGRIVA Marketplace-এ ব্যবসার পণ্য বিক্রি করুন</h1><p className="mt-5 leading-8 text-slate-600">কৃষি উপকরণ, বীজ, সার, ফসল সুরক্ষা পণ্য, যন্ত্রপাতি ও প্যাকেটজাত কৃষিপণ্যের ব্যবসায়ীরা আবেদন করতে পারবেন। এই অনুমোদন শুধু Marketplace-এর জন্য; Plant Market-এর জন্য আলাদা আবেদন প্রয়োজন।</p><ul className="mt-6 space-y-3 text-sm text-slate-700"><li>✓ ব্যবসার তথ্য ও যোগাযোগ যাচাই</li><li>✓ আলাদা Marketplace Seller permission</li><li>✓ অনুমোদনের পর Marketplace Product Dashboard</li><li>✓ Plant Market permission স্বয়ংক্রিয়ভাবে দেওয়া হবে না</li></ul></section>
      <section><h2 className="mb-2 text-2xl font-black">Seller হওয়ার আবেদন</h2><p className="mb-4 text-sm text-slate-600"><a className="font-bold text-emerald-800 underline" href="/login?next=/sell-on-marketplace">আবেদনের আগে লগইন করুন</a></p><SellerApplicationForm market="marketplace"/></section>
    </div>
  </main>;
}
import type { Metadata } from "next";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";
export const metadata: Metadata = {
  title: "Plant Market Seller হন | AGRIVA",
  description: "নার্সারি, গাছ ও চারার উৎপাদক এবং বাগান সামগ্রীর বিক্রেতারা AGRIVA Plant Market Seller হিসেবে আলাদাভাবে আবেদন করুন।",
  alternates: { canonical: "/sell-on-plant-market" },
};
export default function SellOnPlantMarketPage() {
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-12 text-[#17351f] sm:px-6">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_.9fr]">
      <section><a href="/plant-market" className="font-bold text-emerald-800">← Plant Market</a><p className="mt-8 text-xs font-black uppercase tracking-widest text-emerald-700">Plant Market Seller Application</p><h1 className="mt-3 text-4xl font-black">AGRIVA Plant Market-এ গাছ ও চারা বিক্রি করুন</h1><p className="mt-5 leading-8 text-slate-600">নার্সারি, ফল-ফুলের চারা উৎপাদক, ইনডোর প্ল্যান্ট, ক্যাকটাস, সাকুলেন্ট, টব, মাটি ও বাগানের উপকরণ বিক্রেতারা আবেদন করতে পারবেন। এই অনুমোদন শুধু Plant Market-এর জন্য; Marketplace-এর জন্য আলাদা আবেদন প্রয়োজন।</p><ul className="mt-6 space-y-3 text-sm text-slate-700"><li>✓ নার্সারি / ব্যবসার তথ্য যাচাই</li><li>✓ আলাদা Plant Seller permission</li><li>✓ নিজস্ব Plant Product Dashboard</li><li>✓ Marketplace permission স্বয়ংক্রিয়ভাবে দেওয়া হবে না</li></ul></section>
      <section><h2 className="mb-2 text-2xl font-black">Plant Seller হওয়ার আবেদন</h2><p className="mb-4 text-sm text-slate-600"><a className="font-bold text-emerald-800 underline" href="/login?next=/sell-on-plant-market">আবেদনের আগে লগইন করুন</a></p><SellerApplicationForm market="plant-market"/></section>
    </div>
  </main>;
}
import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import MobileDashboardNav from "@/components/MobileDashboardNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AGRIVA Marketplace | Premium Food & Grains ও কৃষিপণ্য",
  description: "AGRIVA Marketplace-এ কৃষিপণ্যের পাশাপাশি Premium Food & Grains বিভাগে চিয়া সিড, কালো চাল, লাল চাল ও ব্রাউন রাইসের পণ্য দেখুন। মূল্য ও স্টক পণ্যভেদে যাচাই করুন।",
  alternates: { canonical: "/marketplace" },
  keywords: ["কৃষি পণ্য", "কৃষি পণ্যের মার্কেটপ্লেস", "কৃষি বীজ", "কৃষি সার", "কৃষি যন্ত্রপাতি", "বাংলাদেশ কৃষি পণ্য", "Premium Food & Grains", "black rice", "red rice", "brown rice", "chia seeds"],
  openGraph: { title: "AGRIVA Marketplace | কৃষি পণ্য এক জায়গায়", description: "কৃষিপণ্য এবং Premium Food & Grains বিভাগের পণ্যের তথ্য দেখুন।", type: "website", locale: "bn_BD" },
};

export default async function MarketplacePage() {
  let products: MarketplaceProduct[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products")
      .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,image_variants,seo_image_alt_texts")
      .eq("status", "active")
      .order("created_at", { ascending: false }).limit(120);
    if (!error && data) products = data as MarketplaceProduct[];
  } catch (error) {
    console.error("Marketplace catalogue load failed:", error);
  }

  return <main className="min-h-screen overflow-hidden bg-[#f5f8f1] pb-28 text-[#17351f] md:pb-0">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 h-80 w-80 rounded-full border-[48px] border-white/10" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide"><span className="h-2 w-2 rounded-full bg-lime-300" /> AGRIVA MARKETPLACE</p>
        <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">বাংলাদেশের কৃষি পণ্য <span className="text-lime-300">এক জায়গায়</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg sm:leading-8">কোম্পানি ও ব্যবসায়িক বিক্রেতাদের বীজ, সার, ফসল সুরক্ষা, কৃষি যন্ত্রপাতি এবং প্যাকেটজাত কৃষিপণ্য ক্যাটাগরি অনুযায়ী খুঁজুন। পণ্যের বিবরণ, মূল্য ও মজুত দেখে সিদ্ধান্ত নিন।</p>
        <a href="#catalogue" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#145b3c]">পণ্য খুঁজুন ↓</a>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-50/75 sm:text-sm"><span>✓ ক্যাটাগরি অনুযায়ী ব্রাউজ</span><span>✓ মোবাইল-ফ্রেন্ডলি</span><span>✓ অনুমোদিত পণ্য</span></div>
      </div>
    </section>
    <section aria-label="কৃষক ও ক্রেতার দ্রুত প্রবেশ" className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
      <article className="flex flex-col items-start rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">কৃষকদের জন্য</span>
        <h2 className="mt-3 text-xl font-black">নিজের ফসল সরাসরি বিক্রি করুন</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">ফসলের ছবি, পরিমাণ, দাম ও অবস্থান দিয়ে পোস্ট করুন। অনুমোদনের পর ক্রেতারা আপনার ফসল দেখতে পারবেন।</p>
        <Link href="/sell-harvest" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-900">Sell Harvest-এ যান →</Link>
      </article>
      <article className="flex flex-col items-start rounded-2xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800">কোম্পানি ও ব্যবসায়ীদের জন্য</span>
        <h2 className="mt-3 text-xl font-black">Marketplace-এ পণ্য বিক্রি করুন</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">আপনার ব্যবসার কৃষি উপকরণ ও প্যাকেটজাত পণ্য জমা দিন। যাচাই ও অনুমোদনের পর পণ্য Marketplace-এ প্রকাশ হবে।</p>
        <Link href="/seller/products/new" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">বিক্রেতা হিসেবে পণ্য যোগ করুন →</Link>
      </article>
      <article className="flex flex-col items-start rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">ক্রেতাদের জন্য</span>
        <h2 className="mt-3 text-xl font-black">আপনার প্রয়োজনীয় পণ্যের চাহিদা জানান</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">কোন পণ্য, কত পরিমাণ এবং কোথায় প্রয়োজন—চাহিদা বোর্ডে পোস্ট করে সরবরাহকারীদের সঙ্গে যোগাযোগের সুযোগ নিন।</p>
        <Link href="/buyer-demands" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">চাহিদা বোর্ড দেখুন →</Link>
      </article>
    </section>

    <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-7"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Find what you need</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">কৃষি পণ্য খুঁজুন</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">ক্যাটাগরি বেছে নিন অথবা পণ্যের নাম লিখে খুঁজুন।</p></div>
      <MarketplaceCore products={products} />
      {!products.length && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য পাওয়া যায়নি। নতুন পণ্য অনুমোদিত হলে এখানে দেখা যাবে।</p>}
    </section>
    <MobileDashboardNav active="marketplace" />
  </main>;
}

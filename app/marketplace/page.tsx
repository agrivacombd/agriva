import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import MobileDashboardNav from "@/components/MobileDashboardNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AGRIVA Marketplace | কৃষি পণ্য, বীজ, সার ও কৃষি উপকরণ",
  description: "বাংলাদেশের কৃষি পণ্য এক জায়গায় খুঁজুন। বীজ, সার, ফসল সুরক্ষা, কৃষিযন্ত্র, ফসল ও প্রিমিয়াম খাদ্যশস্যের পণ্যের দাম, মজুত ও বিবরণ দেখুন।",
  alternates: { canonical: "/marketplace" },
  keywords: ["কৃষি পণ্য", "কৃষি মার্কেটপ্লেস", "কৃষি বীজ", "কৃষি সার", "কৃষি যন্ত্রপাতি", "বাংলাদেশ কৃষি পণ্য", "ফসল", "চারা", "Premium Food & Grains"],
  openGraph: { title: "AGRIVA Marketplace | কৃষি পণ্য এক জায়গায়", description: "বীজ, সার, কৃষিযন্ত্র ও কৃষিপণ্য খুঁজুন এবং বিক্রেতার সঙ্গে যোগাযোগ করুন।", type: "website", locale: "bn_BD" },
};

export default async function MarketplacePage({ searchParams }: { searchParams?: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === "string" ? params.q : "";
  let products: MarketplaceProduct[] = [];
  let catalogueUnavailable = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products")
      .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false }).limit(120);
    if (error) {
      catalogueUnavailable = true;
      console.error("Marketplace catalogue query failed:", error.message);
    } else if (data) {
      products = data as MarketplaceProduct[];
    }
  } catch (error) {
    catalogueUnavailable = true;
    console.error("Marketplace catalogue load failed:", error);
  }

  return <main className="min-h-screen overflow-hidden bg-[#f5f8f1] pb-28 text-[#17351f] md:pb-0">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 h-80 w-80 rounded-full border-[48px] border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-64 w-64 rounded-full border-[36px] border-lime-200/10" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide"><span className="h-2 w-2 rounded-full bg-lime-300" /> AGRIVA MARKETPLACE</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">কৃষির প্রয়োজনীয় সবকিছু <span className="text-lime-300">এক জায়গায়</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-lg sm:leading-8">বীজ, সার, ফসল সুরক্ষা, কৃষিযন্ত্র, ফসল ও কৃষিপণ্য সহজে খুঁজুন। পণ্যের দাম ও মজুত যাচাই করে বিক্রেতার সঙ্গে যোগাযোগ করুন।</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#catalogue" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#145b3c]">পণ্য খুঁজুন <span aria-hidden="true" className="ml-2">↓</span></a>
          <Link href="/buyer-demands" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">পণ্য না পেলে চাহিদা জানান</Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-50/80 sm:text-sm"><span>✓ ক্যাটাগরি অনুযায়ী খুঁজুন</span><span>✓ দাম ও মজুত দেখুন</span><span>✓ বিক্রেতার সঙ্গে যোগাযোগ</span></div>
      </div>
    </section>

    <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-5 sm:mb-7"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Discover products</p><h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">আপনার প্রয়োজনীয় পণ্য খুঁজুন</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">সার্চ করুন, ক্যাটাগরি বেছে নিন অথবা দাম অনুযায়ী পণ্য সাজান।</p></div>
      <MarketplaceCore products={products} initialQuery={initialQuery} />
      {catalogueUnavailable && <p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">এই মুহূর্তে পণ্যের তালিকা লোড করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>}
      {!catalogueUnavailable && !products.length && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য পাওয়া যায়নি। পণ্য অনুমোদিত হলে এখানে দেখা যাবে। এর মধ্যে আপনার প্রয়োজন চাহিদা বোর্ডে জানাতে পারেন।</p>}
    </section>

    <section aria-label="বিক্রেতা ও ক্রেতাদের জন্য সেবা" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-4"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Grow with AGRIVA</p><h2 className="mt-1.5 text-xl font-black sm:text-2xl">কেনা-বেচায় আরও সুযোগ</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="flex flex-col items-start rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">কৃষকদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">নিজের ফসল সরাসরি বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">ফসলের ছবি, পরিমাণ, দাম ও অবস্থান দিয়ে পোস্ট করুন। অনুমোদনের পর ক্রেতারা আপনার ফসল দেখতে পারবেন।</p>
          <Link href="/sell-harvest" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-900">ফসল বিক্রি করুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800">কোম্পানি ও ব্যবসায়ীদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">Marketplace-এ পণ্য বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">কৃষি উপকরণ ও প্যাকেটজাত পণ্য জমা দিন। যাচাই ও অনুমোদনের পর পণ্য Marketplace-এ প্রকাশ হবে।</p>
          <Link href="/seller/products/new" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">পণ্য যোগ করুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">ক্রেতাদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">প্রয়োজনীয় পণ্যের চাহিদা জানান</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">কোন পণ্য, কত পরিমাণ এবং কোথায় প্রয়োজন—চাহিদা বোর্ডে পোস্ট করে সরবরাহকারীদের সঙ্গে যোগাযোগের সুযোগ নিন।</p>
          <Link href="/buyer-demands" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">চাহিদা বোর্ড দেখুন →</Link>
        </article>
      </div>
    </section>
    <MobileDashboardNav active="marketplace" />
  </main>;
}

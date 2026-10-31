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
      .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,unit,image_url")
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

  return <main className="min-h-screen overflow-x-clip bg-[#f7f9f5] pb-28 text-[#17351f] md:pb-0">
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_82%_20%,rgba(190,242,100,.18),transparent_32%),linear-gradient(120deg,#0b3826_0%,#145c3a_58%,#1b6b40_100%)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 h-96 w-96 rounded-full border-[56px] border-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[42%] -z-10 h-72 w-72 rounded-full border-[44px] border-lime-200/[0.07]" />
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-4 py-9 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold tracking-[.16em] text-lime-200">AGRIVA MARKETPLACE</p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">কৃষির সব প্রয়োজন, <span className="text-lime-300">এক মার্কেটপ্লেসে</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base sm:leading-8">বিশ্বস্ত কৃষিপণ্য খুঁজুন, দাম ও স্টক দেখুন, পছন্দের পণ্য তুলনা করুন। বীজ থেকে কৃষিযন্ত্র—চাষের প্রয়োজনীয় কেনাকাটা হোক আরও সহজ।</p>
          <a href="#catalogue" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123f2b]">কেনাকাটা শুরু করুন <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hidden w-full max-w-xs rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm lg:block">
          <p className="text-xs font-bold text-lime-200">স্মার্ট কৃষি কেনাকাটা</p>
          <p className="mt-2 text-xl font-black leading-snug">সঠিক পণ্য খুঁজে নিন</p>
          <p className="mt-2 text-sm leading-6 text-emerald-50/75">ক্যাটাগরি, জনপ্রিয় সার্চ ও পণ্য তুলনা ব্যবহার করে সিদ্ধান্ত নিন।</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-50/90"><span className="h-2 w-2 rounded-full bg-lime-300" /> সহজ সার্চ ও ক্যাটাগরি</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-50/90"><span className="h-2 w-2 rounded-full bg-lime-300" /> দাম, স্টক ও বিবরণ একসঙ্গে</div>
        </div>
      </div>
    </section>

    <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <MarketplaceCore products={products} initialQuery={initialQuery} emptyCatalogMessage={catalogueUnavailable ? "এই মুহূর্তে পণ্যের তালিকা লোড করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।" : !products.length ? "এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য পাওয়া যায়নি। পণ্য অনুমোদিত হলে এখানে দেখা যাবে।" : undefined} />
    </section>

    <section aria-label="বিক্রেতা ও ক্রেতাদের জন্য সেবা" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">AGRIVA services</p>
        <h2 className="mt-1.5 text-xl font-black sm:text-2xl">কেনা-বেচায় আরও সুযোগ</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="flex flex-col items-start rounded-2xl border border-emerald-200/80 bg-white p-5 sm:p-6">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">কৃষকদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">নিজের ফসল সরাসরি বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">ফসলের ছবি, পরিমাণ, দাম ও অবস্থান দিয়ে পোস্ট করুন। অনুমোদনের পর ক্রেতারা আপনার ফসল দেখতে পারবেন।</p>
          <Link href="/sell-harvest" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-900">ফসল বিক্রি করুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800">কোম্পানি ও ব্যবসায়ীদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">Marketplace-এ পণ্য বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">কৃষি উপকরণ ও প্যাকেটজাত পণ্য জমা দিন। যাচাই ও অনুমোদনের পর পণ্য Marketplace-এ প্রকাশ হবে।</p>
          <Link href="/seller/products/new" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">পণ্য যোগ করুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-amber-200/80 bg-white p-5 sm:p-6">
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

import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import MobileDashboardNav from "@/components/MobileDashboardNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "কৃষি পণ্য, বীজ ও সার",
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
    const ranked = await supabase.rpc("get_ranked_marketplace_products", { p_limit: 500 });
    // Keep the catalogue available while the additive migration is rolled out.
    const { data, error } = ranked.error
      ? await supabase.from("products")
          .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,unit,image_url,created_at")
          .eq("status", "active").eq("marketplace_channel", "marketplace")
          .is("deleted_at", null).order("created_at", { ascending: false }).limit(500)
      : ranked;
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

  return <main className="min-h-screen overflow-hidden bg-[#f7f9f5] pb-28 text-[#17351f] md:pb-0">
    <section className="relative isolate overflow-hidden bg-[#123f2b] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 hidden h-96 w-96 rounded-full border-[56px] border-white/[0.06] sm:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[42%] -z-10 hidden h-72 w-72 rounded-full border-[44px] border-lime-200/[0.07] sm:block" />
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-3 py-4 min-[375px]:px-4 min-[375px]:py-5 sm:gap-8 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:px-8 lg:py-14">
        <div className="min-w-0 max-w-3xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-extrabold tracking-[.12em] text-lime-200 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[.16em]">AGRIVA MARKETPLACE</p>
          <h1 className="mt-2 text-[clamp(1.35rem,5.5vw,1.75rem)] font-black leading-[1.25] tracking-tight sm:mt-4 sm:text-4xl sm:leading-tight lg:text-[3.4rem]">কৃষির প্রয়োজনীয় পণ্য, <span className="text-lime-300">সহজেই খুঁজুন</span></h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-emerald-50/85 sm:mt-4 sm:text-base sm:leading-8"><span className="sm:hidden">বীজ, সার ও কৃষিযন্ত্রসহ প্রয়োজনীয় পণ্য খুঁজুন এবং সহজেই অর্ডার করুন।</span><span className="hidden sm:inline">বীজ, সার, ফসল সুরক্ষা ও কৃষিযন্ত্রসহ প্রয়োজনীয় কৃষিপণ্য খুঁজে দাম ও প্রাপ্যতার তথ্য দেখুন। পছন্দের পণ্য থেকে সরাসরি বিস্তারিত জেনে বিক্রেতার সঙ্গে যোগাযোগ করুন।</span></p>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6">
            <a href="#marketplace-product-list" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-lime-300 px-4 py-2 text-xs font-extrabold text-[#17351f] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123f2b] sm:hidden">পণ্য দেখুন <span aria-hidden="true">↓</span></a>
            <a href="#catalogue" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123f2b] sm:hidden">সার্চ করুন</a>
            <a href="#catalogue" className="hidden min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123f2b] sm:inline-flex">পণ্য খুঁজুন <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hidden w-full max-w-xs rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm lg:block">
          <p className="text-xs font-bold text-lime-200">কেনাকাটা শুরু করুন</p>
          <p className="mt-2 text-xl font-black leading-snug">আপনার প্রয়োজনের পণ্য বেছে নিন</p>
          <p className="mt-2 text-sm leading-6 text-emerald-50/75">সার্চ অথবা ক্যাটাগরি ব্যবহার করে দ্রুত পণ্য খুঁজে নিন।</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-50/90"><span className="h-2 w-2 rounded-full bg-lime-300" /> সহজ সার্চ ও ক্যাটাগরি</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-50/90"><span className="h-2 w-2 rounded-full bg-lime-300" /> পরিষ্কার দাম ও পণ্যের তথ্য</div>
        </div>
      </div>
    </section>

    <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-4 min-[375px]:px-4 sm:scroll-mt-28 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <MarketplaceCore products={products} initialQuery={initialQuery} availableCategoriesOnly emptyCatalogMessage={catalogueUnavailable ? "এই মুহূর্তে পণ্যের তালিকা লোড করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।" : !products.length ? "এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য (Marketplace) পাওয়া যায়নি। অনুমোদনের পর এখানে দেখা যাবে।" : undefined} />
    </section>

    <section aria-label="বিক্রেতা ও ক্রেতাদের জন্য সেবা" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">AGRIVA services</p>
        <h2 className="mt-1.5 text-xl font-black sm:text-2xl">কেনা-বেচায় আরও সুযোগ</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="flex flex-col items-start rounded-2xl border border-emerald-800 bg-[#075d45] p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg border border-lime-200/30 bg-white/10 text-xl">▦</span>
          <h3 className="mt-3 text-lg font-black">জমির হিসাব করুন</h3>
          <p className="mt-2 text-sm leading-6 text-emerald-50/90">জমির পরিমাপ ও আয়তন হিসাব করুন। শতাংশ, কাঠা, বিঘা, একরসহ বিভিন্ন এককে রূপান্তর দেখুন।</p>
          <Link href="/land-calculator" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-emerald-950 transition hover:bg-lime-200">ক্যালকুলেটর দেখুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-emerald-200/80 bg-white p-5 sm:p-6">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">কৃষকদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">নিজের ফসল সরাসরি বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">ফসলের ছবি, পরিমাণ, দাম ও অবস্থান দিয়ে পোস্ট করুন। পোস্ট জমা দিলে প্রকাশিত হবে; ক্রেতারা আপনার ফসল দেখে সরাসরি যোগাযোগ করতে পারবেন।</p>
          <Link href="/sell-harvest" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-900">ফসল বিক্রি করুন →</Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800">কোম্পানি ও ব্যবসায়ীদের জন্য</span>
          <h3 className="mt-3 text-lg font-black">Marketplace-এ পণ্য বিক্রি করুন</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">কৃষি উপকরণ ও প্যাকেটজাত পণ্য জমা দিন। যাচাই ও অনুমোদনের পর পণ্য Marketplace-এ প্রকাশ হবে।</p>
          <Link href="/sell-on-marketplace" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">বিক্রেতা হিসেবে পণ্য যোগ করুন →</Link>
          <Link href="/seller/products" className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4">আমার Marketplace Seller Dashboard</Link>
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

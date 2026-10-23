import type { Metadata } from "next";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MARKETPLACE_SAMPLE_PRODUCTS } from "@/lib/marketplace/sample-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "কৃষি পণ্যের অনলাইন মার্কেটপ্লেস | AGRIVA বাংলাদেশ",
  description: "বাংলাদেশের কৃষি পণ্য, বীজ, সার, ফসল সুরক্ষা, কৃষি যন্ত্রপাতি ও তাজা উৎপাদন খুঁজুন AGRIVA Marketplace-এ। ক্যাটাগরি অনুযায়ী পণ্য দেখুন ও মূল্য যাচাই করুন।",
  alternates: { canonical: "/marketplace" },
  keywords: ["কৃষি পণ্য", "কৃষি পণ্যের মার্কেটপ্লেস", "কৃষি বীজ", "কৃষি সার", "কৃষি যন্ত্রপাতি", "বাংলাদেশ কৃষি পণ্য"],
  openGraph: { title: "AGRIVA Marketplace | কৃষি পণ্য এক জায়গায়", description: "ক্যাটাগরি অনুযায়ী কৃষি পণ্য খুঁজুন ও পণ্যের তথ্য দেখুন।", type: "website", locale: "bn_BD" },
};

export default async function MarketplacePage() {
  let products: MarketplaceProduct[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products")
      .select("id,name,slug,category,description,price,stock")
      .eq("status", "active")
      .order("created_at", { ascending: false }).limit(120);
    if (!error && data) products = data as MarketplaceProduct[];
  } catch (error) {
    console.error("Marketplace catalogue load failed:", error);
  }

  const isSamplePreview = products.length === 0;
  if (isSamplePreview) products = MARKETPLACE_SAMPLE_PRODUCTS;

  return <main className="min-h-screen overflow-hidden bg-[#f5f8f1] text-[#17351f]">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 h-80 w-80 rounded-full border-[48px] border-white/10" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide"><span className="h-2 w-2 rounded-full bg-lime-300" /> AGRIVA MARKETPLACE</p>
        <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">বাংলাদেশের কৃষি পণ্য <span className="text-lime-300">এক জায়গায়</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg sm:leading-8">বীজ, সার, ফসল সুরক্ষা, কৃষি যন্ত্রপাতি ও তাজা কৃষিপণ্য ক্যাটাগরি অনুযায়ী খুঁজুন। পণ্যের বিবরণ, মূল্য ও মজুত দেখে সিদ্ধান্ত নিন।</p>
        <a href="#catalogue" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] transition hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#145b3c]">পণ্য খুঁজুন ↓</a>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-50/75 sm:text-sm"><span>✓ ক্যাটাগরি অনুযায়ী ব্রাউজ</span><span>✓ মোবাইল-ফ্রেন্ডলি</span><span>✓ অনুমোদিত পণ্য</span></div>
      </div>
    </section>
    <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-7"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Find what you need</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">কৃষি পণ্য খুঁজুন</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">ক্যাটাগরি বেছে নিন অথবা পণ্যের নাম লিখে খুঁজুন।</p></div>
      {isSamplePreview && <div role="status" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Preview catalogue:</strong> Live approved products are not available right now, so example products are being shown for layout preview only. Confirm product availability and pricing before making a purchase.</div>}
      <MarketplaceCore products={products} />
      {!products.length && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য পাওয়া যায়নি। নতুন পণ্য অনুমোদিত হলে এখানে দেখা যাবে।</p>}
    </section>
  </main>;
}

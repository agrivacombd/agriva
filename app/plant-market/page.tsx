import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plant Market বাংলাদেশ | গাছ, চারা ও বাগান সামগ্রী",
  description: "ঘরের গাছ, ফল ও ফুলের চারা, বীজ, টব, মাটি ও বাগানের প্রয়োজনীয় পণ্য খুঁজুন AGRIVA Plant Market-এ। শুধু বাস্তব, সক্রিয় ও অনুমোদিত পণ্য দেখানো হয়।",
  alternates: { canonical: "/plant-market" },
  keywords: ["Plant Market Bangladesh", "গাছের চারা", "ফুলের গাছ", "ফলের চারা", "বাগানের টব", "গাছের বীজ", "indoor plants Bangladesh"],
  openGraph: {
    title: "AGRIVA Plant Market | গাছ, চারা ও বাগান সামগ্রী",
    description: "গাছপ্রেমী ও বাগানিদের জন্য গাছ, চারা, বীজ এবং বাগানের প্রয়োজনীয় পণ্য খুঁজুন।",
    type: "website",
    locale: "bn_BD",
  },
};

export default async function PlantMarketPage() {
  let products: MarketplaceProduct[] = [];
  let loadFailed = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("plant_market_products")
      .select("id,name,slug,category,description,price,stock,unit,image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      loadFailed = true;
      console.error("Plant Market catalogue load failed:", error);
    } else {
      products = (data ?? []) as MarketplaceProduct[];
    }
  } catch (error) {
    loadFailed = true;
    console.error("Plant Market catalogue load failed:", error);
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const itemListSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "AGRIVA Plant Market — গাছ, চারা ও বাগান সামগ্রী",
        url: `${base}/plant-market`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 50).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `${base}/plant-market/${encodeURIComponent(product.slug)}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "AGRIVA", item: base },
          { "@type": "ListItem", position: 2, name: "Plant Market", item: `${base}/plant-market` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c") }} />
      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_82%_18%,rgba(190,242,100,.22),transparent_34%),linear-gradient(120deg,#0b3021_0%,#145b3c_55%,#246b45_100%)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full border-[48px] border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-[4%] hidden h-[27rem] w-[27rem] rounded-full border border-lime-100/20 lg:block" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-lime-100/10 px-4 py-2 text-[11px] font-extrabold tracking-[.18em] text-lime-100 shadow-sm backdrop-blur">🌿 <span>AGRIVA PLANT MARKET</span></p>
          <h1 className="mt-6 max-w-3xl text-[2.15rem] font-black leading-[1.16] tracking-tight sm:text-5xl sm:leading-[1.12] lg:text-[3.65rem]">আপনার সবুজ জায়গার জন্য <span className="text-lime-300">গাছ, চারা ও বাগান সামগ্রী</span></h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-emerald-50/90 sm:text-lg sm:leading-8">ঘরের গাছ থেকে ছাদবাগান—গাছ, চারা, বীজ, টব ও বাগানের প্রয়োজনীয় পণ্য খুঁজুন। এখানে শুধু ডেটাবেসে থাকা সক্রিয় ও অনুমোদিত পণ্য দেখানো হয়।</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#plant-catalogue" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl bg-lime-300 px-7 py-3.5 text-sm font-extrabold text-[#17351f] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white">গাছ ও পণ্য দেখুন ↓</a>
            <Link href="/sell-on-plant-market" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl border border-white/25 bg-white/[0.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">Plant Seller হন</Link><Link href="/plant-seller/products" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl border border-white/25 bg-white/[0.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">Seller Dashboard</Link><Link href="/green-exchange" className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl border border-white/25 bg-white/[0.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">গাছ বিনিময় করুন</Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-emerald-50/85 sm:text-sm"><span>✓ বাস্তব পণ্য তালিকা</span><span>✓ অনুমোদিত পণ্য</span><span>✓ মোবাইল-ফ্রেন্ডলি</span></div>
        </div>
      </section>

      <section id="plant-catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 border-b border-emerald-900/10 pb-6 sm:mb-9">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Plants & gardening</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#17351f] sm:text-3xl">Plant Market-এ খুঁজুন</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">পণ্যের নাম লিখে খুঁজুন। পণ্যের বিস্তারিত পেজে গিয়ে মূল্য, মজুত এবং উপলভ্য কেনাকাটার ধাপ যাচাই করুন।</p>
        </div>
        {loadFailed ? (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            এই মুহূর্তে Plant Market-এর পণ্য লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন অথবা <Link className="font-bold underline" href="/marketplace">সাধারণ Marketplace</Link> দেখুন।
          </div>
        ) : products.length ? (
          <MarketplaceCore products={products} showCategories={false} productHrefPrefix="/plant-market" />
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-900/25 bg-white p-8 text-center sm:p-12">
            <div aria-hidden="true" className="text-5xl">🪴</div>
            <h3 className="mt-4 text-xl font-extrabold">এখনো কোনো গাছ বা বাগান-সম্পর্কিত পণ্য পাওয়া যায়নি</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">নতুন বাস্তব পণ্য সক্রিয় ও অনুমোদিত হলে এখানে দেখা যাবে। আপাতত গাছ বিনিময়ের বোর্ডে অন্য গাছপ্রেমীদের পোস্ট দেখতে পারেন।</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/green-exchange/board" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Green Exchange দেখুন</Link>
              <Link href="/sell-on-plant-market" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Plant Seller হন</Link><Link href="/marketplace" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-900/20 bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">সব কৃষিপণ্য দেখুন</Link>
            </div>
          </div>
        )}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="font-extrabold">ঘর ও বারান্দার গাছ</h3><p className="mt-2 text-sm leading-6 text-slate-600">ইনডোর গাছ, ফুলের চারা এবং ছোট জায়গার বাগানের উপকরণ খুঁজুন।</p></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="font-extrabold">ছাদবাগান ও ফলের চারা</h3><p className="mt-2 text-sm leading-6 text-slate-600">আপনার জায়গা, আলো ও যত্নের সামর্থ্য অনুযায়ী পণ্য বেছে নিন।</p></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="font-extrabold">গাছ বিনিময়</h3><p className="mt-2 text-sm leading-6 text-slate-600">কেনার পাশাপাশি অনুমোদিত Green Exchange পোস্টে বিনিময়ের প্রস্তাব দিতে পারেন।</p></article><article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="font-extrabold">নিজের Garden</h3><p className="mt-2 text-sm leading-6 text-slate-600">কেনা গাছের যত্নের কাজ ও নির্ধারিত তারিখ Personal Garden-এ রাখুন।</p><Link href="/garden" className="mt-3 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">Garden খুলুন</Link></article><article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h3 className="font-extrabold">Green Impact</h3><p className="mt-2 text-sm leading-6 text-slate-600">অনুমোদিত listing ও সম্পন্ন বিনিময়ের aggregate হিসাব দেখুন।</p><Link href="/impact" className="mt-3 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">Impact দেখুন</Link></article>
        </div>
      </section>
    </main>
  );
}

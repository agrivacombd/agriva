import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Flower2, Leaf, Search, Shovel, Sprout, Citrus, Package } from "lucide-react";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const PLANT_CATEGORY = "plants-gardening";
type PlantMarketProduct = MarketplaceProduct & { image_url?: string | null; created_at?: string | null };

export const metadata: Metadata = {
  title: { absolute: "গাছ, চারা ও বাগান সামগ্রী বাংলাদেশ | AGRIVA Plant Market" },
  description: "বাংলাদেশে ইনডোর গাছ, ফল ও ফুলের চারা, বীজ, টব, মাটি, কম্পোস্ট ও বাগানের সরঞ্জাম খুঁজুন AGRIVA Plant Market-এ। সক্রিয় পণ্য, পরিষ্কার বিবরণ ও বিক্রেতার জমা দেওয়া তথ্য দেখুন।",
  alternates: { canonical: "/plant-market" },
  keywords: ["Plant Market Bangladesh", "গাছের চারা কিনুন", "ফলের চারা", "ফুলের গাছ", "ইনডোর প্ল্যান্ট", "গাছের টব", "গাছের বীজ", "বাগানের মাটি", "gardening supplies Bangladesh"],
  openGraph: {
    title: "AGRIVA Plant Market — গাছ, চারা ও বাগান সামগ্রী",
    description: "ঘরের গাছ থেকে ছাদবাগান—গাছ, চারা, বীজ, টব, মাটি ও বাগানের প্রয়োজনীয় পণ্য খুঁজুন।",
    type: "website",
    locale: "bn_BD",
    url: "/plant-market",
    siteName: "AGRIVA",
  },
  twitter: {
    card: "summary",
    title: "AGRIVA Plant Market — গাছ, চারা ও বাগান সামগ্রী",
    description: "বাংলাদেশে গাছ, চারা, বীজ, টব ও বাগানের প্রয়োজনীয় পণ্য খুঁজুন।",
  },
};

const plantTerms = [
  "গাছ", "চারা", "বীজ", "ফুল", "ফল", "টব", "মাটি", "কম্পোস্ট",
  "বাগান", "ইনডোর", "ক্যাকটাস", "সাকুলেন্ট", "নার্সারি",
  "plant", "tree", "sapling", "seedling", "seed", "flower",
  "fruit", "pot", "soil", "compost", "garden", "gardening",
  "indoor", "cactus", "succulent", "nursery", "orchid",
];

function isPlantProduct(product: MarketplaceProduct) {
  // A saved taxonomy value is authoritative. Only use text matching for legacy rows.
  if (product.category_slug) return product.category_slug === PLANT_CATEGORY;

  const searchable = [product.name, product.category, product.description]
    .filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
  return plantTerms.some((term) => searchable.includes(term.normalize("NFKC").toLocaleLowerCase()));
}

const plantSubcategories = [
  { slug: "indoor-plants", name: "ইনডোর ও শোভাবর্ধক গাছ", description: "ঘর, অফিস ও বারান্দার জন্য ইনডোর প্ল্যান্ট ও শোভাবর্ধক গাছ।", Icon: Sprout },
  { slug: "fruit-saplings", name: "ফলের গাছ ও চারা", description: "ফলজ গাছের চারা ও কলম—নিজের জায়গা ও পরিচর্যার উপযোগী গাছ বেছে নিন।", Icon: Citrus },
  { slug: "flowering-plants", name: "ফুলের গাছ ও চারা", description: "বাগান, বারান্দা ও ছাদের জন্য ফুলের গাছ ও চারা।", Icon: Flower2 },
  { slug: "vegetable-herb-seedlings", name: "সবজি ও ভেষজ চারা", description: "ঘরোয়া সবজি, রান্নার হার্ব ও ভেষজ গাছের চারা।", Icon: Leaf },
  { slug: "plant-pots-planters", name: "টব ও প্ল্যান্টার", description: "গাছের ধরন ও জায়গার সঙ্গে মানানসই টব ও প্ল্যান্টার।", Icon: Package },
  { slug: "soil-compost-growing-media", name: "মাটি, কম্পোস্ট ও গ্রোয়িং মিডিয়া", description: "পটিং মিক্স, কোকোপিট, কম্পোস্ট ও গাছ লাগানোর মাধ্যম।", Icon: Sprout },
  { slug: "gardening-tools", name: "বাগানের সরঞ্জাম", description: "পানি দেওয়া, ছাঁটাই ও দৈনন্দিন গাছের যত্নের সরঞ্জাম।", Icon: Shovel },
  { slug: "plant-seeds-bulbs", name: "গাছের বীজ ও বাল্ব", description: "ফুল, সবজি ও শোভাবর্ধক গাছের বীজ ও বাল্ব।", Icon: Sprout },
];

export default async function PlantMarketPage() {
  let products: PlantMarketProduct[] = [];
  let loadFailed = false;

  try {
    const supabase = await createSupabaseServerClient();
    const [taxonomyResult, legacyResult] = await Promise.all([
      supabase.from("products")
        .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,created_at")
        .eq("status", "active")
        .eq("category_slug", PLANT_CATEGORY)
        .order("created_at", { ascending: false })
        .limit(500),
      // Keep older listings discoverable while sellers/admins gradually use stable taxonomy.
      supabase.from("products")
        .select("id,name,slug,category,category_slug,subcategory_slug,description,price,stock,image_url,created_at")
        .eq("status", "active")
        .is("category_slug", null)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (taxonomyResult.error) throw taxonomyResult.error;
    if (legacyResult.error) throw legacyResult.error;
    const unique = new Map<string, PlantMarketProduct>();
    for (const row of [...(taxonomyResult.data ?? []), ...(legacyResult.data ?? [])] as PlantMarketProduct[]) {
      if (isPlantProduct(row)) unique.set(row.id, row);
    }
    products = [...unique.values()].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  } catch (error) {
    loadFailed = true;
    console.error("Plant Market catalogue load failed:", error);
  }

  const productItems = products.slice(0, 50).map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.name,
    url: `${SITE_URL}/marketplace/${encodeURIComponent(product.slug)}`,
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/plant-market#webpage`,
        name: "AGRIVA Plant Market — গাছ, চারা ও বাগান সামগ্রী",
        description: "বাংলাদেশে গাছ, চারা, বীজ, টব, মাটি, কম্পোস্ট ও বাগানের সরঞ্জাম খুঁজুন।",
        url: `${SITE_URL}/plant-market`,
        inLanguage: "bn-BD",
        mainEntity: { "@id": `${SITE_URL}/plant-market#product-list` },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/plant-market#product-list`,
        name: "Plant Market-এর সক্রিয় পণ্য",
        url: `${SITE_URL}/plant-market`,
        numberOfItems: productItems.length,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: productItems,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "হোম", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Plant Market", item: `${SITE_URL}/plant-market` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#34784b] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full border-[48px] border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide"><Leaf aria-hidden="true" className="mr-2 inline-block h-4 w-4" /> AGRIVA PLANT MARKET</p>
          <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">বাংলাদেশে <span className="text-lime-300">গাছ, চারা ও বাগান সামগ্রী</span> খুঁজুন</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/90 sm:text-lg sm:leading-8">ঘরের ইনডোর প্ল্যান্ট থেকে ফলের চারা, ছাদবাগানের টব, বীজ, মাটি ও কম্পোস্ট—আপনার প্রয়োজনের পণ্য এক জায়গায় খুঁজুন। পণ্যের বিবরণ, মূল্য ও মজুত দেখে সিদ্ধান্ত নিন।</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#plant-catalogue" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-6 py-3 text-sm font-extrabold text-[#17351f] hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white">গাছ ও পণ্য দেখুন ↓</a>
            <Link href="/green-exchange" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20">গাছ বিনিময় করুন</Link>
            <Link href="/seller/products/new" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">বিক্রেতা হিসেবে পণ্য জমা দিন</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-50/80 sm:text-sm"><span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-4 w-4" /> সক্রিয় পণ্যের তালিকা</span><span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-4 w-4" /> অ্যাডমিন অনুমোদনের পর প্রকাশ</span><span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-4 w-4" /> পণ্যের আলাদা বিস্তারিত পেজ</span></div>
        </div>
      </section>

      <section aria-labelledby="plant-market-grow-earn" className="bg-[#eaf4e5] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="inline-flex rounded-full border border-emerald-800/15 bg-white px-3 py-1.5 text-xs font-extrabold tracking-wide text-emerald-900"><Sprout aria-hidden="true" className="mr-2 inline-block h-4 w-4" /> GROW MORE, EARN MORE</p>
            <h2 id="plant-market-grow-earn" className="mt-4 max-w-3xl text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">বাগান আপনার শখ, গাছ হতে পারে বাড়তি আয়ের সুযোগ</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">ছাদবাগান, বারান্দা কিংবা ঘরের ইনডোর প্ল্যান্ট—আপনি যত্ন করে যে গাছগুলো বড় করেন, সেখান থেকেই শুরু হতে পারে ছোট্ট একটি উদ্যোগ। আপনার কাছে যদি সুস্থ চারা, কাটিং, বীজ, ফল-ফুলের গাছ, টব বা নিজে তৈরি করা প্ল্যান্টার থাকে, সেগুলো Plant Market-এ তালিকাভুক্ত করার কথা ভাবুন।</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">অল্প করে শুরু করুন, গাছের পরিচর্যার অভিজ্ঞতা শেয়ার করুন, আর ক্রেতার আগ্রহ বুঝে ধীরে ধীরে এগোন। বিক্রি বা আয়ের নিশ্চয়তা নেই—তবে ভালো পণ্য, সঠিক তথ্য ও নিয়মিত যত্ন আপনার উদ্যোগকে এগিয়ে নিতে সাহায্য করতে পারে।</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/seller/products/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">আমার গাছের পণ্য জমা দিন <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
              <a href="#plant-catalogue" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-900/20 bg-white px-6 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Plant Market ঘুরে দেখুন</a>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-black text-emerald-950">আপনার বাগান থেকে শুরু করার ৩টি ধাপ</h3>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-900">১</span><div><h4 className="font-extrabold text-emerald-950">যা ভালোভাবে পরিচর্যা করতে পারেন, তা বাছুন</h4><p className="mt-1 text-sm leading-6 text-slate-600">সুস্থ চারা, সহজে যত্ন নেওয়া যায় এমন ইনডোর প্ল্যান্ট, কাটিং বা মৌসুমি ফুল-সবজির চারা দিয়ে শুরু করতে পারেন।</p></div></li>
              <li className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-900">২</span><div><h4 className="font-extrabold text-emerald-950">নিজের তোলা পরিষ্কার ছবি ও সঠিক তথ্য দিন</h4><p className="mt-1 text-sm leading-6 text-slate-600">গাছের নাম, আকার, দাম, মজুত, আলো-পানির প্রয়োজন ও ডেলিভারির তথ্য স্পষ্ট করে লিখুন।</p></div></li>
              <li className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-900">৩</span><div><h4 className="font-extrabold text-emerald-950">পণ্য জমা দিন, অনুমোদনের জন্য অপেক্ষা করুন</h4><p className="mt-1 text-sm leading-6 text-slate-600">Seller Centre-এ পণ্য জমা দিন। অ্যাডমিন অনুমোদনের পর পণ্য প্রকাশিত হবে; বিক্রির ফলাফল ক্রেতার চাহিদা ও পণ্যের ওপর নির্ভর করবে।</p></div></li>
            </ol>
            <div className="mt-6 rounded-2xl bg-[#f5f8f1] p-4"><p className="text-sm font-bold leading-6 text-emerald-950"><Sprout aria-hidden="true" className="mr-2 inline-block h-4 w-4" /> শখের বাগান থেকে ছোট উদ্যোগ—নিজের গতিতে শুরু করুন, গাছের প্রতি ভালোবাসা ধরে রাখুন।</p></div>
          </div>
        </div>
      </section>

      <section id="plant-catalogue" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Plants & gardening supplies</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">ক্যাটাগরি অনুযায়ী গাছ ও বাগানের পণ্য খুঁজুন</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">আপনার গাছের ধরন, জায়গা ও কাজ অনুযায়ী ক্যাটাগরি বেছে নিন। প্রতিটি ক্যাটাগরির পেজে সেই ধরনের পণ্যের বিস্তারিত তালিকা দেখুন।</p><Link href="/marketplace/category/plants-gardening" className="mt-3 inline-flex min-h-10 items-center font-bold text-emerald-800 underline underline-offset-4">সব গাছ ও বাগান পণ্য দেখুন →</Link>
        </header>
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plantSubcategories.map((subcategory) => (
            <Link key={subcategory.slug} href={`/marketplace/category/plants-gardening/${subcategory.slug}`} className="group rounded-2xl border border-emerald-950/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-sm">
              <span aria-hidden="true" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><subcategory.Icon className="h-7 w-7" strokeWidth={1.8} /></span>
              <h3 className="mt-3 font-extrabold text-emerald-950 group-hover:underline">{subcategory.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{subcategory.description}</p>
              <span className="mt-3 inline-flex text-sm font-bold text-emerald-800">পণ্য দেখুন →</span>
            </Link>
          ))}
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Plant Market-এর পণ্য</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">পণ্যের নাম লিখে খুঁজুন। পণ্যের বিস্তারিত পেজে মূল্য, মজুত, ছবি ও বিবরণ দেখে সিদ্ধান্ত নিন।</p>
        </div>
        {loadFailed ? (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            এই মুহূর্তে Plant Market-এর পণ্য লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন অথবা <Link className="font-bold underline" href="/marketplace">সাধারণ Marketplace</Link> দেখুন।
          </div>
        ) : products.length ? (
          <MarketplaceCore products={products} showCategories={false} />
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-900/25 bg-white p-8 text-center sm:p-12">
            <Sprout aria-hidden="true" className="mx-auto h-12 w-12 text-emerald-700" strokeWidth={1.7} />
            <h3 className="mt-4 text-xl font-extrabold">এখনো কোনো গাছ বা বাগান-সম্পর্কিত পণ্য পাওয়া যায়নি</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">নতুন পণ্য বিক্রেতা জমা দেবেন এবং অ্যাডমিন অনুমোদনের পর এখানে দেখা যাবে। ক্যাটাগরিগুলো থেকে প্রয়োজনীয় পণ্য খুঁজে দেখতে পারেন।</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/seller/products/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">পণ্য জমা দিন</Link>
              <Link href="/green-exchange/board" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-900/20 bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Green Exchange দেখুন</Link>
            </div>
          </div>
        )}

        <section aria-labelledby="plant-market-how-heading" className="mt-10 rounded-3xl border border-emerald-950/10 bg-white p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">How Plant Market works</p>
          <h2 id="plant-market-how-heading" className="mt-2 text-2xl font-black">Plant Market থেকে কীভাবে পণ্য কিনবেন</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-[#f5f8f1] p-5"><Sprout aria-hidden="true" className="h-7 w-7 text-emerald-800" strokeWidth={1.8} /><h3 className="mt-3 font-extrabold">১. পণ্য ও ক্যাটাগরি বেছে নিন</h3><p className="mt-2 text-sm leading-6 text-slate-600">ইনডোর গাছ, ফলের চারা, টব, মাটি বা বীজের ক্যাটাগরি থেকে প্রাসঙ্গিক পণ্য খুঁজুন।</p></article>
            <article className="rounded-2xl bg-[#f5f8f1] p-5"><Search aria-hidden="true" className="h-7 w-7 text-emerald-800" strokeWidth={1.8} /><h3 className="mt-3 font-extrabold">২. বিবরণ, মূল্য ও মজুত দেখুন</h3><p className="mt-2 text-sm leading-6 text-slate-600">পণ্যের ছবি, বর্ণনা, মূল্য ও প্রাপ্যতার তথ্য মিলিয়ে সিদ্ধান্ত নিন।</p></article>
            <article className="rounded-2xl bg-[#f5f8f1] p-5"><Package aria-hidden="true" className="h-7 w-7 text-emerald-800" strokeWidth={1.8} /><h3 className="mt-3 font-extrabold">৩. checkout-এ অর্ডার নিশ্চিত করুন</h3><p className="mt-2 text-sm leading-6 text-slate-600">অর্ডার সম্পন্ন করার আগে checkout-এ সর্বশেষ মূল্য ও মজুত যাচাই করুন।</p></article>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-900/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-extrabold">নার্সারি বা গাছের বিক্রেতা?</h3><p className="mt-1 text-sm leading-6 text-slate-600">পণ্যের সঠিক নাম, নিজস্ব পরিষ্কার ছবি, মূল্য, মজুত ও উপকারী বিবরণ দিন। অ্যাডমিন অনুমোদনের আগে পণ্য প্রকাশ হবে না।</p></div>
            <Link href="/seller/products/new" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">পণ্য জমা দিন</Link>
          </div>
        </section>

        <section aria-labelledby="plant-market-buying-guide" className="mt-10 grid gap-5 rounded-3xl border border-emerald-950/10 bg-white p-6 sm:grid-cols-2 sm:p-8">
          <div><h2 id="plant-market-buying-guide" className="text-xl font-black">সঠিক গাছ বা বাগানের পণ্য কীভাবে বাছবেন?</h2><p className="mt-3 text-sm leading-7 text-slate-600">কেনার আগে গাছের ধরন, চারার আকার, আলো ও পরিচর্যার প্রয়োজন, টবের মাপ এবং পণ্যের পরিমাণ দেখুন। আপনার জায়গার পরিবেশের সঙ্গে মানানসই পণ্য বেছে নিলে গাছের যত্ন নেওয়া সহজ হয়। পণ্যের বিবরণে কোনো তথ্য না থাকলে অর্ডারের আগে বিক্রেতার কাছে নিশ্চিত করুন।</p></div>
          <div><h2 className="text-xl font-black">Plant Market-এ পণ্য তালিকাভুক্ত করবেন?</h2><p className="mt-3 text-sm leading-7 text-slate-600">নার্সারি, গার্ডেনের মালিক ও অনুমোদিত বিক্রেতারা প্রতিটি পণ্যের জন্য আলাদা নাম, ক্যাটাগরি, মূল্য, মজুত, নিজস্ব ছবি ও অনন্য বিবরণ জমা দিতে পারবেন। স্পষ্ট তথ্য ক্রেতাকে সিদ্ধান্ত নিতে এবং সার্চ ইঞ্জিনকে পণ্যের পেজ বুঝতে সাহায্য করে।</p></div>
        </section>

        <section aria-labelledby="plant-market-faq" className="mt-10 rounded-3xl border border-emerald-950/10 bg-white p-6 sm:p-8">
          <h2 id="plant-market-faq" className="text-2xl font-black">Plant Market সম্পর্কে সাধারণ প্রশ্ন</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article><h3 className="font-extrabold">Plant Market-এ কী কী পাওয়া যায়?</h3><p className="mt-2 text-sm leading-7 text-slate-600">ক্যাটাগরি অনুযায়ী ইনডোর গাছ, ফল ও ফুলের চারা, সবজি ও ভেষজ চারা, টব, মাটি, কম্পোস্ট, বাগানের সরঞ্জাম এবং গাছের বীজ খুঁজতে পারবেন। প্রকৃত প্রাপ্যতা সক্রিয় পণ্যের তালিকার ওপর নির্ভর করে।</p></article>
            <article><h3 className="font-extrabold">পণ্য কি সরাসরি প্রকাশ হয়?</h3><p className="mt-2 text-sm leading-7 text-slate-600">না। বিক্রেতার জমা দেওয়া পণ্য অ্যাডমিন পর্যালোচনা ও অনুমোদনের পরই পাবলিক তালিকায় আসবে।</p></article>
            <article><h3 className="font-extrabold">পণ্যের পেজে কী তথ্য দেখা উচিত?</h3><p className="mt-2 text-sm leading-7 text-slate-600">পণ্যের নাম, ছবি, বিবরণ, মূল্য ও মজুতের তথ্য দেখুন। গাছের ক্ষেত্রে জাত, আকার এবং যত্নের প্রয়োজন উল্লেখ থাকলে বেছে নেওয়া সহজ হয়।</p></article>
            <article><h3 className="font-extrabold">আমি কি নার্সারি হিসেবে বিক্রি করতে পারি?</h3><p className="mt-2 text-sm leading-7 text-slate-600">অনুমোদিত seller বা organization account থেকে Seller Centre-এ পণ্য জমা দিন। অনুমোদন ছাড়া পণ্য প্রকাশিত হবে না।</p></article>
          </div>
        </section>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const pageUrl = `${siteUrl}/impact`;

export const metadata: Metadata = {
  title: "Green Impact: গাছ বিনিময় ও সবুজ কমিউনিটির অগ্রগতি",
  description: "AGRIVA Green Impact Dashboard-এ অনুমোদিত Green Exchange listing, সক্রিয় plant-market পণ্য ও সম্পন্ন বিনিময়ের বাস্তব aggregate তথ্য দেখুন।",
  alternates: { canonical: "/impact" },
  keywords: ["AGRIVA Green Impact", "গাছ বিনিময়", "plant market Bangladesh", "green community Bangladesh", "সustainable gardening"],
  openGraph: {
    type: "website", locale: "bn_BD", url: pageUrl, siteName: "AGRIVA",
    title: "AGRIVA Green Impact | সবুজ কমিউনিটির অগ্রগতি",
    description: "AGRIVA-তে অনুমোদিত listing, plant-market পণ্য ও সম্পন্ন বিনিময়ের aggregate অগ্রগতি দেখুন।",
  },
  twitter: { card: "summary", title: "AGRIVA Green Impact", description: "বাস্তব platform activity থেকে সবুজ কমিউনিটির অগ্রগতি।" },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AGRIVA Green Impact",
  url: pageUrl,
  inLanguage: "bn-BD",
  description: "AGRIVA Green Living platform-এর aggregate activity dashboard.",
  isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
  about: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
  breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "AGRIVA", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Green Impact", item: pageUrl },
  ] },
};

function MetricCard({ value, label, description }: { value: number | null; label: string; description: string }) {
  return (
    <article className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold text-emerald-800">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-emerald-950 sm:text-5xl" aria-live="polite">
        {value === null ? "—" : new Intl.NumberFormat("bn-BD").format(value)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export default async function GreenImpactPage() {
  let metrics: { approved_exchange_listings: number; active_marketplace_products: number; completed_exchange_requests: number } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_green_impact_metrics");
    const first = Array.isArray(data) ? data[0] : data;
    if (!error && first) {
      metrics = {
        approved_exchange_listings: Number(first.approved_exchange_listings),
        active_marketplace_products: Number(first.active_marketplace_products),
        completed_exchange_requests: Number(first.completed_exchange_requests),
      };
    }
  } catch (error) {
    console.error("Green impact metrics unavailable:", error);
  }

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-black sm:text-2xl">AGRIVA<span className="text-amber-600">.</span></Link>
          <nav aria-label="Main navigation" className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm font-bold">
            <Link href="/plant-market" className="hover:text-emerald-700">Plant Market</Link>
            <Link href="/green-exchange/board" className="hover:text-emerald-700">Green Exchange</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:underline">AGRIVA</Link><span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-emerald-900">Green Impact</span>
        </nav>
        <div className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-9 text-white sm:px-8 sm:py-12">
          <p className="text-xs font-extrabold tracking-[.18em] text-emerald-200">MEASURE WHAT MATTERS</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">সবুজ উদ্যোগের অগ্রগতি—বাস্তব তথ্য দিয়ে</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">AGRIVA Green Impact-এ platform-এর অনুমোদিত listing, সক্রিয় plant-market পণ্য এবং সম্পন্ন exchange request-এর aggregate হিসাব দেখানো হয়। ব্যক্তিগত account বা private message এখানে প্রকাশ করা হয় না।</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/green-exchange/board" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-emerald-950 hover:bg-lime-200">গাছ বিনিময়ে অংশ নিন</Link>
            <Link href="/plant-market" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Plant Market দেখুন</Link>
          </div>
        </div>

        <section aria-labelledby="impact-metrics" className="mt-9">
          <div className="max-w-3xl"><h2 id="impact-metrics" className="text-2xl font-black sm:text-3xl">Platform activity snapshot</h2><p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">ডেটাবেসে থাকা বর্তমান activity থেকে গণনা করা হয়েছে। তথ্য লোড করা না গেলে শূন্য দেখানোর বদলে অনুপলব্ধ হিসেবে দেখানো হবে।</p></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard value={metrics?.approved_exchange_listings ?? null} label="অনুমোদিত Green Exchange listing" description="বর্তমানে সক্রিয় ও moderation-এ অনুমোদিত বিনিময়ের পোস্ট। এটি সম্পন্ন বিনিময়ের সংখ্যা নয়।" />
            <MetricCard value={metrics?.active_marketplace_products ?? null} label="সক্রিয় Plant Market পণ্য" description="নাম বা category অনুযায়ী গাছ, চারা ও বাগান-সম্পর্কিত অনুমোদিত পণ্য।" />
            <MetricCard value={metrics?.completed_exchange_requests ?? null} label="সম্পন্ন বিনিময়" description="যে exchange request-গুলোর status completed হিসেবে সংরক্ষিত হয়েছে।" />
          </div>
          {!metrics && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Impact metrics এখন পাওয়া যাচ্ছে না। Platform administrator-এর migration ও database function deployment যাচাই করা প্রয়োজন।</p>}
        </section>

        <section className="mt-9 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h2 className="font-black">Trust first</h2><p className="mt-2 text-sm leading-6 text-slate-600">Public listing moderation-এর পর দেখানো হয়। সন্দেহজনক পোস্টের report flow ও seller verification-কে পরবর্তী ধাপে যুক্ত করা উচিত।</p></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h2 className="font-black">No inflated impact claims</h2><p className="mt-2 text-sm leading-6 text-slate-600">যাচাইযোগ্য planting record ছাড়া গাছ লাগানো, CO₂ কমানো বা পরিবেশগত সাশ্রয়ের সংখ্যা দাবি করা হয় না।</p></article>
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><h2 className="font-black">Help the community grow</h2><p className="mt-2 text-sm leading-6 text-slate-600">সুস্থ গাছের তথ্য দিন, স্পষ্ট শর্তে বিনিময় করুন এবং marketplace listing সঠিক ও আপডেট রাখুন।</p></article>
        </section>
        <p className="mt-6 text-xs leading-5 text-slate-500">Metric definitions: approved exchange listings = active + approved; active plant-market products = active + approved plant/garden-related catalogue records; completed exchanges = requests explicitly marked completed. These metrics do not independently verify real-world handovers.</p>
      </section>
    </main>
  );
}

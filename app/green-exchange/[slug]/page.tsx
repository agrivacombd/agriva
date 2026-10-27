import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

type ExchangeListing = {
  slug: string;
  title: string;
  plant_name: string;
  description: string;
  exchange_type: string;
  wanted_items: string | null;
  area: string;
  district: string | null;
  condition: string;
  quantity: number;
  created_at: string;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
const typeLabels: Record<string, string> = {
  plant_swap: "গাছের বদলে গাছ",
  cutting: "চারা / কাটিং",
  seed: "বীজ",
  gift: "উপহার",
  garden_item: "বাগানের উপকরণ",
};

async function getListing(slug: string): Promise<ExchangeListing | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("green_exchange_listings")
    .select("slug,title,plant_name,description,exchange_type,wanted_items,area,district,condition,quantity,created_at")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (error || !data) return null;
  return data as ExchangeListing;
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "পোস্ট পাওয়া যায়নি | Green Exchange – AGRIVA", robots: { index: false, follow: true } };

  const description = listing.description.replace(/\s+/g, " ").slice(0, 155);
  const canonical = `${siteUrl}/green-exchange/${encodeURIComponent(listing.slug)}`;
  return {
    title: `${listing.title} | Green Exchange – AGRIVA`,
    description,
    alternates: { canonical },
    openGraph: { title: listing.title, description, url: canonical, type: "article", siteName: "AGRIVA" },
    twitter: { card: "summary", title: listing.title, description },
  };
}

export default async function GreenExchangeListingPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const url = `${siteUrl}/green-exchange/${encodeURIComponent(listing.slug)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: listing.title,
    description: listing.description,
    articleSection: typeLabels[listing.exchange_type] ?? "গাছ বিনিময়",
    inLanguage: "bn-BD",
    url,
    datePublished: listing.created_at,
  };

  return (
    <main className="min-h-screen bg-[#f7faf6] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-emerald-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/green-exchange" className="font-bold text-emerald-800">AGRIVA Green Exchange</Link>
          <Link href="/green-exchange/board" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">সব পোস্ট দেখুন</Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link href="/green-exchange/board" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">← বিনিময়ের বোর্ডে ফিরুন</Link>
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{typeLabels[listing.exchange_type] ?? "গাছ বিনিময়"}</span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-lg font-semibold text-emerald-800">{listing.plant_name}</p>
          <p className="mt-5 whitespace-pre-line leading-8 text-slate-700">{listing.description}</p>
          <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div><dt className="text-sm text-slate-500">এলাকা</dt><dd className="mt-1 font-semibold">{listing.area}{listing.district ? `, ${listing.district}` : ""}</dd></div>
            <div><dt className="text-sm text-slate-500">পরিমাণ</dt><dd className="mt-1 font-semibold">{listing.quantity}</dd></div>
            <div><dt className="text-sm text-slate-500">অবস্থা</dt><dd className="mt-1 font-semibold">{listing.condition === "healthy" ? "সুস্থ" : listing.condition === "needs_attention" ? "যত্ন প্রয়োজন" : "নিশ্চিত নয়"}</dd></div>
            {listing.wanted_items && <div><dt className="text-sm text-slate-500">বিনিময়ে চাই</dt><dd className="mt-1 font-semibold">{listing.wanted_items}</dd></div>}
          </dl>
          <div className="mt-8 rounded-2xl bg-emerald-50 p-4">
            <p className="font-bold text-emerald-950">এই পোস্টে বিনিময়ের প্রস্তাব দিতে চান?</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900">বিনিময়ের বোর্ডে গিয়ে লগইন করে মালিককে প্রস্তাব পাঠান। ব্যক্তিগত ফোন নম্বর বা বাড়ির ঠিকানা প্রকাশ্যে শেয়ার করবেন না।</p>
            <Link href="/green-exchange/board" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-700">বিনিময়ের অনুরোধ দিন</Link>
          </div>
        </div>
      </article>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
export const metadata: Metadata = {
  title: "কৃষি জ্ঞানকেন্দ্র ও ব্যবহারিক গাইড | AGRIVA",
  description: "বাংলাদেশের কৃষক, বাগানপ্রেমী ও কৃষি উদ্যোক্তাদের জন্য ব্যবহারিক কৃষি গাইড, ফসলের জ্ঞান এবং তথ্যভিত্তিক পরামর্শ।",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: "AGRIVA",
    title: "কৃষি জ্ঞানকেন্দ্র | AGRIVA",
    description: "বাংলাদেশের কৃষি, ফসল, বাগান ও কৃষি ব্যবসা নিয়ে ব্যবহারিক গাইড।",
    url: `${siteUrl}/blog`,
  },
  twitter: { card: "summary_large_image", title: "কৃষি জ্ঞানকেন্দ্র | AGRIVA", description: "বাংলাদেশের কৃষি, ফসল, বাগান ও কৃষি ব্যবসা নিয়ে ব্যবহারিক গাইড।" },
};

type Article = {
  title: string;
  slug: string;
  meta_description: string | null;
  primary_keyword: string;
  updated_at: string | null;
};

async function getPublishedArticles(): Promise<Article[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("content_drafts")
    .select("title,slug,meta_description,primary_keyword,updated_at")
    .eq("status", "published")
    .eq("content_type", "article")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data.filter((article) =>
    typeof article.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) &&
    typeof article.title === "string" &&
    article.title.trim().length > 0
  ) as Article[];
}

export default async function Blog() {
  const articles = await getPublishedArticles();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AGRIVA Agriculture Blog",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/blog/${article.slug}`,
      name: article.title,
    })),
  };
  const latest = articles[0];
  const remaining = latest ? articles.slice(1) : [];

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      {articles.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }} />}
      <section className="relative overflow-hidden border-b border-[#e2eadd] bg-gradient-to-br from-[#edf5e9] via-[#f7faf4] to-[#e2efe0]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[36px] border-white/50" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#cbdcc7] bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.15em] text-[#276340]">AGRIVA · কৃষি জ্ঞানকেন্দ্র</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">ভালো চাষের সিদ্ধান্ত শুরু হোক <span className="text-[#287346]">সঠিক তথ্য</span> থেকে</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#526858] sm:text-lg">ফসল, মাটি, গাছের যত্ন এবং কৃষি ব্যবসা নিয়ে ব্যবহারিক গাইড—বাংলাদেশের কৃষক, বাগানপ্রেমী ও উদ্যোক্তাদের জন্য।</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#latest-guides" className="inline-flex min-h-12 items-center rounded-xl bg-[#17351f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#24552f]">সর্বশেষ গাইড দেখুন <span aria-hidden="true" className="ml-2">↓</span></a>
              <Link href="/learn" className="inline-flex min-h-12 items-center rounded-xl border border-[#cbdcc7] bg-white/80 px-5 py-3 text-sm font-bold text-[#17351f] hover:bg-white">কৃষি শেখার রিসোর্স</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:p-6"><span className="text-2xl" aria-hidden="true">🌾</span><h2 className="mt-4 font-black">ফসল চাষ</h2><p className="mt-2 text-sm leading-6 text-[#647468]">মৌসুম, পরিচর্যা ও মাঠের কাজ সম্পর্কে শিখুন।</p></div>
            <div className="mt-7 rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:p-6"><span className="text-2xl" aria-hidden="true">🌱</span><h2 className="mt-4 font-black">গাছ ও বাগান</h2><p className="mt-2 text-sm leading-6 text-[#647468]">ছাদবাগান, চারা এবং গাছের পরিচর্যা।</p></div>
            <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:p-6"><span className="text-2xl" aria-hidden="true">🔎</span><h2 className="mt-4 font-black">সমস্যা বুঝুন</h2><p className="mt-2 text-sm leading-6 text-[#647468]">লক্ষণ যাচাই ও নির্ভরযোগ্য তথ্য খোঁজা।</p></div>
            <div className="mt-7 rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:p-6"><span className="text-2xl" aria-hidden="true">📈</span><h2 className="mt-4 font-black">কৃষি ব্যবসা</h2><p className="mt-2 text-sm leading-6 text-[#647468]">খরচ, বাজার ও ব্যবসায়িক সিদ্ধান্ত।</p></div>
          </div>
        </div>
      </section>

      <section id="latest-guides" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#b58b28]">পড়ুন ও শিখুন</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">সর্বশেষ কৃষি গাইড</h2><p className="mt-2 text-sm leading-6 text-[#647468]">প্রকাশিত আর্টিকেলগুলো থেকে আপনার প্রয়োজনের তথ্য খুঁজুন।</p></div>
          <p className="rounded-full border border-[#dce6d7] bg-white px-4 py-2 text-sm font-semibold text-[#526858]">{articles.length}টি প্রকাশিত গাইড</p>
        </div>

        {latest ? (
          <>
            <article className="mt-7 grid overflow-hidden rounded-3xl border border-[#dce6d7] bg-white shadow-sm md:grid-cols-[.8fr_1.2fr]">
              <div aria-hidden="true" className="flex min-h-52 items-center justify-center bg-gradient-to-br from-[#dcebd4] via-[#edf5e8] to-[#c4dfbd] p-8"><div className="text-center"><span className="text-6xl">🌿</span><p className="mt-3 text-xs font-extrabold uppercase tracking-[.2em] text-[#366848]">AGRIVA FIELD NOTES</p></div></div>
              <div className="flex flex-col items-start p-6 sm:p-9">
                <span className="rounded-full bg-[#eef5ed] px-3 py-1.5 text-xs font-bold text-[#276340]">সর্বশেষ প্রকাশিত</span>
                <p className="mt-4 text-sm font-bold text-[#9b7723]">{latest.primary_keyword}</p>
                <h3 className="mt-2 text-2xl font-black leading-snug sm:text-3xl"><Link href={`/blog/${latest.slug}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-[#39754b]">{latest.title}</Link></h3>
                {latest.meta_description && <p className="mt-4 max-w-2xl leading-7 text-[#647468]">{latest.meta_description}</p>}
                {latest.updated_at && <p className="mt-3 text-xs text-[#778579]">সর্বশেষ আপডেট: {new Date(latest.updated_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Dhaka" })}</p>}
                <Link href={`/blog/${latest.slug}`} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-5 py-3 text-sm font-bold text-white">গাইডটি পড়ুন <span aria-hidden="true" className="ml-2">→</span></Link>
              </div>
            </article>
            {remaining.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {remaining.map((article) => <article key={article.slug} className="flex flex-col rounded-2xl border border-[#e0e8dc] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
                <p className="text-xs font-bold text-[#9b7723]">{article.primary_keyword}</p>
                <h3 className="mt-3 text-xl font-black leading-snug"><Link href={`/blog/${article.slug}`} className="hover:underline">{article.title}</Link></h3>
                {article.meta_description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#647468]">{article.meta_description}</p>}
                {article.updated_at && <p className="mt-4 text-xs text-[#778579]">আপডেট: {new Date(article.updated_at).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Dhaka" })}</p>}
                <Link href={`/blog/${article.slug}`} className="mt-auto inline-flex min-h-10 items-center pt-5 text-sm font-bold text-[#17613c]">গাইডটি পড়ুন <span aria-hidden="true" className="ml-2">→</span></Link>
              </article>)}
            </div>}
          </>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed border-[#cbdcc7] bg-white p-8 sm:p-12">
            <span className="text-4xl" aria-hidden="true">📚</span><h3 className="mt-4 text-2xl font-black">যাচাইকৃত কৃষি গাইড শিগগিরই আসছে</h3><p className="mt-3 max-w-2xl leading-7 text-[#647468]">প্রকাশের জন্য অনুমোদিত আর্টিকেল এখানে দেখা যাবে। ততক্ষণে কৃষি শেখার রিসোর্স দেখুন।</p><Link href="/learn" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white">কৃষি শেখার রিসোর্স দেখুন</Link>
          </div>
        )}
      </section>

      <section className="border-t border-[#e2eadd] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-3 sm:py-12">
          <div><h2 className="font-black">তথ্য যাচাই করুন</h2><p className="mt-2 text-sm leading-6 text-[#647468]">কৃষি-সংক্রান্ত গুরুত্বপূর্ণ সিদ্ধান্তে নির্ভরযোগ্য সূত্র ও স্থানীয় পরামর্শ মিলিয়ে নিন।</p></div>
          <div><h2 className="font-black">প্রয়োজন অনুযায়ী পড়ুন</h2><p className="mt-2 text-sm leading-6 text-[#647468]">ফসল, গাছের যত্ন ও কৃষি ব্যবসার গাইড থেকে আপনার প্রশ্নের উত্তর খুঁজুন।</p></div>
          <div><h2 className="font-black">আরও ভালো গাইড তৈরি হচ্ছে</h2><p className="mt-2 text-sm leading-6 text-[#647468]">AGRIVA-র লক্ষ্য হলো সহজ ভাষায় ব্যবহারিক, যাচাইকৃত ও নিয়মিত আপডেট হওয়া কৃষি জ্ঞান দেওয়া।</p></div>
        </div>
      </section>
    </main>
  );
}

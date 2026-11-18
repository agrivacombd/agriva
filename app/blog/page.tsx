import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ArticlesBrowser from "./articles-browser";
import KnowledgeNetwork from "@/components/learn/KnowledgeNetwork";
import { getLearnBlogFeed, type BlogFeedEntry } from "@/lib/learn/blog-feed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "কৃষি ব্লগ, চাষাবাদ গাইড ও Learn ফিড",
  description: "AGRIVA Blog-এ কৃষি প্রবন্ধের সঙ্গে Learn বিভাগের ধান চাষ, সবজি, মাটির স্বাস্থ্য ও বালাই ব্যবস্থাপনার ব্যবহারিক গাইড দেখুন।",
  alternates: { canonical: "/blog", languages: { "bn-BD": "/blog", en: "/en/blog", "x-default": "/blog" } },
  openGraph: {
    siteName: "AGRIVA",
    title: "AGRIVA Blog | কৃষি প্রবন্ধ ও শেখার গাইড",
    description: "প্রকাশিত কৃষি প্রবন্ধ ও AGRIVA Learn-এর ব্যবহারিক গাইড এক জায়গায়।",
    url: "/blog", type: "website", locale: "bn_BD",
  },
  twitter: { card: "summary_large_image" },
};

export default async function BlogPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let cmsArticles: BlogFeedEntry[] = [];
  if (url && key) {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from("content_drafts")
      .select("slug,title,meta_description,primary_keyword,created_at,hero_image_url,hero_image_alt")
      .eq("status", "published").eq("content_type", "article").is("deleted_at",null)
      .order("created_at", { ascending: false }).limit(100);
    if (!error) cmsArticles = (data || []).filter(item => item.slug).map(item => ({
      slug: item.slug, href: `/blog/${item.slug}`, source: "blog" as const,
      category: item.primary_keyword || "কৃষি প্রবন্ধ", title: item.title,
      excerpt: item.meta_description || "AGRIVA-তে প্রকাশিত কৃষি বিষয়ক লেখা।",
      date: new Date(item.created_at).toLocaleDateString("bn-BD"),
      readTime: "প্রবন্ধ", emoji: "📝",
      heroImageUrl: item.hero_image_url || null,
      heroImageAlt: item.hero_image_alt || item.title,
    }));
  }

  // Learn is the single content source: no duplicate body, no duplicate /blog/slug.
  const learnEntries = getLearnBlogFeed();
  const articles = [...cmsArticles, ...learnEntries];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const listingJsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "AGRIVA Blog | কৃষি প্রবন্ধ ও শেখার গাইড",
    description: "প্রকাশিত কৃষি প্রবন্ধ ও AGRIVA Learn-এর গাইড।",
    url: `${siteUrl}/blog`, inLanguage: "bn-BD",
    isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
    mainEntity: { "@type": "ItemList", itemListElement: articles.map((article, index) => ({
      "@type": "ListItem", position: index + 1, name: article.title, url: `${siteUrl}${article.href}`,
    })) },
  };

  return (
    <main className="min-h-screen bg-[#f8faf7] text-[#183a27]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd).replace(/</g, "\\u003c") }} />
      <header className="relative overflow-hidden bg-gradient-to-br from-[#103c2a] via-[#155b3b] to-[#32784f] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[55px] border-white/5 sm:h-[32rem] sm:w-[32rem]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <nav aria-label="Breadcrumb" className="text-sm text-emerald-100"><Link href="/" className="rounded-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">হোম</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page">ব্লগ</span></nav>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[.22em] text-emerald-200">AGRIVA JOURNAL · KNOWLEDGE HUB</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.3] tracking-tight sm:text-5xl lg:text-6xl">কৃষির জ্ঞান, গল্প ও নতুন সম্ভাবনা</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50 sm:text-lg sm:leading-9">চাষাবাদ, বীজ, ফসলের যত্ন, কৃষি প্রযুক্তি ও বাস্তব অভিজ্ঞতা নিয়ে তথ্যসমৃদ্ধ প্রবন্ধ। প্রয়োজনীয় বিষয় খুঁজুন, সময় নিয়ে পড়ুন, কাজে লাগান।</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#articles" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">প্রবন্ধ ঘুরে দেখুন <span aria-hidden="true" className="ml-2">↓</span></a>
            <Link href="/learn" className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">শেখার কেন্দ্র</Link>
            <Link href="/en/blog" hrefLang="en" lang="en" className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Read in English →</Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">READ · LEARN · GROW</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">আপনার কৃষি জ্ঞানের ঠিকানা</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">AGRIVA-র প্রকাশিত প্রবন্ধ ও Learn-এর ব্যবহারিক গাইড একই জায়গায়। মূল লেখার লিংক অপরিবর্তিত থাকে, তাই সহজেই শেয়ার ও সংরক্ষণ করতে পারবেন।</p>
        </div>
        <ArticlesBrowser articles={articles} />
        <KnowledgeNetwork current="/blog" className="mt-12" />
        <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">মাটি, জাত, মৌসুম ও স্থানীয় আবহাওয়ার ওপর কৃষি পরামর্শ নির্ভর করে। নির্দিষ্ট সিদ্ধান্তের আগে সরকারি বা স্থানীয় কৃষি পরামর্শ যাচাই করুন।</aside>
      </section>
    </main>
  );
}

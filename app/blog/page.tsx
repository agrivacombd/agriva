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
  alternates: { canonical: "/blog" },
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
    <main className="min-h-screen bg-[#f6f8f3] text-[#183a27]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd).replace(/</g, "\\u003c") }} />
      <header className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#28734b] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <Link href="/" className="text-sm font-bold text-emerald-100 hover:text-white">← AGRIVA হোম</Link>
          <p className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide">AGRIVA · BLOG + LEARN</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">কৃষির গল্প, গাইড ও শেখার কেন্দ্র</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-lg">প্রকাশিত কৃষি প্রবন্ধ এবং Learn-এর ধাপে ধাপে গাইড একই ফিডে। পড়ুন, শিখুন ও প্রয়োগ করুন।</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/learn" className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold hover:bg-white/10">Learn Center দেখুন</Link>
            <Link href="/learn/plant-science" className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold hover:bg-white/10">Plant Science Academy</Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">AGRIVA Knowledge Feed</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">প্রবন্ধ ও Learn গাইড</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Learn-এ নতুন গাইড যোগ হলে এখানেও স্বয়ংক্রিয়ভাবে যুক্ত হবে। মূল গাইডের URL অপরিবর্তিত থাকবে।</p>
          </div>
          <p className="text-sm font-semibold text-slate-500">{articles.length}টি লেখা ও গাইড</p>
        </div>
        <ArticlesBrowser articles={articles} />
        <KnowledgeNetwork current="/blog" className="mt-8" />
        <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">মাটি, জাত, মৌসুম ও স্থানীয় আবহাওয়ার ওপর কৃষি পরামর্শ নির্ভর করে। নির্দিষ্ট সিদ্ধান্তের আগে সরকারি বা স্থানীয় কৃষি পরামর্শ যাচাই করুন।</aside>
      </section>
    </main>
  );
}

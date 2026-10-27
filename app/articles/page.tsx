import type { Metadata } from "next";
import Link from "next/link";

type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  emoji: string;
};

const articles: Article[] = [
  {
    slug: "boro-rice-season-preparation",
    category: "ফসল চাষ",
    title: "বোরো ধান চাষের আগে জমি প্রস্তুতির গুরুত্বপূর্ণ ধাপ",
    excerpt: "সেচ, জমি সমতল করা, চারা নির্বাচন ও রোপণের সময় পরিকল্পনা—মৌসুম শুরুর আগে যে বিষয়গুলো গুছিয়ে নেওয়া দরকার।",
    date: "কৃষি নির্দেশিকা",
    readTime: "৫ মিনিট",
    emoji: "🌾",
  },
  {
    slug: "soil-health-basics",
    category: "মাটির স্বাস্থ্য",
    title: "মাটির স্বাস্থ্য ভালো রাখতে জৈব পদার্থের ভূমিকা",
    excerpt: "কম্পোস্ট, ফসলের অবশিষ্টাংশ এবং মাটি পরীক্ষা কীভাবে দীর্ঘমেয়াদে জমির উৎপাদনক্ষমতা ধরে রাখতে সাহায্য করে।",
    date: "মাটি ও সার",
    readTime: "৪ মিনিট",
    emoji: "🌱",
  },
  {
    slug: "integrated-pest-management",
    category: "রোগবালাই",
    title: "সমন্বিত বালাই ব্যবস্থাপনা: পর্যবেক্ষণ থেকে সিদ্ধান্ত",
    excerpt: "ক্ষেতে নিয়মিত পর্যবেক্ষণ, উপকারী পোকা সংরক্ষণ এবং প্রয়োজন অনুযায়ী নিরাপদ ব্যবস্থা বেছে নেওয়ার প্রাথমিক ধারণা।",
    date: "ফসল সুরক্ষা",
    readTime: "৬ মিনিট",
    emoji: "🐞",
  },
  {
    slug: "vegetable-garden-water-management",
    category: "সবজি",
    title: "সবজি বাগানে সঠিক পানি ব্যবস্থাপনার সহজ কৌশল",
    excerpt: "মাটির আর্দ্রতা, আবহাওয়া ও গাছের বৃদ্ধির ধাপ দেখে সেচের পরিকল্পনা করার ব্যবহারিক পরামর্শ।",
    date: "সবজি চাষ",
    readTime: "৪ মিনিট",
    emoji: "🥬",
  },
];

export const metadata: Metadata = {
  title: "কৃষি ব্লগ ও প্রবন্ধ",
  description: "বাংলাদেশের কৃষি, ফসল চাষ, মাটির স্বাস্থ্য, রোগবালাই ও কৃষি প্রযুক্তি নিয়ে AGRIVA ব্লগের লেখা পড়ুন।",
  alternates: { canonical: "/articles" },
  twitter: { card: "summary_large_image", title: "AGRIVA Blog | কৃষি বিষয়ক লেখা ও অভিজ্ঞতা", description: "কৃষি, ফসল চাষ, মাটির স্বাস্থ্য ও কৃষি প্রযুক্তি নিয়ে সহজ বাংলায় লেখা।" },
  openGraph: {
    siteName: "AGRIVA",
    title: "AGRIVA Blog | কৃষি বিষয়ক লেখা ও অভিজ্ঞতা",
    description: "কৃষি, ফসল চাষ, মাটির স্বাস্থ্য ও কৃষি প্রযুক্তি নিয়ে সহজ বাংলায় লেখা।",
    url: "/articles",
    type: "website",
    locale: "bn_BD",
  },
};

export default function ArticlesPage() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\\/$/, "");
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AGRIVA Blog | কৃষি বিষয়ক লেখা ও অভিজ্ঞতা",
    description: "বাংলাদেশের কৃষি, ফসল চাষ, মাটির স্বাস্থ্য, রোগবালাই ও কৃষি প্রযুক্তি নিয়ে AGRIVA ব্লগের লেখা পড়ুন।",
    url: `${siteUrl}/articles`,
    inLanguage: "bn-BD",
    isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
    mainEntity: { "@type": "ItemList", itemListElement: articles.map((article, index) => ({ "@type": "ListItem", position: index + 1, name: article.title, url: `${siteUrl}/articles/${article.slug}` })) },
  };
  const categories = ["সব লেখা", "ফসল চাষ", "মাটির স্বাস্থ্য", "রোগবালাই", "সবজি"];

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#183a27]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd).replace(/</g, "\\\\u003c") }} />
      <header className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#28734b] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link href="/" className="text-sm font-bold text-emerald-100 hover:text-white">← AGRIVA হোম</Link>
          <p className="mt-7 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide">AGRIVA · BLOG</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">কৃষির গল্প, জ্ঞান ও নতুন ভাবনা</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-lg">ফসল চাষ, মাটির যত্ন, রোগবালাই ব্যবস্থাপনা ও কৃষি প্রযুক্তি নিয়ে সহজ বাংলায় লেখা পড়ুন।</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/learn" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold transition hover:bg-white/10">কৃষি শেখার কেন্দ্র →</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Read & grow</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">সাম্প্রতিক লেখা</h2><p className="mt-2 text-sm leading-6 text-slate-600">কৃষি বিষয়ে ধারণা ও অভিজ্ঞতা জানুন।</p></div>
          <p className="text-sm font-semibold text-slate-500">{articles.length}টি লেখা</p>
        </div>

        <div aria-label="লেখার ক্যাটাগরি" className="mt-6 flex flex-wrap gap-2">
          {categories.map((category, index) => <span key={category} className={index === 0 ? "rounded-full bg-emerald-800 px-4 py-2 text-sm font-bold text-white" : "rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900"}>{category}</span>)}
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div aria-hidden="true" className="flex min-h-36 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 text-6xl">{article.emoji}</div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800"><span className="rounded-full bg-emerald-50 px-3 py-1">{article.category}</span><span className="text-slate-400">·</span><span className="text-slate-500">{article.readTime} পড়া</span></div>
                <h3 className="mt-4 text-xl font-black leading-snug text-slate-900">{article.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-medium text-slate-500">{article.date}</span><Link href={`/articles/${article.slug}`} className="text-sm font-extrabold text-emerald-800 group-hover:underline">লেখাটি পড়ুন →</Link></div>
              </div>
            </article>
          ))}
        </div>
        <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">মাটি, জাত, মৌসুম ও এলাকার আবহাওয়া অনুযায়ী কৃষি পরামর্শ ভিন্ন হতে পারে। নির্দিষ্ট সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</aside>
      </section>
    </main>
  );
}

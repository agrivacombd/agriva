import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgress, ShareArticle } from "../../articles/article-reading-tools";
import { getPublishedContentArticleBySlug, type PublishedContentArticle } from "@/lib/content/published-articles";

const articles = [
  {
    slug: "boro-rice-season-preparation",
    category: "ফসল চাষ",
    title: "বোরো ধান চাষের আগে জমি প্রস্তুতির গুরুত্বপূর্ণ ধাপ",
    readTime: "৫ মিনিট",
    emoji: "🌾",
    intro: "বোরো ধানের ভালো ফলনের জন্য মৌসুম শুরুর আগেই জমি, সেচ এবং চারা রোপণের পরিকল্পনা গুছিয়ে নেওয়া গুরুত্বপূর্ণ। জমির অবস্থা ও স্থানীয় কৃষি পরামর্শ অনুযায়ী কাজের সময় ঠিক করুন।",
    sections: [
      ["জমি ও পানি ব্যবস্থাপনা যাচাই করুন", "জমির উঁচু-নিচু অংশ, পানি নিষ্কাশনের ব্যবস্থা এবং সেচের নির্ভরযোগ্যতা দেখুন। জমি সমতল হলে সেচের পানি তুলনামূলক সমানভাবে ছড়াতে পারে।"],
      ["মানসম্মত বীজ ও সুস্থ চারা বেছে নিন", "এলাকার মৌসুম, জমির ধরন ও সুপারিশকৃত জাত অনুযায়ী বীজ নির্বাচন করুন। বীজতলায় রোগাক্রান্ত বা দুর্বল চারা থাকলে সেগুলো আলাদা করুন।"],
      ["সময়মতো জমি প্রস্তুত করুন", "আগের ফসলের অবশিষ্টাংশ, মাটির আর্দ্রতা ও জমির গঠন বিবেচনা করে জমি তৈরি করুন। সার ব্যবহারের আগে সম্ভব হলে মাটি পরীক্ষা ও স্থানীয় সুপারিশ অনুসরণ করুন।"],
    ],
  },
  {
    slug: "soil-health-basics",
    category: "মাটির স্বাস্থ্য",
    title: "মাটির স্বাস্থ্য ভালো রাখতে জৈব পদার্থের ভূমিকা",
    readTime: "৪ মিনিট",
    emoji: "🌱",
    intro: "উৎপাদনশীল মাটি শুধু গাছকে পুষ্টি দেয় না; পানি ধরে রাখা, শিকড়ের বৃদ্ধি এবং মাটির জীববৈচিত্র্য বজায় রাখতেও ভূমিকা রাখে। জৈব পদার্থ মাটির এই গুণগুলো উন্নত করতে সহায়তা করতে পারে।",
    sections: [
      ["কম্পোস্ট ও পচা জৈব সার ব্যবহার", "ভালোভাবে পচানো কম্পোস্ট মাটিতে জৈব পদার্থ যোগ করতে পারে। কাঁচা বা অপরিপক্ব উপাদান সরাসরি ব্যবহার করলে সমস্যা হতে পারে, তাই পরিপক্বতা নিশ্চিত করুন।"],
      ["ফসলের অবশিষ্টাংশের সঠিক ব্যবস্থাপনা", "নিরাপদ ও উপযুক্ত হলে ফসলের অবশিষ্টাংশ মাটিতে ফিরিয়ে দেওয়া জৈব পদার্থ বাড়ানোর একটি উপায়। রোগাক্রান্ত অবশিষ্টাংশের ক্ষেত্রে স্থানীয় কৃষি নির্দেশনা মেনে চলুন।"],
      ["মাটি পরীক্ষা ও ভারসাম্য বজায় রাখুন", "জৈব সারও পরিকল্পনা করে ব্যবহার করা উচিত। মাটি পরীক্ষা এবং ফসলভিত্তিক সুপারিশের মাধ্যমে পুষ্টির ঘাটতি ও অতিরিক্ত ব্যবহারের ঝুঁকি কমানো যায়।"],
    ],
  },
  {
    slug: "integrated-pest-management",
    category: "রোগবালাই",
    title: "সমন্বিত বালাই ব্যবস্থাপনা: পর্যবেক্ষণ থেকে সিদ্ধান্ত",
    readTime: "৬ মিনিট",
    emoji: "🐞",
    intro: "সমন্বিত বালাই ব্যবস্থাপনায় নিয়মিত পর্যবেক্ষণ, প্রতিরোধমূলক চাষাবাদ, উপকারী জীব সংরক্ষণ এবং প্রয়োজন হলে লক্ষ্যভিত্তিক ব্যবস্থা একসঙ্গে বিবেচনা করা হয়।",
    sections: [
      ["ক্ষেত নিয়মিত পর্যবেক্ষণ করুন", "গাছের পাতা, কাণ্ড ও ফলের পরিবর্তন দেখুন। কোথায় লক্ষণ দেখা যাচ্ছে, কত গাছে ছড়িয়েছে এবং সময়ের সঙ্গে বাড়ছে কি না—এসব নোট করুন।"],
      ["উপকারী পোকা ও জীববৈচিত্র্য রক্ষা করুন", "সব পোকা ক্ষতিকর নয়। উপকারী পোকা শনাক্ত করতে শিখুন এবং অপ্রয়োজনীয় কীটনাশক ব্যবহার এড়িয়ে চলুন।"],
      ["প্রয়োজনে নিরাপদ ও সুপারিশকৃত ব্যবস্থা নিন", "লক্ষণ দেখে নিশ্চিত রোগ নির্ণয় সবসময় সম্ভব নয়। স্থানীয় কৃষি কর্মকর্তা বা নির্ভরযোগ্য সরকারি নির্দেশনা অনুসরণ করুন এবং যেকোনো বালাইনাশকের লেবেল ও নিরাপত্তা বিধি মেনে চলুন।"],
    ],
  },
  {
    slug: "vegetable-garden-water-management",
    category: "সবজি",
    title: "সবজি বাগানে সঠিক পানি ব্যবস্থাপনার সহজ কৌশল",
    readTime: "৪ মিনিট",
    emoji: "🥬",
    intro: "সবজি গাছে অতিরিক্ত ও অপর্যাপ্ত—দুই ধরনের সেচই সমস্যার কারণ হতে পারে। মাটির আর্দ্রতা, আবহাওয়া এবং গাছের বৃদ্ধির ধাপ দেখে সেচ পরিকল্পনা করা ভালো।",
    sections: [
      ["মাটির আর্দ্রতা পরীক্ষা করুন", "শুধু উপরিভাগ শুকনো দেখেই সেচের সিদ্ধান্ত নেবেন না। শিকড়ের কাছের মাটি পরীক্ষা করুন এবং জমির ধরন অনুযায়ী পানি দেওয়ার ব্যবধান ঠিক করুন।"],
      ["সকালের সময়কে অগ্রাধিকার দিন", "সম্ভব হলে এমন সময় সেচ দিন যাতে গাছ পানি ব্যবহার করতে পারে এবং পাতায় দীর্ঘক্ষণ আর্দ্রতা জমে না থাকে। স্থানীয় আবহাওয়া ও সেচ ব্যবস্থার উপযোগিতা বিবেচনা করুন।"],
      ["পানি জমে থাকা ও অপচয় কমান", "নিষ্কাশনের ব্যবস্থা ঠিক রাখুন এবং গাছের গোড়ায় প্রয়োজন অনুযায়ী পানি পৌঁছানোর চেষ্টা করুন। বৃষ্টির পূর্বাভাস থাকলে সেচের পরিকল্পনা পুনর্বিবেচনা করুন।"],
    ],
  },
];

type Article = (typeof articles)[number];

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedContentArticleBySlug(slug);
  if (published) {
    const description = published.meta_description || published.body_markdown?.replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim().slice(0, 320) || published.title;
    const title = published.meta_title || published.title;
    return {
      title,
      description,
      alternates: { canonical: `/blog/${published.slug}` },
      openGraph: { siteName: "AGRIVA", title, description, url: `/blog/${published.slug}`, type: "article", locale: "bn_BD" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const article = articles.find((item) => item.slug === slug);
  if (!article) return { title: "লেখা পাওয়া যায়নি" };
  return {
    title: article.title,
    description: article.intro,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: { siteName: "AGRIVA", title: article.title, description: article.intro, url: `/blog/${article.slug}`, type: "article", locale: "bn_BD" },
    twitter: { card: "summary_large_image", title: article.title, description: article.intro },
  };
}

function renderMarkdown(markdown: string, title: string) {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (/^#\s+/.test(block) && block.slice(2).trim() === title.trim()) return null;
    if (/^###\s+/.test(block)) return <h3 key={index} className="mt-6 text-lg font-black text-slate-900">{block.replace(/^###\s+/, "")}</h3>;
    if (/^##\s+/.test(block)) return <h2 key={index} className="mt-8 border-t border-slate-100 pt-5 text-xl font-black text-slate-900">{block.replace(/^##\s+/, "")}</h2>;
    if (/^#\s+/.test(block)) return <h2 key={index} className="mt-8 text-2xl font-black text-slate-900">{block.replace(/^#\s+/, "")}</h2>;

    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return <ul key={index} className="mt-4 list-disc space-y-2 pl-6 text-sm leading-8 text-slate-700 sm:text-base">{lines.map((line, itemIndex) => <li key={itemIndex}>{line.replace(/^\s*[-*]\s+/, "")}</li>)}</ul>;
    }
    if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
      return <ol key={index} className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-8 text-slate-700 sm:text-base">{lines.map((line, itemIndex) => <li key={itemIndex}>{line.replace(/^\s*\d+\.\s+/, "")}</li>)}</ol>;
    }
    return <p key={index} className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-700 sm:text-base">{block}</p>;
  });
}

function PublishedContentArticle({ article }: { article: PublishedContentArticle }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/blog/${article.slug}`;
  const description = article.meta_description || article.body_markdown?.replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim().slice(0, 320) || article.title;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    dateModified: article.updated_at,
    url: articleUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    author: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    publisher: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    inLanguage: "bn-BD",
    isAccessibleForFree: true,
  };

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-8 text-[#183a27] sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl">
        <ReadingProgress />
        <nav aria-label="Breadcrumb" className="text-sm text-emerald-800"><Link href="/" className="hover:underline">হোম</Link> / <Link href="/blog" className="hover:underline">AGRIVA Blog</Link> / <span>{article.title}</span></nav>
        <header className="mt-7 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div aria-hidden="true" className="flex min-h-36 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 text-6xl">📝</div>
          <div className="p-6 sm:p-9">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">AGRIVA নির্দেশিকা</span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{article.title}</h1>
            <p className="mt-4 text-sm text-slate-500">AGRIVA Blog · আপডেট {new Date(article.updated_at).toLocaleDateString("bn-BD")}</p>
            {description && <p className="mt-5 text-base leading-8 text-slate-700">{description}</p>}
          </div>
        </header>
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">
          {renderMarkdown(article.body_markdown || description, article.title)}
          <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">এই লেখা সাধারণ শিক্ষামূলক তথ্যের জন্য। ফসল, মাটি, জাত ও এলাকার পরিস্থিতি অনুযায়ী সিদ্ধান্ত নিতে স্থানীয় কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</aside>
        </div>
        <div className="mt-7 flex flex-wrap items-start gap-3">
          <ShareArticle title={article.title} />
          <Link href="/blog" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-900">← সব লেখা</Link>
          <Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">কৃষি শেখার কেন্দ্র →</Link>
        </div>
      </article>
    </main>
  );
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const published = await getPublishedContentArticleBySlug(slug);
  if (published) return <PublishedContentArticle article={published} />;

  const article: Article | undefined = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/blog/${article.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.intro,
    url: articleUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    author: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    publisher: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    articleSection: article.category,
    inLanguage: "bn-BD",
    isAccessibleForFree: true,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "AGRIVA Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-8 text-[#183a27] sm:px-6 sm:py-12">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-800">
          <Link href="/" className="hover:underline">হোম</Link><span aria-hidden="true">/</span><Link href="/blog" className="hover:underline">Blog</Link><span aria-hidden="true">/</span><span className="text-slate-500">{article.category}</span>
        </nav>
        <header className="mt-7 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div aria-hidden="true" className="flex min-h-48 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 text-7xl sm:min-h-60">{article.emoji}</div>
          <div className="p-6 sm:p-9">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">{article.category}</span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{article.title}</h1>
            <p className="mt-4 text-sm text-slate-500">AGRIVA Blog · আনুমানিক {article.readTime} পড়া</p>
            <p className="mt-5 text-base leading-8 text-slate-700">{article.intro}</p>
          </div>
        </header>

        <nav aria-label="এই লেখার বিষয়বস্তু" className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-base font-black text-slate-900">এই লেখায় যা থাকছে</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-emerald-800">
            {article.sections.map(([heading], index) => <li key={heading}><a className="font-semibold hover:underline" href={`#section-${index + 1}`}>{heading}</a></li>)}
          </ol>
        </nav>

        <div className="mt-6 space-y-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">
          {article.sections.map(([heading, body], index) => (
            <section id={`section-${index + 1}`} key={heading} className={index ? "scroll-mt-6 border-t border-slate-100 pt-5" : "scroll-mt-6"}>
              <h2 className="text-xl font-black text-slate-900">{index + 1}. {heading}</h2>
              <p className="mt-3 text-sm leading-8 text-slate-700 sm:text-base">{body}</p>
            </section>
          ))}
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">এই লেখা সাধারণ শিক্ষামূলক তথ্যের জন্য। ফসল, মাটি, জাত ও এলাকার পরিস্থিতি অনুযায়ী সিদ্ধান্ত নিতে স্থানীয় কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</aside>
        </div>

        <div className="mt-7 flex flex-wrap items-start gap-3">
          <ShareArticle title={article.title} />
          <Link href="/blog" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-900">← সব লেখা</Link>
          <Link href="/learn" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">কৃষি শেখার কেন্দ্র →</Link>
        </div>
      </article>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

// Render a deliberately small, safe Markdown subset as React elements. Content is
// always emitted as text (never injected as HTML), so authored HTML cannot execute.
function renderMarkdown(source: string) {
  return source.split(/\r?\n/).map((line, index) => {
    const key = `line-${index}`;
    const trimmed = line.trim();
    if (!trimmed) return null;
    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const className = level === 1 ? "mt-8 text-3xl font-black" : level === 2 ? "mt-7 text-2xl font-bold" : level === 3 ? "mt-6 text-xl font-bold" : "mt-5 text-lg font-bold";
      if (level === 1) return <h2 key={key} className={className}>{heading[2]}</h2>;
      if (level === 2) return <h2 key={key} className={className}>{heading[2]}</h2>;
      if (level === 3) return <h3 key={key} className={className}>{heading[2]}</h3>;
      return <h4 key={key} className={className}>{heading[2]}</h4>;
    }
    if (/^[-*+]\s+/.test(trimmed)) return <p key={key} className="my-2 pl-5">{`• ${trimmed.replace(/^[-*+]\s+/, "")}`}</p>;
    if (/^\d+[.)]\s+/.test(trimmed)) return <p key={key} className="my-2 pl-5">{`${trimmed.match(/^\d+/)?.[0]}. ${trimmed.replace(/^\d+[.)]\s+/, "")}`}</p>;
    if (trimmed.startsWith("> ")) return <blockquote key={key} className="border-l-4 border-[#d8e4d3] pl-4 italic">{trimmed.slice(2)}</blockquote>;
    if (trimmed.startsWith("---") || trimmed === "***") return <hr key={key} className="my-6 border-[#e4eadf]" />;
    return <p key={key} className="my-4 leading-8">{trimmed}</p>;
  });
}

type ArticleData = {
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string;
  body_markdown: string | null;
  created_at: string;
  updated_at: string;
};

async function getArticle(slug: string): Promise<ArticleData | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("content_drafts")
    .select("title,slug,meta_title,meta_description,primary_keyword,body_markdown,created_at,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("content_type", "article")
    .maybeSingle();
  if (error || !data) return null;
  return data as ArticleData;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found | AGRIVA", robots: { index: false, follow: false } };
  const description = article.meta_description?.trim() || `Agriculture guide about ${article.primary_keyword} from AGRIVA.`;
  return {
    title: article.meta_title?.trim() || article.title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "article", siteName: "AGRIVA", title: article.meta_title?.trim() || article.title, description, url: `/blog/${article.slug}` },
    twitter: { card: "summary_large_image", title: article.meta_title?.trim() || article.title, description },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || `Agriculture guide about ${article.primary_keyword} from AGRIVA.`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${article.slug}` },
    url: `${siteUrl}/blog/${article.slug}`,
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    publisher: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
    inLanguage: "bn-BD",
    keywords: article.primary_keyword,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Agriculture Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${siteUrl}/blog/${article.slug}` },
    ],
  };

  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-14 text-[#17351f]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
    <article className="mx-auto max-w-4xl rounded-3xl bg-white p-7 shadow-sm md:p-12">
      <nav aria-label="Breadcrumb" className="text-sm text-[#647468]"><Link href="/" className="hover:underline">Home</Link><span aria-hidden="true"> / </span><Link href="/blog" className="hover:underline">Agriculture Blog</Link></nav>
      <p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Agriculture Guide</p>
      <h1 className="mt-4 text-3xl font-black md:text-5xl">{article.title}</h1>
      <p className="mt-4 text-sm text-[#647468]">বিষয়: {article.primary_keyword}</p>
      <div className="prose prose-lg mt-10 max-w-none break-words text-[#304936]">{article.body_markdown?.trim() ? renderMarkdown(article.body_markdown) : <p>এই নিবন্ধটি সম্পাদনা করা হচ্ছে।</p>}</div>
      <div className="mt-10 border-t border-[#e4eadf] pt-6"><Link href="/blog" className="font-bold text-[#17613c] hover:underline">← সব কৃষি গাইড দেখুন</Link></div>
    </article>
  </main>;
}

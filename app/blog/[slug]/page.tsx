import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type ArticleRecord = {
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  body_markdown: string | null;
  created_at: string | null;
  updated_at?: string | null;
  status: string;
};

async function getArticle(slug: string): Promise<ArticleRecord | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("content_drafts")
    .select("title,slug,meta_title,meta_description,primary_keyword,body_markdown,created_at,updated_at,status")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("content_type", "article")
    .maybeSingle();
  return (data as ArticleRecord | null) ?? null;
}

function getDescription(article: ArticleRecord) {
  const explicit = article.meta_description?.trim();
  if (explicit) return explicit.slice(0, 160);
  const excerpt = (article.body_markdown || "")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (excerpt || `বাংলাদেশের কৃষকদের জন্য ${article.title} বিষয়ে ব্যবহারিক বাংলা কৃষি গাইড।`).slice(0, 160);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: "প্রবন্ধ পাওয়া যায়নি | AGRIVA", robots: { index: false, follow: false } };
  }
  const title = article.meta_title?.trim() || article.title;
  const description = getDescription(article);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      type: "article",
      locale: "bn_BD",
      siteName: "AGRIVA",
      title,
      description,
      url: `/blog/${article.slug}`,
      ...(article.created_at ? { publishedTime: article.created_at } : {}),
      ...(article.updated_at ? { modifiedTime: article.updated_at } : {}),
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\\/$/, "");
  const canonicalUrl = `${base}/blog/${article.slug}`;
  const description = getDescription(article);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    headline: article.title,
    description,
    url: canonicalUrl,
    inLanguage: "bn-BD",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    publisher: { "@type": "Organization", name: "AGRIVA", url: base },
    ...(article.created_at ? { datePublished: article.created_at } : {}),
    ...(article.updated_at || article.created_at ? { dateModified: article.updated_at || article.created_at } : {}),
    ...(article.primary_keyword ? { about: article.primary_keyword } : {}),
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-6 py-14 text-[#17351f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-7 shadow-sm md:p-12">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA কৃষি জ্ঞান</p>
        <h1 className="mt-4 text-4xl font-black md:text-5xl">{article.title}</h1>
        {article.primary_keyword && <p className="mt-4 text-sm text-[#647468]">মূল বিষয়: {article.primary_keyword}</p>}
        <div className="prose prose-lg mt-10 max-w-none whitespace-pre-wrap text-[#304936]">{article.body_markdown || "এই নিবন্ধটি প্রস্তুত করা হচ্ছে।"}</div>
      </article>
    </main>
  );
}

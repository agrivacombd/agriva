import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Agriculture Blog | AGRIVA",
  description: "Practical agriculture guides, farming tips, crop information and marketplace insights from AGRIVA.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: "AGRIVA",
    title: "Agriculture Blog | AGRIVA",
    description: "Farmer-friendly, reviewed agriculture guides and practical farming knowledge.",
    url: "/blog",
  },
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
  const supabase = createClient(url, key);
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
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

  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-14 text-[#17351f]">
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Knowledge</p>
      <h1 className="mt-3 text-4xl font-black sm:text-5xl">Agriculture Blog</h1>
      <p className="mt-4 max-w-2xl text-[#647468]">Farmer-friendly guides, crop knowledge, agricultural tools and practical marketplace resources.</p>
      {articles.length > 0 ? <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }} />
        <p className="mt-8 text-sm text-[#647468]">{articles.length} published {articles.length === 1 ? "article" : "articles"}</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => <article key={article.slug} className="rounded-2xl border border-[#e4eadf] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#b58b28]">{article.primary_keyword}</p>
            <h2 className="mt-3 text-xl font-black leading-snug"><Link href={`/blog/${article.slug}`} className="hover:underline">{article.title}</Link></h2>
            {article.meta_description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#647468]">{article.meta_description}</p>}
            <Link href={`/blog/${article.slug}`} className="mt-5 inline-flex min-h-10 items-center font-bold text-[#17613c]">গাইডটি পড়ুন →</Link>
          </article>)}
        </div>
      </> : <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black">নতুন কৃষি গাইড শিগগিরই আসছে</h2>
        <p className="mt-3 text-[#647468]">যাচাই করা ও প্রকাশের জন্য অনুমোদিত AGRIVA কৃষি গাইড এখানে দেখা যাবে।</p>
        <Link href="/learn" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white">কৃষি শেখার রিসোর্স দেখুন</Link>
      </div>}
    </div>
  </main>;
}

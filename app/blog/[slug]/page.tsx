import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleMarkdown, parseArticleMarkdown } from "@/lib/content/article-markdown";
import { LEGACY_BLOG_LEARN_REDIRECTS } from "@/lib/learn/blog-feed";
import { ReadingProgress, ShareArticle } from "../../articles/article-reading-tools";
import { ReadingPreferences } from "./reading-preferences";

type CmsArticle = {
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  body_markdown: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  created_at: string;
  updated_at: string | null;
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

async function getCmsArticle(slug: string): Promise<CmsArticle | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("content_drafts")
    .select("title,slug,meta_title,meta_description,primary_keyword,body_markdown,hero_image_url,hero_image_alt,created_at,updated_at")
    .eq("slug", slug).eq("status", "published").eq("content_type", "article").is("deleted_at", null).maybeSingle();
  return error || !data ? null : data as CmsArticle;
}

type RecommendedArticle = {slug:string;title:string;meta_description:string|null;hero_image_url:string|null;primary_keyword:string|null;created_at:string};
const STOP_WORDS = new Set(["এবং","কিভাবে","কীভাবে","করে","করার","একটি","জন্য","থেকে","সঙ্গে","সম্পূর্ণ","বাংলাদেশ","বাংলাদেশে","গাইড","guide","bangladesh","the","and","with","for","কৃষি","চাষ","পরিচর্যা","ব্যবস্থাপনা"]);
function articleTopicWords(value: string): Set<string> {
  return new Set((value.toLocaleLowerCase().match(/[\\p{L}\\p{N}]+/gu)||[])
    .filter(word=>word.length>=3&&!STOP_WORDS.has(word)));
}
async function getRelatedArticles(article:CmsArticle):Promise<{items:RecommendedArticle[];related:boolean}> {
  const supabase=publicClient();
  if(!supabase)return {items:[],related:false};
  const {data,error}=await supabase.from("content_drafts")
    .select("slug,title,meta_description,hero_image_url,primary_keyword,created_at")
    .eq("status","published").eq("content_type","article").is("deleted_at",null)
    .neq("slug",article.slug).order("created_at",{ascending:false}).limit(100);
  if(error||!data)return {items:[],related:false};
  const entries=(data as RecommendedArticle[]).filter(item=>item.slug&&item.title);
  const titleWords=articleTopicWords(article.title),keywordWords=articleTopicWords(article.primary_keyword||"");
  const matches=entries.map((item,index)=>{
    const candidate=articleTopicWords(item.title+" "+(item.primary_keyword||""));
    const overlaps=[...titleWords].filter(word=>candidate.has(word)).length;
    const keywordOverlaps=[...keywordWords].filter(word=>candidate.has(word)).length;
    const exact=!!(article.primary_keyword&&item.primary_keyword&&article.primary_keyword.trim().toLocaleLowerCase()===item.primary_keyword.trim().toLocaleLowerCase());
    return {item,index,score:overlaps*3+keywordOverlaps*4+(exact?10:0)};
  }).filter(entry=>entry.score>0)
    .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,6).map(entry=>entry.item);
  return matches.length?{items:matches,related:true}:{items:entries.slice(0,6),related:false};
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getCmsArticle(slug);
  if (article) {
    // Use the image we know exists, rather than guessing that a -social.webp variant was generated.
    const images = article.hero_image_url ? [{ url: article.hero_image_url, alt: article.hero_image_alt || article.title }] : undefined;
    return {
      title: article.meta_title || article.title,
      description: article.meta_description || undefined,
      alternates: { canonical: `/blog/${article.slug}` },
      openGraph: {
        type: "article", siteName: "AGRIVA", title: article.meta_title || article.title,
        description: article.meta_description || undefined, url: `/blog/${article.slug}`,
        locale: "bn_BD", publishedTime: article.created_at, modifiedTime: article.updated_at || article.created_at,
        ...(images ? { images } : {}),
      },
      twitter: { card: "summary_large_image", title: article.meta_title || article.title, description: article.meta_description || undefined, ...(images ? { images: [article.hero_image_url!] } : {}) },
    };
  }
  const destination = LEGACY_BLOG_LEARN_REDIRECTS[slug];
  if (destination) return { title: "কৃষি গাইড | AGRIVA Learn", alternates: { canonical: destination }, robots: { index: false, follow: true } };
  return { title: "লেখা পাওয়া যায়নি | AGRIVA", robots: { index: false, follow: false } };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getCmsArticle(slug);
  if (!article) {
    const destination = LEGACY_BLOG_LEARN_REDIRECTS[slug];
    if (destination) permanentRedirect(destination);
    notFound();
  }
  const related = await getRelatedArticles(article);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/+$/, "");
  const url = `${siteUrl}/blog/${article.slug}`;
  // The article template already supplies the page H1.
  const body = (article.body_markdown || "").replace(/^#\s+([^\r\n]+)\r?\n*/, (match, heading: string) => heading.trim() === article.title.trim() ? "" : match);
  const blocks = parseArticleMarkdown(body);
  const toc = blocks.map((block, index) => ({ block, index }))
    .filter(({ block }) => block.kind === "h2" || block.kind === "h3")
    .map(({ block, index }) => ({ id: `section-${index}`, text: block.lines[0].replace(/\*\*/g, ""), level: block.kind }));
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(words / 180));
  const publishedDate = new Date(article.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
  const modifiedDate = article.updated_at && article.updated_at !== article.created_at
    ? new Date(article.updated_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }) : null;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: article.title,
    description: article.meta_description || undefined, url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    datePublished: article.created_at, dateModified: article.updated_at || article.created_at,
    ...(article.hero_image_url ? { image: article.hero_image_url } : {}),
    inLanguage: "bn-BD", isAccessibleForFree: true,
    isPartOf: { "@id": `${siteUrl}/#website` },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "AGRIVA Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };
  const encodeJson = (value: object) => JSON.stringify(value).replace(/</g, "\\u003c");

  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-[#f8faf7] text-slate-900">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: encodeJson(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: encodeJson(breadcrumbJsonLd) }} />
      {related.items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: encodeJson({
        "@context": "https://schema.org", "@type": "ItemList", name: related.related ? "Related AGRIVA articles" : "More AGRIVA articles",
        itemListElement: related.items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${siteUrl}/blog/${item.slug}` })),
      }) }} />}
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 pb-12 pt-6 min-[380px]:px-4 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-emerald-800 sm:text-sm">
          <Link href="/" className="hover:underline focus-visible:outline-2 focus-visible:outline-emerald-700">হোম</Link>
          <span aria-hidden="true" className="text-slate-400">/</span>
          <Link href="/blog" className="hover:underline focus-visible:outline-2 focus-visible:outline-emerald-700">ব্লগ</Link>
          <span aria-hidden="true" className="text-slate-400">/</span>
          <span aria-current="page" className="min-w-0 max-w-[min(65vw,18rem)] truncate text-slate-500 sm:max-w-lg">{article.title}</span>
        </nav>
        <article>
          <header className="mx-auto mt-8 min-w-0 max-w-4xl text-center sm:mt-12">
            <p className="break-words text-xs font-extrabold uppercase tracking-[.08em] text-emerald-700 sm:tracking-[.18em]">{article.primary_keyword || "কৃষি প্রবন্ধ"} · AGRIVA JOURNAL</p>
            <h1 className="mx-auto mt-4 max-w-4xl break-words text-[clamp(1.55rem,6vw,2.2rem)] font-black leading-[1.48] tracking-tight text-slate-950 sm:text-[2.6rem] lg:text-[3.2rem]">{article.title}</h1>
            {article.meta_description && <p className="mx-auto mt-5 max-w-3xl break-words text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-9">{article.meta_description}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
              <span className="font-extrabold text-emerald-800">AGRIVA সম্পাদকীয়</span>
              <span aria-hidden="true">·</span><time dateTime={article.created_at}>{publishedDate}</time>
              <span aria-hidden="true">·</span><span>প্রায় {readingMinutes.toLocaleString("bn-BD")} মিনিট পড়া</span>
              {modifiedDate && <><span aria-hidden="true">·</span><span>হালনাগাদ: {modifiedDate}</span></>}
            </div>
          </header>

          {article.hero_image_url && (
            <figure className="mx-auto mt-7 w-full min-w-0 max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm min-[380px]:p-2 sm:mt-9 sm:rounded-3xl sm:p-4">
              {/* Preserve the original full hero artwork, including text and logo near the edges. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.hero_image_url} alt={article.hero_image_alt || article.title} loading="eager" decoding="async" className="mx-auto block h-auto w-full max-w-full object-contain" />
              {article.hero_image_alt && <figcaption className="px-3 pb-1 pt-3 text-center text-xs leading-6 text-slate-500">{article.hero_image_alt}</figcaption>}
            </figure>
          )}

          <div className="mx-auto mt-7 grid w-full min-w-0 max-w-6xl grid-cols-1 items-start gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
            <div className="min-w-0">
              {toc.length > 0 && (
                <details className="mb-5 min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 lg:hidden">
                  <summary className="cursor-pointer text-base font-extrabold text-emerald-900">এই লেখায় যা আছে</summary>
                  <nav aria-label="লেখার সূচিপত্র" className="mt-4">
                    <ol className="min-w-0 space-y-3">{toc.map(item => <li key={item.id} className={item.level === "h3" ? "pl-4" : ""}><a className="block break-words py-1 text-sm leading-6 text-slate-700 underline-offset-4 hover:text-emerald-800 hover:underline" href={`#${item.id}`}>{item.text}</a></li>)}</ol>
                  </nav>
                </details>
              )}
              <ReadingPreferences>
                <section aria-label="প্রবন্ধের মূল লেখা" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-3 py-6 shadow-sm min-[380px]:px-4 sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10">
                  <ArticleMarkdown body={body} headingLinks />
                </section>
              </ReadingPreferences>
              <div className="mt-7 flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
                <ShareArticle title={article.title} />
                <Link href="/blog" className="inline-flex min-h-11 items-center text-sm font-extrabold text-emerald-800 hover:underline">← আরও প্রবন্ধ পড়ুন</Link>
              </div>
              <aside className="mt-6 break-words rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-950 sm:px-5">
                কৃষি পরামর্শ মাটি, জাত, মৌসুম ও স্থানীয় আবহাওয়ার ওপর নির্ভর করে। মাঠে প্রয়োগের আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।
              </aside>
            </div>
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                {toc.length > 0 && (
                  <nav aria-label="লেখার সূচিপত্র" className="max-h-[65vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="mb-4 text-sm font-extrabold text-slate-900">এই লেখায় যা আছে</p>
                    <ol className="space-y-3 border-l-2 border-emerald-100 pl-4">{toc.map(item => <li key={item.id} className={item.level === "h3" ? "pl-3" : ""}><a href={`#${item.id}`} className="block text-sm leading-6 text-slate-600 transition hover:text-emerald-800 hover:underline">{item.text}</a></li>)}</ol>
                  </nav>
                )}
                <div className="rounded-2xl bg-emerald-900 p-5 text-white">
                  <p className="text-sm font-extrabold">আরও জানতে চান?</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-100">AGRIVA Learn-এ কৃষি বিষয়ে আরও ব্যবহারিক গাইড পড়ুন।</p>
                  <Link href="/learn" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-emerald-900 hover:bg-emerald-50">Learn Center দেখুন →</Link>
                </div>
              </div>
            </aside>
          </div>
        </article>

        {related.items.length > 0 && (
          <section aria-labelledby="related-articles" className="mx-auto mt-16 max-w-6xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">KEEP READING</p><h2 id="related-articles" className="mt-2 text-2xl font-black sm:text-3xl">{related.related ? "একই বিষয়ে আরও পড়ুন" : "সম্প্রতি প্রকাশিত আরও প্রবন্ধ"}</h2></div>
              <Link href="/blog" className="text-sm font-bold text-emerald-800 hover:underline">সব প্রবন্ধ →</Link>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {related.items.map(item => (
                <article key={item.slug} className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
                  <Link href={`/blog/${item.slug}`} aria-label={item.title} className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
                    {item.hero_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.hero_image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    ) : <span aria-hidden="true" className="text-5xl">🌱</span>}
                  </Link>
                  <div className="flex flex-1 flex-col px-2 py-4">
                    <h3 className="text-lg font-extrabold leading-7 text-slate-950"><Link href={`/blog/${item.slug}`} className="hover:text-emerald-800">{item.title}</Link></h3>
                    {item.meta_description && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{item.meta_description}</p>}
                    <Link href={`/blog/${item.slug}`} className="mt-4 text-sm font-bold text-emerald-800 hover:underline">পড়ুন →</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

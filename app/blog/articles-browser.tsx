"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BlogFeedEntry } from "@/lib/learn/blog-feed";

const PAGE_SIZE = 9;
const sourceFilters = [
  { value: "all", label: "সব লেখা" },
  { value: "blog", label: "প্রবন্ধ" },
  { value: "learn", label: "শেখার গাইড" },
] as const;

function ArticleArtwork({ article, priority = false }: { article: BlogFeedEntry; priority?: boolean }) {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#edf6e9] to-[#dceee0]">
      {article.heroImageUrl ? (
        // Full artwork is intentionally contained, never cropped; this also preserves image text.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.heroImageUrl} alt={article.heroImageAlt || article.title} loading={priority ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain" />
      ) : (
        <span aria-hidden="true" className="text-6xl sm:text-7xl">{article.emoji}</span>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: BlogFeedEntry }) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-600">
      <Link href={article.href} aria-label={article.title} className="block rounded-2xl focus-visible:outline-none">
        <ArticleArtwork article={article} />
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1">{article.category}</span>
          <span className="text-slate-500">{article.source === "learn" ? "Learn গাইড" : "প্রবন্ধ"}</span>
        </div>
        <h3 className="mt-3 text-[1.2rem] font-extrabold leading-[1.55] text-slate-950 sm:text-[1.3rem]">
          <Link href={article.href} className="rounded-sm hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">{article.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-slate-600">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{article.source === "learn" ? article.readTime + " পড়া" : article.date}</span>
          <Link href={article.href} className="rounded-sm text-sm font-bold text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">পড়ুন <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}

export default function ArticlesBrowser({ articles }: { articles: BlogFeedEntry[] }) {
  const [source, setSource] = useState<"all" | "blog" | "learn">("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "title">("latest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categories = useMemo(() => [...new Set(articles.map(article => article.category))].sort((a, b) => a.localeCompare(b, "bn")), [articles]);
  const featured = articles.find(article => article.source === "blog") || articles[0];

  const filteredArticles = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    const matching = articles.filter(article => {
      const sourceMatch = source === "all" || article.source === source;
      const categoryMatch = category === "all" || article.category === category;
      const text = `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase();
      return sourceMatch && categoryMatch && (!search || text.includes(search));
    });
    return sort === "title" ? [...matching].sort((a, b) => a.title.localeCompare(b.title, "bn")) : matching;
  }, [articles, source, category, query, sort]);

  const resetPage = () => setVisibleCount(PAGE_SIZE);
  const isDefaultView = !query.trim() && source === "all" && category === "all" && sort === "latest";
  // Featured content is shown once, not repeated immediately in the listing.
  const listArticles = isDefaultView && featured ? filteredArticles.filter(article => article.href !== featured.href) : filteredArticles;
  const visibleArticles = listArticles.slice(0, visibleCount);

  return (
    <div className="mt-8">
      {featured && isDefaultView && (
        <section aria-labelledby="featured-article-heading" className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="featured-article-heading" className="text-xl font-extrabold text-slate-950 sm:text-2xl">বিশেষভাবে নির্বাচিত</h3>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">FEATURED STORY</span>
          </div>
          <article className="grid items-center gap-5 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-2 md:gap-8 md:p-6 lg:gap-12">
            <Link href={featured.href} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600" aria-label={featured.title}>
              <ArticleArtwork article={featured} priority />
            </Link>
            <div className="min-w-0 px-1 py-2 md:pr-5">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">{featured.category} · {featured.source === "blog" ? "কৃষি প্রবন্ধ" : "Learn গাইড"}</p>
              <h4 className="mt-3 text-2xl font-black leading-[1.45] text-slate-950 sm:text-3xl"><Link href={featured.href} className="hover:text-emerald-800">{featured.title}</Link></h4>
              <p className="mt-4 line-clamp-4 text-base leading-8 text-slate-600">{featured.excerpt}</p>
              <p className="mt-4 text-xs font-medium text-slate-500">{featured.source === "learn" ? featured.readTime + " পড়া" : featured.date}</p>
              <Link href={featured.href} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">পুরো লেখাটি পড়ুন <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
          </article>
        </section>
      )}
      <section aria-labelledby="article-list-heading" id="articles">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">EXPLORE AGRIVA</p>
            <h3 id="article-list-heading" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">সব প্রবন্ধ ও গাইড</h3>
          </div>
          <span className="text-sm font-semibold text-slate-500">{filteredArticles.length.toLocaleString("bn-BD")}টি ফলাফল</span>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label htmlFor="article-search" className="mb-2 block text-sm font-bold text-slate-800">লেখা খুঁজুন</label>
              <input id="article-search" type="search" value={query} onChange={event => { setQuery(event.target.value); resetPage(); }} placeholder="ধান, বীজ, মাটি, রোগবালাই…" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label htmlFor="article-sort" className="mb-2 block text-sm font-bold text-slate-800">সাজান</label>
              <select id="article-sort" value={sort} onChange={event => { setSort(event.target.value as "latest" | "title"); resetPage(); }} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 lg:w-44">
                <option value="latest">সাম্প্রতিক আগে</option>
                <option value="title">নাম অনুসারে</option>
              </select>
            </div>
          </div>
          <div aria-label="লেখার ধরন" className="mt-5 flex flex-wrap gap-2">
            {sourceFilters.map(option => <button key={option.value} type="button" aria-pressed={source === option.value} onClick={() => { setSource(option.value); resetPage(); }} className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${source === option.value ? "bg-emerald-800 text-white" : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"}`}>{option.label}</button>)}
          </div>
          <div className="mt-4">
            <label htmlFor="article-category" className="mb-2 block text-sm font-bold text-slate-800">বিষয় নির্বাচন</label>
            <select id="article-category" value={category} onChange={event => { setCategory(event.target.value); resetPage(); }} className="min-h-11 w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100">
              <option value="all">সব বিষয়</option>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-500" role="status" aria-live="polite">{filteredArticles.length.toLocaleString("bn-BD")}টি লেখা পাওয়া গেছে</p>
        {filteredArticles.length ? (
          <>
            {visibleArticles.length > 0 && <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleArticles.map(article => <ArticleCard article={article} key={article.href} />)}</div>}
            {visibleCount < listArticles.length && <div className="mt-9 text-center"><button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="min-h-12 rounded-xl border border-emerald-700 bg-white px-6 py-3 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">আরও লেখা দেখুন</button></div>}
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
            <p className="text-lg font-extrabold text-slate-900">এই খোঁজে কোনো লেখা পাওয়া যায়নি</p>
            <p className="mt-2 text-sm text-slate-600">অন্য শব্দ দিয়ে খুঁজুন অথবা ফিল্টার সরিয়ে দেখুন।</p>
            <button type="button" onClick={() => { setSource("all"); setCategory("all"); setQuery(""); setSort("latest"); resetPage(); }} className="mt-5 min-h-11 rounded-xl bg-emerald-800 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-900">সব লেখা দেখুন</button>
          </div>
        )}
      </section>
    </div>
  );
}

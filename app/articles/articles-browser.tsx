"use client";

import { useMemo, useState } from "react";
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

const categories = ["সব লেখা", "ফসল চাষ", "মাটির স্বাস্থ্য", "রোগবালাই", "সবজি"];

export default function ArticlesBrowser({ articles }: { articles: Article[] }) {
  const [activeCategory, setActiveCategory] = useState("সব লেখা");
  const [query, setQuery] = useState("");
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bn");
    return articles.filter((article) => {
      const matchesCategory = activeCategory === "সব লেখা" || article.category === activeCategory;
      const searchable = `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase("bn");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, articles, query]);

  return (
    <>
      <div className="mt-6">
        <label htmlFor="article-search" className="sr-only">কৃষি বিষয়ক লেখা খুঁজুন</label>
        <div className="relative max-w-xl">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">⌕</span>
          <input
            id="article-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="লেখা খুঁজুন—যেমন ধান, মাটি, সেচ..."
            className="min-h-12 w-full rounded-2xl border border-emerald-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div aria-label="লেখার ক্যাটাগরি" className="mt-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveCategory(category)}
              className={active
                ? "rounded-full bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm"
                : "rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:border-emerald-500 hover:bg-emerald-50"}
            >
              {category}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-slate-500" aria-live="polite">
        {filteredArticles.length}টি লেখা পাওয়া গেছে
      </p>

      {filteredArticles.length ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {filteredArticles.map((article) => (
            <article key={article.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div aria-hidden="true" className="flex min-h-36 items-center justify-center bg-gradient-to-br from-emerald-50 via-lime-50 to-emerald-100 text-6xl">{article.emoji}</div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800">
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{article.category}</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="text-slate-500">{article.readTime} পড়া</span>
                </div>
                <h3 className="mt-4 text-xl font-black leading-snug text-slate-900">{article.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-500">{article.date}</span>
                  <Link href={`/articles/${article.slug}`} className="text-sm font-extrabold text-emerald-800 group-hover:underline">লেখাটি পড়ুন →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
          <p className="text-lg font-extrabold text-slate-800">এই খোঁজে কোনো লেখা পাওয়া যায়নি</p>
          <p className="mt-2 text-sm text-slate-500">অন্য শব্দ দিয়ে খুঁজুন অথবা সব লেখা দেখুন।</p>
          <button type="button" onClick={() => { setQuery(""); setActiveCategory("সব লেখা"); }} className="mt-5 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900">সব লেখা দেখুন</button>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug?: string | null;
  subcategory_slug?: string | null;
  description: string | null;
  price: number | string | null;
  stock: number | null;
  image_url?: string | null;
};

type CategoryMode = "taxonomy" | "available";

const money = (value: number | string | null) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(Number(value || 0));

const categoryIcon = (value: string) => {
  const label = value.normalize("NFKC").toLocaleLowerCase();
  if (/ফুল|flower/.test(label)) return "🌸";
  if (/ফল|fruit/.test(label)) return "🍋";
  if (/বীজ|seed/.test(label)) return "🌱";
  if (/টব|pot/.test(label)) return "🪴";
  if (/সার|মাটি|soil|fertili/.test(label)) return "🌿";
  if (/ইনডোর|indoor/.test(label)) return "🪴";
  if (/যন্ত্র|tool/.test(label)) return "🧤";
  return "🌳";
};

export default function MarketplaceCore({
  products,
  showCategories = true,
  initialQuery = "",
  categoryMode = "taxonomy",
}: {
  products: MarketplaceProduct[];
  showCategories?: boolean;
  initialQuery?: string;
  categoryMode?: CategoryMode;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [stockOnly, setStockOnly] = useState(false);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      const label = (product.category || "অন্যান্য").trim();
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, icon: categoryIcon(name) }))
      .sort((a, b) => a.name.localeCompare(b.name, "bn"));
  }, [products]);

  const visible = useMemo(() => {
    const search = query.trim().normalize("NFKC").toLocaleLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery = !search || [product.name, product.category, product.description]
        .some((value) => (value || "").normalize("NFKC").toLocaleLowerCase().includes(search));
      const matchesSelected = category === "all" || (product.category || "অন্যান্য") === category;
      const matchesStock = !stockOnly || Number(product.stock || 0) > 0;
      return matchesQuery && matchesSelected && matchesStock;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-low") return Number(a.price || 0) - Number(b.price || 0);
      if (sort === "price-high") return Number(b.price || 0) - Number(a.price || 0);
      if (sort === "name") return a.name.localeCompare(b.name, "bn");
      return 0;
    });
  }, [products, query, category, stockOnly, sort]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("newest");
    setStockOnly(false);
  };

  return <div>
    <div className="rounded-2xl border border-emerald-950/10 bg-white p-3 shadow-sm sm:p-4">
      <label className="block">
        <span className="mb-2 block text-xs font-extrabold text-slate-600">পণ্য খুঁজুন</span>
        <span className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-700/10">
          <span aria-hidden="true" className="text-xl text-emerald-800">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="গাছ, বীজ বা পণ্যের নাম লিখুন..." className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
          {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50">মুছুন</button>}
        </span>
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-slate-600">ক্যাটাগরি</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10">
            <option value="all">সব ক্যাটাগরি</option>
            {(categoryMode === "available" ? availableCategories.map((item) => item.name) : Array.from(new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "bn"))).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-slate-600">সাজান</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10">
            <option value="newest">নতুন পণ্য আগে</option>
            <option value="price-low">দাম: কম থেকে বেশি</option>
            <option value="price-high">দাম: বেশি থেকে কম</option>
            <option value="name">নাম অনুযায়ী</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} className="h-4 w-4 accent-emerald-800" />
          স্টকে আছে
        </label>
      </div>
    </div>

    {showCategories && <section className="mt-8" aria-labelledby="marketplace-categories-heading">
      <div className="flex items-end justify-between gap-3">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Shop by category</p><h2 id="marketplace-categories-heading" className="mt-2 text-2xl font-black">ক্যাটাগরি অনুযায়ী খুঁজুন</h2><p className="mt-1 text-sm text-slate-600">আপনার প্রয়োজনের বিভাগ বেছে নিন</p></div>
        {category !== "all" && <button type="button" onClick={() => setCategory("all")} className="text-xs font-extrabold text-emerald-800 underline underline-offset-4">সব দেখুন</button>}
      </div>
      {categoryMode === "available" ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {availableCategories.map((item) => <button key={item.name} type="button" onClick={() => setCategory(category === item.name ? "all" : item.name)} aria-pressed={category === item.name} className={`group min-h-32 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700 ${category === item.name ? "border-emerald-700 bg-emerald-50 shadow-sm" : "border-emerald-950/10 bg-white hover:border-emerald-700/40"}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">{item.icon}</span>
            <span className="mt-3 block text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">{item.name}</span>
            <span className="mt-1 block text-xs text-slate-500">{money(item.count)}টি পণ্য</span>
          </button>)}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MARKETPLACE_CATEGORIES.map((item) => <Link key={item.slug} href={`/marketplace/category/${item.slug}`} className="group rounded-2xl border border-emerald-950/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">{item.icon}</span><h3 className="mt-3 text-sm font-extrabold group-hover:text-emerald-800">{item.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></Link>)}
        </div>
      )}
    </section>}

    <section className="mt-10" aria-labelledby="marketplace-products-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Product catalogue</p><h2 id="marketplace-products-heading" className="mt-2 text-2xl font-black">{showCategories ? "আপনার পছন্দের পণ্য" : "পণ্য তালিকা"}</h2></div>
        <span className="text-sm font-bold text-slate-500">{money(visible.length)}টি পণ্য</span>
      </div>
      {visible.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">{visible.map((product) => <article key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={`/marketplace/${product.slug}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100 text-5xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-700" aria-label={`${product.name} পণ্যের বিস্তারিত`}>
          <span aria-hidden="true">{categoryIcon(product.category || "")}</span>
          {product.image_url && <img src={product.image_url} alt={`${product.name} product photo`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full bg-white object-contain p-2" />}
        </Link>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <p className="text-xs font-bold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
          <h3 className="mt-2 line-clamp-2 min-h-10 break-words text-sm font-extrabold leading-5 text-slate-900"><Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800">{product.name}</Link></h3>
          <p className="mt-3 text-lg font-black text-emerald-900">৳{money(product.price)}</p>
          <p className={`mt-1 text-xs ${Number(product.stock || 0) > 0 ? "text-slate-500" : "font-semibold text-rose-700"}`}>{Number(product.stock || 0) > 0 ? `মজুত: ${money(product.stock)}` : "স্টকে নেই"}</p>
          <Link href={`/marketplace/${product.slug}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-900 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">বিস্তারিত ও কেনাকাটা →</Link>
        </div>
      </article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-emerald-950/20 bg-white p-8 text-center">
        <span aria-hidden="true" className="text-4xl">🔎</span><p className="mt-3 font-extrabold">এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি</p><p className="mt-2 text-sm text-slate-500">অন্য নাম বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p><button type="button" onClick={resetFilters} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">ফিল্টার মুছুন</button>
      </div>}
    </section>
  </div>;
}

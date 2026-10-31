"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MARKETPLACE_CATEGORIES, getProductTaxonomy } from "@/lib/marketplace/taxonomy";

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

type SortOption = "relevance" | "newest" | "price-low" | "price-high";

const money = (value: number | string) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(Number(value));

function normalize(value: string | null | undefined) {
  return (value || "").normalize("NFKC").trim().toLocaleLowerCase();
}

function productMatchesCategory(product: MarketplaceProduct, categorySlug: string) {
  if (categorySlug === "all") return true;
  return getProductTaxonomy(product.category, product.category_slug, product.subcategory_slug)?.category.slug === categorySlug;
}

function ProductCard({ product }: { product: MarketplaceProduct }) {
  const hasPrice = product.price !== null && product.price !== undefined && String(product.price).trim() !== "";
  const hasStock = product.stock !== null && product.stock !== undefined;
  const inStock = Number(product.stock || 0) > 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-lg">
      <Link href={`/marketplace/${product.slug}`} className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100 text-5xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700" aria-label={`${product.name} পণ্যের বিস্তারিত দেখুন`}>
        <span aria-hidden="true">🌾</span>
        {product.image_url && <img src={product.image_url} alt={`${product.name} পণ্যের ছবি`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full bg-white object-contain p-2" />}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${inStock ? "bg-white/95 text-emerald-800" : "bg-slate-900/75 text-white"}`}>
          {inStock ? "স্টকে আছে" : hasStock ? "স্টক শেষ" : "স্টক যাচাই করুন"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-bold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 break-words text-sm font-extrabold leading-5 text-slate-900">
          <Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800 focus-visible:outline-none focus-visible:underline">{product.name}</Link>
        </h3>
        <p className="mt-3 text-base font-black text-emerald-950 sm:text-lg">
          {hasPrice && Number(product.price) > 0 ? `৳${money(product.price as number | string)}` : "দাম জানতে যোগাযোগ করুন"}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {hasStock ? (inStock ? `মজুত: ${money(product.stock as number)}` : "বর্তমানে মজুত নেই") : "মজুতের তথ্য জানতে যোগাযোগ করুন"}
        </p>
        <Link href={`/marketplace/${product.slug}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-900 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
          বিস্তারিত ও যোগাযোগ <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      </div>
    </article>
  );
}

export default function MarketplaceCore({ products, showCategories = true, initialQuery = "" }: { products: MarketplaceProduct[]; showCategories?: boolean; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const categoryCounts = useMemo(() => {
    return MARKETPLACE_CATEGORIES.map((item) => ({
      ...item,
      count: products.filter((product) => productMatchesCategory(product, item.slug)).length,
    }));
  }, [products]);

  const visible = useMemo(() => {
    const search = normalize(query);
    const filtered = products.filter((product) => {
      const matchesSearch = !search || [product.name, product.category, product.description]
        .some((value) => normalize(value).includes(search));
      return matchesSearch && productMatchesCategory(product, category);
    });

    return filtered.sort((a, b) => {
      if (sort === "price-low" || sort === "price-high") {
        const aMissing = a.price === null || a.price === undefined || String(a.price).trim() === "";
        const bMissing = b.price === null || b.price === undefined || String(b.price).trim() === "";
        if (aMissing !== bMissing) return aMissing ? 1 : -1;
        const aPrice = Number(a.price);
        const bPrice = Number(b.price);
        return sort === "price-low" ? aPrice - bPrice : bPrice - aPrice;
      }
      return 0;
    });
  }, [products, query, category, sort]);

  const selectedCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === category);

  return (
    <div>
      <section className="rounded-3xl border border-emerald-950/10 bg-white p-3 shadow-sm sm:p-5" aria-label="পণ্য খুঁজুন">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-700/10">
            <span aria-hidden="true" className="text-xl text-emerald-800">⌕</span>
            <span className="sr-only">পণ্যের নাম লিখে খুঁজুন</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="কী খুঁজছেন? যেমন: ধানের বীজ, জৈব সার, স্প্রেয়ার..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 sm:text-base" />
            {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200" aria-label="সার্চ মুছুন">মুছুন</button>}
          </label>
          <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-800 px-5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 lg:hidden">
            <span aria-hidden="true">☷</span> ক্যাটাগরি ও ফিল্টার
          </button>
          <label className="hidden min-w-48 lg:block">
            <span className="sr-only">পণ্য সাজান</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10">
              <option value="newest">নতুন পণ্য আগে</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="দ্রুত ক্যাটাগরি">
          <button type="button" onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${category === "all" ? "bg-emerald-900 text-white" : "bg-emerald-50 text-emerald-900"}`}>সব পণ্য</button>
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${category === item.slug ? "bg-emerald-900 text-white" : "bg-emerald-50 text-emerald-900"}`}>{item.name}</button>)}
        </div>
      </section>

      {showCategories && <section className="mt-8 sm:mt-10" aria-labelledby="marketplace-categories-heading">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Shop by category</p><h2 id="marketplace-categories-heading" className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">আপনার প্রয়োজন অনুযায়ী বেছে নিন</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm">ক্যাটাগরি বাছলে সেই ধরনের পণ্যগুলোই দেখাবে।</p></div>
          <button type="button" onClick={() => setCategory("all")} className="shrink-0 text-xs font-bold text-emerald-800 underline underline-offset-4">সব পণ্য</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {categoryCounts.map((item) => (
            <button type="button" key={item.slug} onClick={() => { setCategory(item.slug); document.getElementById("marketplace-product-list")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} aria-pressed={category === item.slug} className={`group flex min-h-28 flex-col items-start rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:min-h-32 sm:p-4 ${category === item.slug ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700/20" : "border-emerald-950/10 bg-white hover:border-emerald-700/40"}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">{item.icon}</span>
              <span className="mt-2 text-xs font-extrabold text-slate-900 sm:text-sm">{item.name}</span>
              <span className="mt-1 text-[10px] text-slate-500">{item.count ? `${new Intl.NumberFormat("bn-BD").format(item.count)}টি পণ্য` : "পণ্য আসছে"}</span>
            </button>
          ))}
        </div>
      </section>}

      <div id="marketplace-product-list" className="mt-9 scroll-mt-24 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black">ক্যাটাগরি</h2>
            <div className="mt-3 grid gap-1">
              <button type="button" onClick={() => setCategory("all")} className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-xs font-bold ${category === "all" ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>সব পণ্য</span><span>{products.length}</span></button>
              {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-semibold ${category === item.slug ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>{item.name}</span><span className="text-slate-400">{item.count}</span></button>)}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-black">পণ্য সাজান</h3>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="mt-2 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-700"><option value="newest">নতুন পণ্য আগে</option><option value="price-low">দাম: কম থেকে বেশি</option><option value="price-high">দাম: বেশি থেকে কম</option></select>
            </div>
          </div>
        </aside>

        <section aria-labelledby="marketplace-products-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Marketplace catalogue</p><h2 id="marketplace-products-heading" className="mt-1 text-xl font-black sm:text-2xl">{selectedCategory?.name || "সব পণ্য"}</h2><p className="mt-1 text-xs text-slate-500">{query ? `“${query}” অনুসন্ধানের ফলাফল` : "দাম, মজুত ও পণ্যের বিবরণ দেখে বেছে নিন"}</p></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{new Intl.NumberFormat("bn-BD").format(visible.length)}টি পণ্য</span>
              <label className="lg:hidden"><span className="sr-only">পণ্য সাজান</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold"><option value="newest">নতুন</option><option value="price-low">কম দাম</option><option value="price-high">বেশি দাম</option></select></label>
            </div>
          </div>
          {visible.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => <ProductCard key={product.id} product={product} />)}
          </div> : <div className="mt-4 rounded-2xl border border-dashed border-emerald-950/20 bg-white px-5 py-10 text-center sm:px-8">
            <span className="text-4xl" aria-hidden="true">🔎</span>
            <p className="mt-3 font-extrabold text-slate-900">এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">অন্য শব্দ দিয়ে খুঁজুন অথবা আপনার প্রয়োজনটি চাহিদা বোর্ডে জানান।</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50">ফিল্টার মুছুন</button><Link href="/buyer-demands" className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-xs font-extrabold text-white hover:bg-emerald-800">চাহিদা পোস্ট করুন</Link></div>
          </div>}
        </section>
      </div>

      {filtersOpen && <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
        <button type="button" aria-label="ফিল্টার বন্ধ করুন" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-slate-950/45" />
        <section role="dialog" aria-modal="true" aria-labelledby="marketplace-filter-title" className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
          <div className="flex items-center justify-between"><h2 id="marketplace-filter-title" className="text-lg font-black">ক্যাটাগরি ও সাজানো</h2><button type="button" onClick={() => setFiltersOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg" aria-label="বন্ধ করুন">×</button></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCategory("all")} className={`min-h-11 rounded-xl border px-3 text-left text-xs font-bold ${category === "all" ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-200"}`}>সব পণ্য</button>
            {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} className={`min-h-11 rounded-xl border px-3 text-left text-xs font-bold ${category === item.slug ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-200"}`}>{item.name}</button>)}
          </div>
          <label className="mt-5 block text-xs font-bold text-slate-700">পণ্য সাজান<select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="newest">নতুন পণ্য আগে</option><option value="price-low">দাম: কম থেকে বেশি</option><option value="price-high">দাম: বেশি থেকে কম</option></select></label>
          <button type="button" onClick={() => setFiltersOpen(false)} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-900 text-sm font-extrabold text-white">ফলাফল দেখুন ({new Intl.NumberFormat("bn-BD").format(visible.length)})</button>
        </section>
      </div>}
    </div>
  );
}

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
  unit?: string | null;
  image_url?: string | null;
};

type SortOption = "newest" | "price-low" | "price-high";
const PAGE_SIZE = 24;
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
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-xl hover:shadow-emerald-950/[0.06]">
      <Link href={`/marketplace/${product.slug}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f2f7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700" aria-label={`${product.name} পণ্যের বিস্তারিত দেখুন`}>
        <span aria-hidden="true" className="text-5xl opacity-60">🌱</span>
        {product.image_url && <img src={product.image_url} alt={`${product.name} পণ্যের ছবি`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full bg-white object-contain p-3 transition duration-300 group-hover:scale-[1.03]" />}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${inStock ? "bg-white/95 text-emerald-800" : "bg-slate-900/80 text-white"}`}>
          {inStock ? "স্টকে আছে" : hasStock ? "স্টক শেষ" : "স্টক যাচাই করুন"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-semibold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 break-words text-sm font-bold leading-5 text-slate-900">
          <Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800 focus-visible:outline-none focus-visible:underline">{product.name}</Link>
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-base font-black text-emerald-950 sm:text-lg">
            {hasPrice && Number(product.price) > 0 ? <>৳{money(product.price as number | string)}{product.unit ? <span className="text-xs font-semibold text-slate-500"> / {product.unit}</span> : null}</> : <span className="text-sm">দাম জানতে যোগাযোগ করুন</span>}
          </p>
          <Link href={`/marketplace/${product.slug}`} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
            বিস্তারিত দেখুন <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MarketplaceCore({ products, showCategories = true, initialQuery = "", emptyCatalogMessage }: { products: MarketplaceProduct[]; showCategories?: boolean; initialQuery?: string; emptyCatalogMessage?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const categoryCounts = useMemo(() => MARKETPLACE_CATEGORIES.map((item) => ({
    ...item,
    count: products.filter((product) => productMatchesCategory(product, item.slug)).length,
  })), [products]);

  const visible = useMemo(() => {
    const search = normalize(query);
    const filtered = products.filter((product) => {
      const matchesSearch = !search || [product.name, product.category, product.description, product.unit]
        .some((value) => normalize(value).includes(search));
      return matchesSearch && productMatchesCategory(product, category);
    });

    return filtered.sort((a, b) => {
      if (sort === "price-low" || sort === "price-high") {
        const aMissing = a.price === null || a.price === undefined || String(a.price).trim() === "";
        const bMissing = b.price === null || b.price === undefined || String(b.price).trim() === "";
        if (aMissing !== bMissing) return aMissing ? 1 : -1;
        const difference = Number(a.price) - Number(b.price);
        return sort === "price-low" ? difference : -difference;
      }
      return 0;
    });
  }, [products, query, category, sort]);

  useEffect(() => setPage(1), [query, category, sort]);
  const paginated = visible.slice(0, page * PAGE_SIZE);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === category);
  const hasActiveFilters = Boolean(query.trim()) || category !== "all";

  return (
    <div className="mt-6 lg:mt-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="পণ্য খুঁজুন">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-700/10">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-emerald-800"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span className="sr-only">পণ্যের নাম লিখে খুঁজুন</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="পণ্যের নাম লিখুন — যেমন ধানের বীজ, জৈব সার..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 sm:text-base" />
            {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200" aria-label="সার্চ মুছুন">মুছুন</button>}
          </label>
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 sm:w-56">
            <span className="shrink-0">সাজান</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none">
              <option value="newest">নতুন পণ্য</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </label>
        </div>
        {showCategories && <nav className="mt-3 -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="পণ্যের ক্যাটাগরি">
          <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${category === "all" ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-emerald-50"}`}>সব পণ্য</button>
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${category === item.slug ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-emerald-50"}`}>{item.name}</button>)}
        </nav>}
      </section>

      <div id="marketplace-product-list" className="mt-6 scroll-mt-24 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7">
        {showCategories && <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-extrabold text-slate-900">ক্যাটাগরি</h2>
            <nav className="mt-3 grid gap-1" aria-label="পণ্যের ক্যাটাগরি">
              <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-xs font-bold ${category === "all" ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>সব পণ্য</span><span>{products.length}</span></button>
              {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-semibold ${category === item.slug ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>{item.name}</span><span className="text-slate-400">{item.count}</span></button>)}
            </nav>
          </div>
        </aside>}

        <section aria-labelledby="marketplace-products-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="marketplace-products-heading" className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{selectedCategory?.name || "সব পণ্য"}</h2>
              <p className="mt-1 text-xs text-slate-500">{query ? `“${query}” অনুসন্ধানের ফলাফল` : "আপনার প্রয়োজনীয় কৃষিপণ্য বেছে নিন"}</p>
            </div>
            <p aria-live="polite" className="shrink-0 text-xs font-bold text-slate-500">{new Intl.NumberFormat("bn-BD").format(visible.length)}টি পণ্য</p>
          </div>

          {paginated.length ? <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {paginated.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {paginated.length < visible.length && <div className="mt-7 flex justify-center">
              <button type="button" onClick={() => setPage((current) => current + 1)} className="min-h-11 rounded-xl border border-emerald-800 bg-white px-6 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">আরও পণ্য দেখুন ({new Intl.NumberFormat("bn-BD").format(visible.length - paginated.length)}টি বাকি)</button>
            </div>}
          </> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:px-8">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">⌕</span>
            <p className="mt-4 font-extrabold text-slate-900">{emptyCatalogMessage ? "Marketplace ক্যাটালগ এখন খালি" : "এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি"}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{emptyCatalogMessage || "অন্য শব্দ দিয়ে খুঁজে দেখুন অথবা আপনার প্রয়োজনটি চাহিদা বোর্ডে জানান।"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {!emptyCatalogMessage && hasActiveFilters && <button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50">সার্চ ও ক্যাটাগরি মুছুন</button>}
              {!emptyCatalogMessage && <Link href="/buyer-demands" className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-xs font-bold text-white hover:bg-emerald-800">চাহিদা জানান</Link>}
            </div>
          </div>}
        </section>
      </div>
    </div>
  );
}

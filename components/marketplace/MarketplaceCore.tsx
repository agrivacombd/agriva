"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

function ProductCard({
  product,
  wished,
  compared,
  onWish,
  onCompare,
}: {
  product: MarketplaceProduct;
  wished: boolean;
  compared: boolean;
  onWish: () => void;
  onCompare: () => void;
}) {
  const hasPrice = product.price !== null && product.price !== undefined && String(product.price).trim() !== "";
  const hasStock = product.stock !== null && product.stock !== undefined;
  const inStock = Number(product.stock || 0) > 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-xl hover:shadow-emerald-950/[0.06]">
      <div className="relative">
        <Link href={`/marketplace/${product.slug}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[#f2f8ed] to-[#e8f1e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700" aria-label={`${product.name} পণ্যের বিস্তারিত দেখুন`}>
          <span aria-hidden="true" className="text-5xl opacity-60">🌱</span>
          {product.image_url && <Image src={product.image_url} alt={`${product.name} পণ্যের ছবি`} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" onError={(event) => { event.currentTarget.style.display = "none"; }} className="bg-white object-contain p-3 transition duration-300 group-hover:scale-[1.03]" />}
        </Link>
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${inStock ? "bg-white/95 text-emerald-800" : "bg-slate-900/80 text-white"}`}>
          {inStock ? "স্টকে আছে" : hasStock ? "স্টক শেষ" : "স্টক যাচাই করুন"}
        </span>
        <button type="button" onClick={onWish} aria-pressed={wished} aria-label={wished ? "উইশলিস্ট থেকে সরান" : "উইশলিস্টে রাখুন"} className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${wished ? "border-rose-200 bg-rose-50 text-rose-600" : "border-white/80 bg-white/95 text-slate-500 hover:text-rose-600"}`}>
          <svg viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} className="h-4 w-4" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-semibold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 break-words text-sm font-bold leading-5 text-slate-900">
          <Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800 focus-visible:outline-none focus-visible:underline">{product.name}</Link>
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-base font-black text-emerald-950 sm:text-lg">
            {hasPrice && Number(product.price) > 0 ? <>৳{money(product.price as number | string)}{product.unit ? <span className="text-xs font-semibold text-slate-500"> / {product.unit}</span> : null}</> : <span className="text-sm">দাম জানতে যোগাযোগ করুন</span>}
          </p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <Link href={`/marketplace/${product.slug}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
              বিস্তারিত দেখুন <span aria-hidden="true">→</span>
            </Link>
            <button type="button" onClick={onCompare} aria-pressed={compared} className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-bold transition ${compared ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
              {compared ? "তুলনায় আছে" : "তুলনা"}
            </button>
          </div>
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
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

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
  const comparedProducts = products.filter((product) => compareIds.includes(product.id));
  const hasActiveFilters = Boolean(query.trim()) || category !== "all";

  function toggleCompare(id: string) {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }

  return (
    <div className="mt-6 lg:mt-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="পণ্য খুঁজুন">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-700/10">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-emerald-800"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span className="sr-only">পণ্যের নাম লিখে খুঁজুন</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="পণ্যের নাম লিখুন — যেমন ধানের বীজ, জৈব সার..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 sm:text-base" />
              {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200" aria-label="সার্চ মুছুন">মুছুন</button>}
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">জনপ্রিয়:</span>
              {["ধানের বীজ", "জৈব সার", "কৃষি যন্ত্রপাতি"].map((term) => <button key={term} type="button" onClick={() => setQuery(term)} className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100">{term}</button>)}
            </div>
            {showCategories && <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 sm:hidden" aria-label="পণ্যের ক্যাটাগরি">
              <span className="shrink-0 pr-1 text-[11px] font-extrabold text-slate-500">ক্যাটাগরি</span>
              <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${category === "all" ? "border-emerald-900 bg-emerald-900 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"}`}>সব পণ্য</button>
              {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${category === item.slug ? "border-emerald-900 bg-emerald-900 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"}`}>{item.name}</button>)}
            </nav>}
          </div>
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 sm:w-56">
            <span className="shrink-0">সাজান</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none">
              <option value="newest">নতুন পণ্য</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </label>
        </div>
      </section>

      {showCategories && <section className="mt-5 hidden sm:block" aria-label="ক্যাটাগরি অনুযায়ী কেনাকাটা">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Shop by category</p><h2 className="mt-1 text-lg font-black text-slate-950">ক্যাটাগরি অনুযায়ী পণ্য খুঁজুন</h2></div>
          <button type="button" onClick={() => setCategory("all")} className="text-xs font-bold text-emerald-800 hover:underline">সব ক্যাটাগরি দেখুন</button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${category === item.slug ? "border-emerald-700 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"}`}>
            <span className="text-2xl" aria-hidden="true">{item.icon}</span><span className="text-[11px] font-extrabold leading-4 text-slate-800">{item.name}</span><span className="text-[10px] text-slate-400">{new Intl.NumberFormat("bn-BD").format(item.count)} পণ্য</span>
          </button>)}
        </div>
      </section>}

      <div id="marketplace-product-list" className="mt-6 scroll-mt-24 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7">
        {showCategories && <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-extrabold text-slate-900">ক্যাটাগরি</h2>
            <nav className="mt-3 grid gap-1" aria-label="পণ্যের ক্যাটাগরি">
              <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-xs font-bold ${category === "all" ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>সব পণ্য</span><span>{products.length}</span></button>
              {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-semibold ${category === item.slug ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span>{item.name}</span><span className="text-slate-400">{item.count}</span></button>)}
            </nav>
            <Link href="/agriculture-calculators" className="mt-5 block rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-4 text-white transition hover:shadow-lg">
              <span className="text-xl" aria-hidden="true">🧮</span><span className="mt-2 block text-sm font-black">জমির হিসাব করুন</span><span className="mt-1 block text-[11px] leading-5 text-emerald-50/80">জমির পরিমাণ ও চাষের হিসাবের টুল দেখুন</span><span className="mt-3 inline-block text-xs font-bold text-lime-200">ক্যালকুলেটর দেখুন →</span>
            </Link>
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
              {paginated.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} compared={compareIds.includes(product.id)} onWish={() => setWishlist((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} onCompare={() => toggleCompare(product.id)} />)}
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

      {compareIds.length > 0 && <div className="fixed inset-x-3 bottom-4 z-40 mx-auto max-w-3xl rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-2xl shadow-emerald-950/20 sm:inset-x-6 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-black text-slate-900">পণ্য তুলনা <span className="text-emerald-800">({compareIds.length}/3)</span></p><p className="mt-0.5 text-[11px] text-slate-500">সর্বোচ্চ ৩টি পণ্য একসঙ্গে তুলনা করুন</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setShowCompare((value) => !value)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white">{showCompare ? "তুলনা বন্ধ করুন" : "তুলনা দেখুন"}</button><button type="button" onClick={() => { setCompareIds([]); setShowCompare(false); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600">মুছুন</button></div>
        </div>
        {showCompare && <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr><th className="p-2 text-slate-500">পণ্য</th>{comparedProducts.map((product) => <th key={product.id} className="p-2 font-bold text-slate-900">{product.name}</th>)}</tr></thead><tbody><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">দাম</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 font-extrabold text-emerald-900">{product.price && Number(product.price) > 0 ? `৳${money(product.price)}` : "জানতে যোগাযোগ করুন"}</td>)}</tr><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">ক্যাটাগরি</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 text-slate-700">{product.category || "—"}</td>)}</tr><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">স্টক</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 text-slate-700">{Number(product.stock || 0) > 0 ? "স্টকে আছে" : "স্টক নেই / যাচাই করুন"}</td>)}</tr></tbody></table></div>}
      </div>}
    </div>
  );
}

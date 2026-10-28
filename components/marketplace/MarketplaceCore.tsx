"use client";

import { useMemo, useState } from "react";
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

const money = (value: number | string | null) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(Number(value || 0));

export default function MarketplaceCore({ products, showCategories = true }: { products: MarketplaceProduct[]; showCategories?: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const visible = useMemo(() => products.filter((product) => {
    const search = query.trim().toLocaleLowerCase();
    const matchesQuery = !search || [product.name, product.category, product.description]
      .some((value) => (value || "").normalize("NFKC").toLocaleLowerCase().includes(search));
    const matchesSelected = category === "all" || product.category === category;
    return matchesQuery && matchesSelected;
  }), [products, query, category]);

  return <div>
    <div className="grid gap-3 rounded-2xl border border-emerald-950/10 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
      <label className="block"><span className="sr-only">পণ্য খুঁজুন</span><span className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-700/10"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="পণ্যের নাম বা ধরন লিখুন..." className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" /></span></label>
      <label className="block"><span className="sr-only">ক্যাটাগরি বাছুন</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"><option value="all">সব ক্যাটাগরি</option>{Array.from(new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>

    {showCategories && <section className="mt-8" aria-labelledby="marketplace-categories-heading">
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Browse by category</p><h2 id="marketplace-categories-heading" className="mt-2 text-2xl font-black">ক্যাটাগরি অনুযায়ী পণ্য</h2></div></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{MARKETPLACE_CATEGORIES.map((item) => <Link key={item.slug} href={`/marketplace/category/${item.slug}`} className="group rounded-2xl border border-emerald-950/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">{item.icon}</span><h3 className="mt-3 text-sm font-extrabold group-hover:text-emerald-800">{item.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></Link>)}</div>
    </section>}

    <section className="mt-10" aria-labelledby="marketplace-products-heading">
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Product catalogue</p><h2 id="marketplace-products-heading" className="mt-2 text-2xl font-black">{showCategories ? "মার্কেটপ্লেসের পণ্য" : "পণ্য তালিকা"}</h2></div><span className="text-sm font-bold text-slate-500">{money(visible.length)}টি পণ্য</span></div>
      {visible.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((product) => <article key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={`/marketplace/${product.slug}`} className="relative flex min-h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100 text-5xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-700" aria-label={`${product.name} পণ্যের বিস্তারিত`}>{product.image_url ? <span role="img" aria-label={product.name} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${product.image_url}")` }} /> : <span aria-hidden="true">🌾</span>}</Link>
        <div className="flex flex-1 flex-col p-3 sm:p-4"><p className="text-xs font-bold text-emerald-700">{product.category || "কৃষি পণ্য"}</p><h3 className="mt-2 line-clamp-2 min-h-10 break-words text-sm font-extrabold leading-5 text-slate-900"><Link href={`/marketplace/${product.slug}`} className="hover:text-emerald-800">{product.name}</Link></h3><p className="mt-3 text-lg font-black text-emerald-900">{product.id.startsWith("sample-") ? "নমুনা মূল্য " : ""}৳{money(product.price)}</p><p className="mt-1 text-xs text-slate-500">{product.id.startsWith("sample-") ? "ডেমো মজুত · বাস্তব স্টক নয়" : Number(product.stock || 0) > 0 ? `মজুত: ${money(product.stock)}` : "স্টকে নেই"}</p><Link href={`/marketplace/${product.slug}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-900 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">বিস্তারিত দেখুন</Link></div>
      </article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-emerald-950/20 bg-white p-8 text-center"><p className="font-extrabold">এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি</p><p className="mt-2 text-sm text-slate-500">অন্য নাম বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p></div>}
    </section>
  </div>;
}

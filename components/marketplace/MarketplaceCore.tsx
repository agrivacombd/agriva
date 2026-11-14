"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackProductRankEvents } from "@/lib/marketplace/product-rank-tracking";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { trackAnalyticsEvent } from "@/lib/analytics";
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
  created_at?: string | null;
};

type SortOption = "recommended" | "newest" | "price-low" | "price-high";
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
  productHrefPrefix,
  wished,
  compared,
  onWish,
  onCompare,
  onAddToCart,
  addingToCart,
  cartBusy,
}: {
  product: MarketplaceProduct;
  productHrefPrefix: "/marketplace" | "/plant-market";
  wished: boolean;
  compared: boolean;
  onWish: () => void;
  onCompare: () => void;
  onAddToCart: () => void;
  addingToCart: boolean;
  cartBusy: boolean;
}) {
  const hasPrice = product.price !== null && product.price !== undefined && String(product.price).trim() !== "";
  const hasStock = product.stock !== null && product.stock !== undefined;
  const inStock = Number(product.stock || 0) > 0;
  const recordListingClick = () => trackProductRankEvents(productHrefPrefix === "/plant-market" ? "plant-market" : "marketplace", "listing_click", [product.id]);

  const detailHref = productHrefPrefix + "/" + product.slug;
  const unitLabels: Record<string, string> = { pack: "প্যাকেট", kg: "কেজি", g: "গ্রাম", piece: "পিস", liter: "লিটার", bag: "বস্তা" };
  const unit = product.unit ? unitLabels[product.unit] || product.unit : null;

  return (
    <article data-rank-product-id={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-[0_10px_30px_rgba(15,55,32,.07)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_18px_44px_rgba(15,55,32,.13)]">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#eaf9ee] via-[#f0fbf3] to-[#f8fcf7]">
        <Link href={detailHref} onClick={recordListingClick} className="relative flex aspect-[1/1] items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700" aria-label={product.name + " পণ্যের বিস্তারিত দেখুন"}>
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name + " পণ্যের ছবি"} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" onError={(event) => { event.currentTarget.style.display = "none"; }} className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04] sm:p-4" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-emerald-700/65">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m3 17 5.5-5 4.5 4 3.5-3 4.5 4"/></svg>
              <span className="text-[10px] font-bold">ছবি শিগগিরই যোগ হবে</span>
            </div>
          )}
        </Link>
        <span className={"absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm " + (inStock ? "bg-emerald-700 text-white" : "bg-slate-900/85 text-white")}>
          {inStock ? "স্টকে আছে" : hasStock ? "স্টক শেষ" : "স্টক যাচাই করুন"}
        </span>
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button type="button" onClick={onWish} aria-pressed={wished} aria-label={wished ? "উইশলিস্ট থেকে সরান" : "উইশলিস্টে রাখুন"}
            className={"grid h-10 w-10 place-items-center rounded-xl border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (wished ? "border-rose-200 bg-rose-50 text-rose-600" : "border-white/80 bg-white/95 text-slate-500 hover:text-rose-600")}>
            <svg viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} className="h-5 w-5" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" onClick={onCompare} aria-pressed={compared} aria-label={compared ? "তুলনা থেকে সরান" : "পণ্য তুলনায় যুক্ত করুন"} title={compared ? "তুলনা থেকে সরান" : "পণ্য তুলনা করুন"}
            className={"grid h-10 w-10 place-items-center rounded-xl border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (compared ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-white/80 bg-white/95 text-slate-500 hover:text-emerald-800")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M5 7h14m-3-3 3 3-3 3M19 17H5m3-3-3 3 3 3"/></svg>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
        <p className="truncate text-[10px] font-semibold text-emerald-700">{product.category || "কৃষি পণ্য"}</p>
        <h3 className="mt-1.5 min-h-12 break-words text-sm font-black leading-6 text-slate-900 sm:text-base">
          <Link href={detailHref} onClick={recordListingClick} className="line-clamp-2 hover:text-emerald-800 focus-visible:outline-none focus-visible:underline">{product.name}</Link>
        </h3>
        <div className="mt-auto border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">PRICE</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <p className="text-lg font-black tracking-tight text-emerald-900 sm:text-xl">
              {hasPrice && Number(product.price) >= 0 ? <>৳{money(product.price as number | string)}{unit && <span className="ml-1 text-[10px] font-semibold text-slate-500">/ {unit}</span>}</> : <span className="text-xs">দাম জানতে যোগাযোগ করুন</span>}
            </p>
            {productHrefPrefix === "/marketplace" && inStock && hasPrice && Number.isFinite(Number(product.price)) && Number(product.price) >= 0 ? (
              <button type="button" onClick={onAddToCart} disabled={cartBusy}
                aria-label={product.name + " কার্টে যোগ করুন"}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-900 bg-white px-3 py-2 text-[11px] font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 sm:px-4">
                <ShoppingCart size={15} aria-hidden="true" />
                {addingToCart ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}
              </button>
            ) : (
              <Link href={detailHref} onClick={recordListingClick}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-3 py-2 text-[11px] font-extrabold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:px-4">
                বিস্তারিত দেখুন
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MarketplaceCore({ products, showCategories = true, availableCategoriesOnly = false, initialQuery = "", emptyCatalogMessage, productHrefPrefix = "/marketplace" }: { products: MarketplaceProduct[]; showCategories?: boolean; availableCategoriesOnly?: boolean; initialQuery?: string; emptyCatalogMessage?: string; productHrefPrefix?: "/marketplace" | "/plant-market" }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const catalogueRef = useRef<HTMLDivElement>(null);
  const alreadySeen = useRef(new Set<string>());
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartSummary, setCartSummary] = useState<{ lines: number; units: number }>({ lines: 0, units: 0 });
  const [cartConfirmed, setCartConfirmed] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [cartNeedsLogin, setCartNeedsLogin] = useState(false);
  const [cartError, setCartError] = useState("");


  // The existing cart RPC is authoritative for prices, quantity caps, and stock.
  // Only fetch counts for the floating bar; never calculate discounts or fees here.
  const loadCartSummary = useCallback(async (): Promise<{ lines: number; units: number }> => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return { lines: 0, units: 0 };
    const { data: cart, error: cartError } = await supabase.from("carts")
      .select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    if (cartError) throw cartError;
    if (!cart) return { lines: 0, units: 0 };
    const { data: rows, error: itemsError } = await supabase.from("cart_items")
      .select("quantity").eq("cart_id", cart.id);
    if (itemsError) throw itemsError;
    return {
      lines: (rows || []).length,
      units: (rows || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    };
  }, []);

  useEffect(() => {
    if (productHrefPrefix !== "/marketplace") return;
    let alive = true;
    loadCartSummary()
      .then((summary) => { if (alive) setCartSummary(summary); })
      .catch(() => { /* Cart status is optional; adding still works. */ });
    return () => { alive = false; };
  }, [productHrefPrefix, loadCartSummary]);

  async function addProductToCart(product: MarketplaceProduct) {
    if (productHrefPrefix !== "/marketplace" || addingProductId) return;
    if (Number(product.stock || 0) < 1 || product.price == null || !Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      setCartError("পণ্যের বর্তমান মূল্য বা স্টক পাওয়া যাচ্ছে না।");
      return;
    }
    setAddingProductId(product.id);
    setCartError("");
    setCartNeedsLogin(false);
    setCartNotice("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setCartNeedsLogin(true);
        setCartError("কার্টে পণ্য যোগ করতে লগইন করুন।");
        return;
      }
      const { error } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: product.id,
        p_quantity: 1,
      });
      if (error) {
        setCartError(/Insufficient stock|maximum quantity|Product unavailable/i.test(error.message || "")
          ? "স্টক শেষ বা কার্টের পরিমাণ সীমার বেশি। কার্ট দেখে পরিমাণ ঠিক করুন।"
          : "কার্টে পণ্য যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT",
        item_id: product.id,
        quantity: 1,
        value: Number(product.price),
      });
      setCartConfirmed(true);
      setCartNotice(product.name + " কার্টে যোগ হয়েছে।");
      try {
        setCartSummary(await loadCartSummary());
      } catch {
        // The add operation succeeded. Let buyers open the cart to verify its state.
      }
    } catch {
      setCartError("কার্টে যোগ করা যায়নি। আপনার লগইন ও ইন্টারনেট সংযোগ যাচাই করুন।");
    } finally {
      setAddingProductId(null);
    }
  }

  const showStickyCart = productHrefPrefix === "/marketplace" && (cartConfirmed || cartSummary.units > 0);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const categoryCounts = useMemo(() => MARKETPLACE_CATEGORIES.map((item) => ({
    ...item,
    count: products.filter((product) => productMatchesCategory(product, item.slug)).length,
  })).filter((item) => !availableCategoriesOnly || item.count > 0), [products, availableCategoriesOnly]);

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
      if (sort === "newest") return (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0);
      // The API supplies relevance order; modern JS sort is stable.
      return 0;
    });
  }, [products, query, category, sort]);

  useEffect(() => setPage(1), [query, category, sort]);
  const paginated = visible.slice(0, page * PAGE_SIZE);
  const visibleProductIds = paginated.map((product) => product.id).join(",");
  useEffect(() => {
    const root = catalogueRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const newlyVisible: string[] = [];
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        const id = (entry.target as HTMLElement).dataset.rankProductId;
        if (id && !alreadySeen.current.has(id)) {
          alreadySeen.current.add(id);
          newlyVisible.push(id);
        }
        observer.unobserve(entry.target);
      }
      if (newlyVisible.length) trackProductRankEvents(productHrefPrefix === "/plant-market" ? "plant-market" : "marketplace", "impression", newlyVisible);
    }, { threshold: 0.5 });
    root.querySelectorAll("[data-rank-product-id]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [visibleProductIds, productHrefPrefix]);
  const selectedCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === category);
  const comparedProducts = products.filter((product) => compareIds.includes(product.id));
  const hasActiveFilters = Boolean(query.trim()) || category !== "all";

  function toggleCompare(id: string) {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }

  return (
    <div ref={catalogueRef} className={"mt-6 lg:mt-8 " + (showStickyCart ? "pb-32 sm:pb-24" : "")}>
      <section className="rounded-[1.35rem] border border-emerald-950/10 bg-white p-4 shadow-[0_8px_28px_rgba(15,55,32,.055)] sm:p-5" aria-label="পণ্য খুঁজুন">
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

          </div>
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 sm:w-56">
            <span className="shrink-0">সাজান</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none">
              <option value="recommended">জনপ্রিয় ও সর্বাধিক বিক্রিত</option>
               <option value="newest">নতুন পণ্য</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </label>
        </div>
      </section>

      {showCategories && <div className="sticky top-0 z-30 -mx-4 border-b border-emerald-900/10 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-md sm:hidden">
        <button type="button" onClick={() => setMobileCategoryOpen((open) => !open)} aria-expanded={mobileCategoryOpen} aria-controls="mobile-marketplace-category-menu" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-emerald-900/15 bg-emerald-50/70 px-3 text-left text-sm font-extrabold text-emerald-950 transition active:bg-emerald-100">
          <span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="text-lg">☷</span><span className="shrink-0">ক্যাটাগরি</span><span className="truncate rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">{selectedCategory?.name || "সব পণ্য"}</span></span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-5 w-5 shrink-0 transition-transform ${mobileCategoryOpen ? "rotate-180" : ""}`}><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {mobileCategoryOpen && <nav id="mobile-marketplace-category-menu" aria-label="পণ্যের ক্যাটাগরি" className="mt-2 grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <button type="button" onClick={() => { setCategory("all"); setMobileCategoryOpen(false); }} aria-pressed={category === "all"} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${category === "all" ? "bg-emerald-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-emerald-50"}`}><span>সব পণ্য</span><span className="text-[10px] opacity-75">{products.length}</span></button>
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => { setCategory(item.slug); setMobileCategoryOpen(false); }} aria-pressed={category === item.slug} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${category === item.slug ? "bg-emerald-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-emerald-50"}`}><span className="min-w-0 truncate">{item.icon} {item.name}</span><span className="shrink-0 text-[10px] opacity-75">{new Intl.NumberFormat("bn-BD").format(item.count)}</span></button>)}
        </nav>}
      </div>}

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

      <div id="marketplace-product-list" className={`mt-6 scroll-mt-24 ${showCategories ? "lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7" : ""}`}>
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

          {productHrefPrefix === "/marketplace" && cartError && (
            <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
              <span>{cartError}</span>
              {cartNeedsLogin && <Link href={"/login?next=" + encodeURIComponent("/marketplace")} className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white">লগইন করুন</Link>}
              {!cartNeedsLogin && <Link href="/cart" className="text-xs font-bold underline underline-offset-2">কার্ট দেখুন</Link>}
            </div>
          )}
          {paginated.length ? <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {paginated.map((product) => <ProductCard key={product.id} product={product} productHrefPrefix={productHrefPrefix} wished={wishlist.includes(product.id)} compared={compareIds.includes(product.id)} onWish={() => setWishlist((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} onCompare={() => toggleCompare(product.id)} onAddToCart={() => void addProductToCart(product)} addingToCart={addingProductId === product.id} cartBusy={Boolean(addingProductId)} />)}
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

      {compareIds.length > 0 && <div className={"fixed inset-x-3 z-40 mx-auto max-w-3xl rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-2xl shadow-emerald-950/20 sm:inset-x-6 sm:p-4 " + (showStickyCart ? "bottom-44 sm:bottom-28" : "bottom-4")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-black text-slate-900">পণ্য তুলনা <span className="text-emerald-800">({compareIds.length}/3)</span></p><p className="mt-0.5 text-[11px] text-slate-500">সর্বোচ্চ ৩টি পণ্য একসঙ্গে তুলনা করুন</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setShowCompare((value) => !value)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white">{showCompare ? "তুলনা বন্ধ করুন" : "তুলনা দেখুন"}</button><button type="button" onClick={() => { setCompareIds([]); setShowCompare(false); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600">মুছুন</button></div>
        </div>
        {showCompare && <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr><th className="p-2 text-slate-500">পণ্য</th>{comparedProducts.map((product) => <th key={product.id} className="p-2 font-bold text-slate-900">{product.name}</th>)}</tr></thead><tbody><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">দাম</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 font-extrabold text-emerald-900">{product.price && Number(product.price) > 0 ? `৳${money(product.price)}` : "জানতে যোগাযোগ করুন"}</td>)}</tr><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">ক্যাটাগরি</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 text-slate-700">{product.category || "—"}</td>)}</tr><tr className="border-t border-slate-100"><td className="p-2 text-slate-500">স্টক</td>{comparedProducts.map((product) => <td key={product.id} className="p-2 text-slate-700">{Number(product.stock || 0) > 0 ? "স্টকে আছে" : "স্টক নেই / যাচাই করুন"}</td>)}</tr></tbody></table></div>}
      </div>}

      {showStickyCart && (
        <aside role="region" aria-label="কার্ট থেকে চেকআউট করুন"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 mx-auto max-w-2xl rounded-2xl border border-emerald-700/20 bg-white/95 px-3 py-3 shadow-[0_16px_50px_rgba(0,35,22,.23)] backdrop-blur-lg sm:inset-x-6 sm:bottom-5 sm:px-4">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><ShoppingCart size={22} /></span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-black text-emerald-950">
                  {cartNotice ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : null}
                  {cartSummary.units > 0 ? "কার্টে " + money(cartSummary.units) + "টি পণ্য" : "পণ্য কার্টে যোগ হয়েছে"}
                </p>
                <p role="status" aria-live="polite" className="truncate text-[11px] text-slate-600">
                  {cartNotice || (cartSummary.lines > 0 ? money(cartSummary.lines) + " ধরনের পণ্য রয়েছে" : "অর্ডার করতে কার্ট যাচাই করুন")}
                </p>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Link href="/cart" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-900 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50 sm:flex-none">
                কার্ট দেখুন
              </Link>
              <Link href="/checkout" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-800 sm:flex-none">
                চেকআউট করুন
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

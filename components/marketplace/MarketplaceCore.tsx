"use client";
import { useRouter } from "next/navigation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackProductRankEvents } from "@/lib/marketplace/product-rank-tracking";
import { INTEREST_CHANGED, INTEREST_KEY, clearInterest, personalizationAllowed, readInterest,
  recordInterest, suggestForBrowser, unsaveInterest, type Interest
} from "@/lib/marketplace/personalization";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, CheckCircle2, Heart, X, Sprout, Flower2, Grid2X2, Calculator, Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { trackAnalyticsEvent } from "@/lib/analytics";
import MarketplaceAuthModal from "@/components/marketplace/MarketplaceAuthModal";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";
import { resolveMarketplaceCartUser } from "@/lib/marketplace/cart-auth";
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
  onWish,
  onAddToCart,
  onBuyNow,
  addingToCart,
  cartBusy,
}: {
  product: MarketplaceProduct;
  productHrefPrefix: "/marketplace" | "/plant-market";
  wished: boolean;
  onWish: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  addingToCart: boolean;
  cartBusy: boolean;
}) {
  const hasPrice = product.price !== null && product.price !== undefined && String(product.price).trim() !== "";
  const hasStock = product.stock !== null && product.stock !== undefined;
  const inStock = Number(product.stock || 0) > 0;
  const recordListingClick = () => {
    trackProductRankEvents(productHrefPrefix === "/plant-market" ? "plant-market" : "marketplace", "listing_click", [product.id]);
    if (productHrefPrefix === "/marketplace") recordInterest(product,"click");
  };

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
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
        <p className="truncate text-[10px] font-semibold text-emerald-700">{getProductTaxonomy(product.category, product.category_slug, product.subcategory_slug)?.category.name || product.category || "কৃষি পণ্য"}</p>
        <h3 className="mt-1.5 min-h-12 break-words text-sm font-black leading-6 text-slate-900 sm:text-base">
          <Link href={detailHref} onClick={recordListingClick} className="line-clamp-2 hover:text-emerald-800 focus-visible:outline-none focus-visible:underline">{product.name}</Link>
        </h3>
        <div className="mt-auto border-t border-slate-100 pt-3">
          <p className="text-[10px] font-semibold text-slate-500">মূল্য</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <p className="text-lg font-black tracking-tight text-emerald-900 sm:text-xl">
              {hasPrice && Number(product.price) >= 0 ? <>৳{money(product.price as number | string)}{unit && <span className="ml-1 text-[10px] font-semibold text-slate-500">/ {unit}</span>}</> : <span className="text-xs">দাম জানতে যোগাযোগ করুন</span>}
            </p>
          </div>
          {productHrefPrefix === "/marketplace" ? (
            <div className="mt-3 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              {inStock && hasPrice && Number.isFinite(Number(product.price)) && Number(product.price) >= 0 ? (
                <Link href={detailHref + "#product-direct-cod"} onClick={recordListingClick}
                  aria-label={product.name + " এখনই কিনুন"}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-800 px-2 py-2 text-xs font-black text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
                  Buy Now
                </Link>
              ) : (
                <span aria-disabled="true" className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-500">
                  {hasStock && !inStock ? "স্টক শেষ" : "অর্ডার বন্ধ"}
                </span>
              )}
              <button type="button" onClick={() => { recordListingClick(); onAddToCart(); }}
                disabled={!inStock || !hasPrice || !Number.isFinite(Number(product.price)) || Number(product.price) < 0 || cartBusy}
                aria-label={product.name + " কার্টে যোগ করুন"}
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl border-2 border-emerald-800 bg-white px-2 py-2 text-[11px] font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 min-[480px]:text-xs">
                <ShoppingCart size={15} className="shrink-0" aria-hidden="true" />
                {addingToCart ? "Adding…" : "Add to Cart"}
              </button>
            </div>
          ) : (
            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={!inStock || !hasPrice || cartBusy} onClick={() => {recordListingClick();onAddToCart();}} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border-2 border-emerald-800 px-2 text-[11px] font-black text-emerald-900 disabled:opacity-40"><ShoppingCart size={14}/>{addingToCart?"যোগ হচ্ছে…":"Add to Cart"}</button>
                <button type="button" disabled={!inStock || !hasPrice || cartBusy} onClick={() => {recordListingClick();onBuyNow();}} className="min-h-11 rounded-xl bg-emerald-800 px-2 text-xs font-black text-white disabled:opacity-40">Buy Now</button>
              </div>
              <Link href={detailHref} onClick={recordListingClick} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50">বিস্তারিত দেখুন</Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MarketplaceCore({ products, showCategories = true, availableCategoriesOnly = false, initialQuery = "", emptyCatalogMessage, productHrefPrefix = "/marketplace" }: { products: MarketplaceProduct[]; showCategories?: boolean; availableCategoriesOnly?: boolean; initialQuery?: string; emptyCatalogMessage?: string; productHrefPrefix?: "/marketplace" | "/plant-market" }) {
  const router = useRouter();
  const isPlantMarket = productHrefPrefix === "/plant-market";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const catalogueRef = useRef<HTMLDivElement>(null);
  const alreadySeen = useRef(new Set<string>());
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [allowPersonal, setAllowPersonal] = useState(false);
  const [personalSort, setPersonalSort] = useState(true);
  useEffect(() => {
    if (isPlantMarket) return;
    setAllowPersonal(personalizationAllowed());
    const sync=()=>setInterests(readInterest());
    sync();
    const storage=(event:StorageEvent)=>{if(event.key===INTEREST_KEY)sync();};
    window.addEventListener(INTEREST_CHANGED,sync);
    window.addEventListener("storage",storage);
    return ()=>{window.removeEventListener(INTEREST_CHANGED,sync);window.removeEventListener("storage",storage);};
  },[isPlantMarket]);
  const wishlistStorageKey = isPlantMarket ? "agriva:plant-market:saved:v1" : "agriva:marketplace:saved:v1";

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem(wishlistStorageKey) || "[]");
      const eligible = new Set(products.map(product => product.id));
      setWishlist(Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === "string" && eligible.has(id)))].slice(0, 200) : []);
    } catch {
      setWishlist([]);
    }
  }, [wishlistStorageKey, products]);

  function toggleWishlist(productId: string) {
    const next = wishlist.includes(productId) ? wishlist.filter(id => id !== productId) : [...wishlist, productId].slice(-200);
    setWishlist(next);
    if (!isPlantMarket) {
      const item=products.find(p=>p.id===productId);
      if (item && next.includes(productId)) recordInterest(item,"save");
      else unsaveInterest(productId);
    }
    try { window.localStorage.setItem(wishlistStorageKey, JSON.stringify(next)); } catch { /* Local saving is optional in private browser modes. */ }
  }
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const addRequestInFlightRef = useRef(false);
  const [cartSummary, setCartSummary] = useState<{ lines: number; units: number }>({ lines: 0, units: 0 });
  const [cartConfirmed, setCartConfirmed] = useState(false);
  const [cartBarDismissed, setCartBarDismissed] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [cartNeedsLogin, setCartNeedsLogin] = useState(false);
  const [authReturnTo, setAuthReturnTo] = useState<string | null>(null);
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

  async function addPlantProductToCart(product: MarketplaceProduct, buyNow = false) {
    if (addRequestInFlightRef.current || addingProductId || Number(product.stock || 0) < 1) return;
    addRequestInFlightRef.current = true;
    setAddingProductId(product.id);setCartError("");setCartNeedsLogin(false);setCartNotice("");
    try {
      const response = await fetch("/api/plant-market/cart", {
        method: "POST",headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await response.json().catch(()=>({}));
      if(response.status===401) {
        setCartNeedsLogin(true);
        setCartError("কার্টে যোগ করতে লগইন করুন।");return;
      }
      if(!response.ok) {setCartError(typeof data.error==="string"?data.error:"স্টক বা সংযোগ যাচাই করুন।");return;}
      if(buyNow) {
        // Plant checkout displays every item already in the active cart.
        router.push("/plant-market/checkout");
        return;
      }
      setCartNotice(product.name + " Plant Market কার্টে যোগ হয়েছে।");
    } catch {
      setCartError("কার্টে যোগ করা যায়নি। সংযোগ পরীক্ষা করুন।");
    } finally {
      addRequestInFlightRef.current = false;setAddingProductId(null);
    }
  }

  async function addProductToCart(product: MarketplaceProduct) {
    if (productHrefPrefix !== "/marketplace" || addRequestInFlightRef.current || addingProductId) return;
    if (Number(product.stock || 0) < 1 || product.price == null || !Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      setCartError("পণ্যের বর্তমান মূল্য বা স্টক পাওয়া যাচ্ছে না।");
      return;
    }
    addRequestInFlightRef.current = true;
    setAddingProductId(product.id);
    setCartError("");
    setCartNeedsLogin(false);
    setCartNotice("");
    try {
      const { supabase, user } = await resolveMarketplaceCartUser();
      if (!user) {
        setAuthReturnTo("/marketplace/" + encodeURIComponent(product.slug) + "?addToCart=" + encodeURIComponent(product.id) + "&qty=1");
        setCartNeedsLogin(true);
        setCartError("");
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
      recordInterest(product,"cart");
      setCartConfirmed(true);
      setCartBarDismissed(false);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      setCartNotice(product.name + " কার্টে যোগ হয়েছে।");
      try {
        setCartSummary(await loadCartSummary());
      } catch {
        // The add operation succeeded. Avoid displaying a stale item count.
        setCartSummary({ lines: 0, units: 0 });
      }
    } catch (error) {
      // A network/auth-service error is different from having no account.
      // Never claim a cart addition succeeded or leak raw auth errors.
      console.error("Marketplace Add to Cart failed:", error instanceof Error ? error.name : "unknown");
      setCartError("লগইন সেবা বা সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      addRequestInFlightRef.current = false;
      setAddingProductId(null);
    }
  }

  const showStickyCart = productHrefPrefix === "/marketplace" && (cartConfirmed || cartSummary.units > 0) && !cartBarDismissed && !authReturnTo;

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const plantCategories = useMemo(() => [{slug:"all",name:"সব ক্যাটাগরি",icon:Sprout},...Array.from(new Set(products.map(p => p.category?.trim()).filter((v):v is string => Boolean(v)))).sort((a,b)=>a.localeCompare(b,"bn")).map(name=>({slug:name,name,icon:Flower2}))], [products]);
  const catalogueCategories = isPlantMarket ? plantCategories : MARKETPLACE_CATEGORIES;
  const categoryCounts = useMemo(() => catalogueCategories.map((item) => ({
    ...item,
    count: products.filter((product) => isPlantMarket ? (item.slug === "all" || product.category?.trim() === item.slug) : productMatchesCategory(product, item.slug)).length,
  })).filter((item) => !availableCategoriesOnly || item.count > 0), [products, availableCategoriesOnly, catalogueCategories, isPlantMarket]);

  const visible = useMemo(() => {
    const search = normalize(query);
    const filtered = products.filter((product) => {
      const matchesSearch = !search || [product.name, product.category, product.description, product.unit]
        .some((value) => normalize(value).includes(search));
      return matchesSearch && (isPlantMarket ? (category === "all" || product.category?.trim() === category) : productMatchesCategory(product, category))
        && (!inStockOnly || Number(product.stock || 0) > 0)
        && (!wishlistOnly || wishlist.includes(product.id));
    });

    if (sort === "recommended" && !isPlantMarket && allowPersonal && personalSort)
      return suggestForBrowser(filtered,interests,wishlist).ordered;
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
  }, [products, query, category, sort, inStockOnly, wishlistOnly, wishlist, isPlantMarket, allowPersonal, personalSort, interests]);
  const suggestions=useMemo(()=>{
    if(isPlantMarket || !allowPersonal || !personalSort || sort!=="recommended" || query.trim() || wishlistOnly)return [];
    return suggestForBrowser(visible,interests,wishlist).suggested;
  },[isPlantMarket,allowPersonal,personalSort,sort,query,wishlistOnly,visible,interests,wishlist]);

  useEffect(() => setPage(1), [query, category, sort, inStockOnly, wishlistOnly]);
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
  const selectedCategory = catalogueCategories.find((item) => item.slug === category);
  const hasActiveFilters = Boolean(query.trim()) || category !== "all" || inStockOnly || wishlistOnly;

  return (
    <div ref={catalogueRef} className={"mt-6 lg:mt-8 " + (showStickyCart ? "pb-32 sm:pb-24" : "")}>
      <section className="rounded-[1.35rem] border border-emerald-950/10 bg-white p-4 shadow-[0_8px_28px_rgba(15,55,32,.055)] sm:p-5" aria-label="পণ্য খুঁজুন">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-700/10">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-emerald-800"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span className="sr-only">পণ্যের নাম লিখে খুঁজুন</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPlantMarket ? "গাছ, চারা বা টবের নাম লিখুন..." : "পণ্যের নাম লিখুন — যেমন ধানের বীজ, জৈব সার..."} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 sm:text-base" />
              {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200" aria-label="সার্চ মুছুন">মুছুন</button>}
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">জনপ্রিয়:</span>
              {(isPlantMarket ? ["ইনডোর গাছ", "ফলের চারা", "ফুলের চারা"] : ["ধানের বীজ", "জৈব সার", "কৃষি যন্ত্রপাতি"]).map((term) => <button key={term} type="button" onClick={() => setQuery(term)} className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100">{term}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="দ্রুত পণ্য ফিল্টার">
              <button type="button" aria-pressed={inStockOnly} onClick={() => setInStockOnly(value => !value)}
                className={"inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (inStockOnly ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-emerald-900 hover:bg-emerald-50")}>
                <CheckCircle2 size={15} aria-hidden="true" /> শুধু স্টকে আছে
              </button>
              <button type="button" aria-pressed={wishlistOnly} onClick={() => setWishlistOnly(value => !value)}
                className={"inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (wishlistOnly ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-emerald-900 hover:bg-emerald-50")}>
                <Heart size={15} aria-hidden="true" /> সংরক্ষিত পণ্য ({new Intl.NumberFormat("bn-BD").format(wishlist.length)})
              </button>
              {wishlistOnly && <span className="text-[11px] leading-5 text-slate-500">এই ব্রাউজারে সংরক্ষিত</span>}
            </div>

          </div>
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 sm:w-56">
            <span className="shrink-0">সাজান</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none">
              <option value="recommended">প্রাসঙ্গিক পণ্য</option>
               <option value="newest">নতুন পণ্য</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
            </select>
          </label>
        </div>
      </section>

      {showCategories && <div className="sticky top-0 z-30 -mx-4 border-b border-emerald-900/10 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-md sm:hidden">
        <button type="button" onClick={() => setMobileCategoryOpen((open) => !open)} aria-expanded={mobileCategoryOpen} aria-controls="mobile-marketplace-category-menu" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-emerald-900/15 bg-emerald-50/70 px-3 text-left text-sm font-extrabold text-emerald-950 transition active:bg-emerald-100">
          <span className="flex min-w-0 items-center gap-2"><Grid2X2 size={18} aria-hidden="true" className="shrink-0 text-emerald-800" /><span className="shrink-0">ক্যাটাগরি</span><span className="truncate rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">{selectedCategory?.name || "সব পণ্য"}</span></span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-5 w-5 shrink-0 transition-transform ${mobileCategoryOpen ? "rotate-180" : ""}`}><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {mobileCategoryOpen && <nav id="mobile-marketplace-category-menu" aria-label="পণ্যের ক্যাটাগরি" className="mt-2 grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <button type="button" onClick={() => { setCategory("all"); setMobileCategoryOpen(false); }} aria-pressed={category === "all"} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${category === "all" ? "bg-emerald-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-emerald-50"}`}><span>সব পণ্য</span><span className="text-[10px] opacity-75">{products.length}</span></button>
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => { setCategory(item.slug); setMobileCategoryOpen(false); }} aria-pressed={category === item.slug} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${category === item.slug ? "bg-emerald-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-emerald-50"}`}><span className="min-w-0 truncate">{typeof item.icon === "string" ? item.icon : <item.icon size={16} aria-hidden="true" className="inline-block align-middle" />} {item.name}</span><span className="shrink-0 text-[10px] opacity-75">{new Intl.NumberFormat("bn-BD").format(item.count)}</span></button>)}
        </nav>}
      </div>}

      {showCategories && <section className="mt-5 hidden sm:block" aria-label="ক্যাটাগরি অনুযায়ী কেনাকাটা">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Shop by category</p><h2 className="mt-1 text-lg font-black text-slate-950">ক্যাটাগরি অনুযায়ী পণ্য খুঁজুন</h2></div>
          <button type="button" onClick={() => setCategory("all")} className="text-xs font-bold text-emerald-800 hover:underline">সব ক্যাটাগরি দেখুন</button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {categoryCounts.map((item) => <button type="button" key={item.slug} onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug} className={`group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${category === item.slug ? "border-emerald-700 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"}`}>
            <span className="flex h-9 w-9 items-center justify-center text-emerald-700" aria-hidden="true">{typeof item.icon === "string" ? item.icon : <item.icon size={28} strokeWidth={1.8} />}</span><span className="text-[11px] font-extrabold leading-4 text-slate-800">{item.name}</span><span className="text-[10px] text-slate-400">{new Intl.NumberFormat("bn-BD").format(item.count)} পণ্য</span>
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
              <Calculator size={24} aria-hidden="true" className="text-lime-200" /><span className="mt-2 block text-sm font-black">জমির হিসাব করুন</span><span className="mt-1 block text-[11px] leading-5 text-emerald-50/80">জমির পরিমাণ ও চাষের হিসাবের টুল দেখুন</span><span className="mt-3 inline-block text-xs font-bold text-lime-200">ক্যালকুলেটর দেখুন →</span>
            </Link>
          </div>
        </aside>}

        <section aria-labelledby="marketplace-products-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="marketplace-products-heading" className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{selectedCategory?.name || "সব পণ্য"}</h2>
              <p className="mt-1 text-xs text-slate-500">{query ? `“${query}” অনুসন্ধানের ফলাফল` : isPlantMarket ? "আপনার জায়গার জন্য গাছ, চারা ও বাগানের পণ্য বেছে নিন" : "আপনার প্রয়োজনীয় কৃষিপণ্য বেছে নিন"}</p>
            </div>
            <p aria-live="polite" className="shrink-0 text-xs font-bold text-slate-500">{new Intl.NumberFormat("bn-BD").format(visible.length)}টি পণ্য</p>
          </div>

          {cartError && (
            <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
              <span>{cartError}</span>
              {cartNeedsLogin && <Link href={"/login?next=" + encodeURIComponent(isPlantMarket?"/plant-market":"/marketplace")} className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white">লগইন করুন</Link>}
              {!cartNeedsLogin && <Link href={isPlantMarket?"/plant-market/cart":"/cart"} className="text-xs font-bold underline underline-offset-2">কার্ট দেখুন</Link>}
            </div>
          )}
          {isPlantMarket && cartNotice && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"><span>{cartNotice}</span><Link href="/plant-market/cart" className="font-black underline">Plant Market Cart দেখুন</Link></div>}
          {isPlantMarket && <p className="mt-2 text-xs text-slate-500">Buy Now পুরো Plant Market Cart-এর Checkout খুলবে। আগে যোগ করা পণ্য থাকলে Order Summary দেখে নিশ্চিত করুন।</p>}
          {!isPlantMarket && allowPersonal && (interests.length>0 || wishlist.length>0) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white p-3">
              <p className="text-xs leading-5 text-slate-600">আপনার আগ্রহ অনুযায়ী পণ্য <span className="text-slate-400">· এই ব্রাউজারে</span></p>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={personalSort} onClick={()=>setPersonalSort(v=>!v)}
                  className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50">{personalSort?"ব্যক্তিগত সাজানো বন্ধ":"ব্যক্তিগত সাজানো চালু"}</button>
                <button type="button" onClick={clearInterest} className="min-h-9 px-2 text-xs font-semibold text-slate-500 underline underline-offset-2">দেখার ইতিহাস মুছুন</button>
              </div>
            </div>
          )}
          {suggestions.length>0 && (
            <section aria-labelledby="for-you-products-title" className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 sm:p-5">
              <h3 id="for-you-products-title" className="text-base font-black text-emerald-950 sm:text-lg">আপনার আগ্রহ অনুযায়ী পণ্য</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">দেখা, সংরক্ষণ ও কার্টে যোগ করার ভিত্তিতে সাজানো ব্যক্তিগত পরামর্শ।</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {suggestions.map(item=><Link key={item.id} href={productHrefPrefix+"/"+item.slug}
                  onClick={()=>{trackProductRankEvents("marketplace","listing_click",[item.id]);recordInterest(item,"click");}}
                  className="group flex min-w-0 flex-col rounded-xl border border-emerald-100 bg-white p-2.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-slate-50">
                    {item.image_url?<Image src={item.image_url} alt={item.name} fill unoptimized sizes="(max-width: 640px) 45vw, 200px" className="object-contain p-1.5" />:<span className="grid h-full place-items-center" aria-hidden="true"><Sprout size={34} strokeWidth={1.6} className="text-emerald-600" /></span>}
                  </div>
                  <span className="mt-2 line-clamp-2 min-h-10 break-words text-xs font-bold leading-5 text-slate-900 sm:text-sm">{item.name}</span>
                  <span className="mt-auto pt-1 text-sm font-black text-emerald-900">৳{money(item.price as number | string)}</span>
                </Link>)}
              </div>
            </section>
          )}
          {paginated.length ? <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {paginated.map((product) => <ProductCard key={product.id} product={product} productHrefPrefix={productHrefPrefix} wished={wishlist.includes(product.id)} onWish={() => toggleWishlist(product.id)} onAddToCart={() => void (isPlantMarket ? addPlantProductToCart(product) : addProductToCart(product))} onBuyNow={() => void addPlantProductToCart(product,true)} addingToCart={addingProductId === product.id} cartBusy={Boolean(addingProductId)} />)}
            </div>
            {paginated.length < visible.length && <div className="mt-7 flex justify-center">
              <button type="button" onClick={() => setPage((current) => current + 1)} className="min-h-11 rounded-xl border border-emerald-800 bg-white px-6 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50">আরও পণ্য দেখুন ({new Intl.NumberFormat("bn-BD").format(visible.length - paginated.length)}টি বাকি)</button>
            </div>}
          </> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:px-8">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700" aria-hidden="true"><Search size={28} strokeWidth={1.8} /></span>
            <p className="mt-4 font-extrabold text-slate-900">{emptyCatalogMessage ? "Marketplace ক্যাটালগ এখন খালি" : wishlistOnly ? "সংরক্ষিত কোনো পণ্য পাওয়া যায়নি" : "এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি"}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{emptyCatalogMessage || (wishlistOnly ? "পণ্যের হৃদয় আইকনে চাপ দিয়ে সংরক্ষণ করুন, অথবা ফিল্টার বন্ধ করে সব পণ্য দেখুন।" : isPlantMarket ? "গাছ বা চারার অন্য নাম দিয়ে খুঁজে দেখুন। গাছ বিনিময়ের বোর্ডেও নতুন পোস্ট পেতে পারেন।" : "অন্য শব্দ দিয়ে খুঁজে দেখুন অথবা আপনার প্রয়োজনটি চাহিদা বোর্ডে জানান।")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {!emptyCatalogMessage && hasActiveFilters && <button type="button" onClick={() => { setQuery(""); setCategory("all"); setInStockOnly(false); setWishlistOnly(false); }} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50">সব ফিল্টার মুছুন</button>}
              {!emptyCatalogMessage && (isPlantMarket ? <Link href="/green-exchange/board" className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-xs font-bold text-white hover:bg-emerald-800">গাছ বিনিময় দেখুন</Link> : <Link href="/buyer-demands" className="inline-flex min-h-10 items-center rounded-xl bg-emerald-900 px-4 text-xs font-bold text-white hover:bg-emerald-800">চাহিদা জানান</Link>)}
            </div>
          </div>}
        </section>
      </div>

      {authReturnTo && <MarketplaceAuthModal returnTo={authReturnTo} onClose={() => setAuthReturnTo(null)} />}
      {showStickyCart && (
        <aside role="region" aria-label="কার্ট থেকে COD অর্ডারে এগিয়ে যান"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 mx-auto max-w-2xl rounded-2xl border border-emerald-700/20 bg-white/95 px-3 pb-3 pt-4 shadow-[0_16px_50px_rgba(0,35,22,.23)] backdrop-blur-lg sm:inset-x-6 sm:bottom-5 sm:px-4">
          <button type="button" onClick={() => setCartBarDismissed(true)} aria-label="কার্টের নিচের বার বন্ধ করুন"
            className="absolute right-1 top-0 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
            <X size={15} aria-hidden="true" />
          </button>
          <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><ShoppingCart size={22} aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-black text-emerald-950">
                  {cartNotice ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden="true" /> : null}
                  {cartSummary.units > 0 ? "কার্টে " + money(cartSummary.units) + "টি পণ্য" : "পণ্য কার্টে যোগ হয়েছে"}
                </p>
                <p role="status" aria-live="polite" className="line-clamp-2 text-[11px] leading-4 text-slate-600">
                  {cartNotice || (cartSummary.lines > 0 ? money(cartSummary.lines) + " ধরনের পণ্য রয়েছে। COD অর্ডার করতে এগিয়ে যান।" : "পরের পেজে ঠিকানা ও মূল্য যাচাই করে অর্ডার নিশ্চিত করুন।")}
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] gap-2 sm:w-auto sm:min-w-[320px]">
              <Link href="/cart" className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-emerald-900 px-2 py-2 text-center text-[11px] font-bold text-emerald-900 hover:bg-emerald-50 sm:text-xs">
                কার্ট দেখুন
              </Link>
              <Link href="/checkout" className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-2 py-2 text-center text-[11px] font-extrabold leading-5 text-white hover:bg-emerald-800 sm:px-3 sm:text-xs">
                COD অর্ডার নিশ্চিত করতে যান
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

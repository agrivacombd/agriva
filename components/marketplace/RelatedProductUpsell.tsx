"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, ShoppingCart } from "lucide-react";
import MarketplaceAuthModal from "@/components/marketplace/MarketplaceAuthModal";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";
import { resolveMarketplaceCartUser } from "@/lib/marketplace/cart-auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackProductRankEvents } from "@/lib/marketplace/product-rank-tracking";

export type RelatedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number | string | null;
  stock: number | null;
  unit: string | null;
  image_url: string | null;
};

type Props = {
  products: RelatedProduct[];
  heading: string;
  subtitle: string;
  categoryHref: string;
  /** Render a two-item cross-sell panel under the product gallery. */
  compact?: boolean;
};

const numberBN = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);
const unitLabels: Record<string, string> = {
  kg: "কেজি", g: "গ্রাম", piece: "পিস", pack: "প্যাকেট", liter: "লিটার", bag: "বস্তা",
};
const maxAllowed = (stock: number | null) =>
  Math.min(100, Math.max(0, Math.floor(Number(stock) || 0)));

export default function RelatedProductUpsell({ products, heading, subtitle, categoryHref, compact = false }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const addInFlight = useRef(false);
  const [loginReturnTo, setLoginReturnTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const addToCart = useCallback(async (product: RelatedProduct, requestedQuantity: number) => {
    const limit = maxAllowed(product.stock);
    const price = Number(product.price);
    if (addInFlight.current) return;
    if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > limit ||
        product.price === null || !Number.isFinite(price) || price < 0) {
      setNotice({ kind: "error", text: "নির্বাচিত পণ্যের দাম, পরিমাণ বা স্টক পরিবর্তিত হয়েছে। বিস্তারিত যাচাই করুন।" });
      return;
    }
    addInFlight.current = true;
    setBusyId(product.id);
    setNotice(null);
    try {
      const { supabase, user } = await resolveMarketplaceCartUser();
      if (!user) {
        // Restore this exact cart intent once after email, phone, Google or Facebook login.
        const next = new URL(window.location.href);
        next.searchParams.set("relatedAddToCart", product.id);
        next.searchParams.set("qty", String(requestedQuantity));
        next.hash = "related-products";
        setLoginReturnTo(next.pathname + next.search + next.hash);
        return;
      }
      const { error } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: product.id,
        p_quantity: requestedQuantity,
      });
      if (error) {
        const outOfStock = /insufficient stock|product unavailable|maximum quantity/i.test(error.message ?? "");
        setNotice({ kind: "error", text: outOfStock
          ? "কার্টে আগে থাকা পরিমাণ বা বর্তমান স্টকের কারণে যোগ করা যায়নি। কার্ট যাচাই করুন।"
          : "কার্টে যোগ করা যায়নি। আবার চেষ্টা করুন।" });
        return;
      }
      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT", item_id: product.id, quantity: requestedQuantity, value: price * requestedQuantity,
      });
      trackMetaEvent("AddToCart", {
        currency: "BDT", value: price * requestedQuantity, content_type: "product",
        content_ids: [product.id], num_items: requestedQuantity,
      });
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      setNotice({ kind: "success", text: product.name + " — " + numberBN(requestedQuantity) + "টি কার্টে যোগ হয়েছে।" });
    } catch (error) {
      console.error("Related product add-to-cart failed:", error instanceof Error ? error.name : "unknown");
      setNotice({ kind: "error", text: "লগইন সেবা বা সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
    } finally {
      addInFlight.current = false;
      setBusyId(null);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedId = url.searchParams.get("relatedAddToCart");
    if (!requestedId) return;
    const rawQty = url.searchParams.get("qty");
    // Consume before making an async cart request: refresh must not double-add.
    url.searchParams.delete("relatedAddToCart");
    url.searchParams.delete("qty");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    const product = products.find(item => item.id === requestedId);
    const quantity = rawQty && /^\d{1,3}$/.test(rawQty) ? Number(rawQty) : 0;
    if (!product || quantity < 1 || quantity > maxAllowed(product.stock)) {
      setNotice({ kind: "error", text: "আগের নির্বাচিত পণ্য বা পরিমাণ পাওয়া যাচ্ছে না। আবার বেছে নিন।" });
      return;
    }
    setQuantities(current => ({ ...current, [product.id]: quantity }));
    void addToCart(product, quantity);
  }, [addToCart, products]);

  function updateQuantity(id: string, desired: number, stock: number | null) {
    const limit = maxAllowed(stock);
    if (limit < 1) return;
    setQuantities(current => ({ ...current, [id]: Math.max(1, Math.min(limit, desired)) }));
    setNotice(null);
  }


  if (compact) {
    return (
      <section id="related-products" aria-labelledby="related-product-heading"
        className="scroll-mt-24 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">AGRIVA · আপনার জন্য</p>
            <h2 id="related-product-heading" className="mt-1 text-base font-black leading-6 text-emerald-950 sm:text-lg">{heading}</h2>
          </div>
          <Link href={categoryHref} className="inline-flex min-h-9 shrink-0 items-center text-xs font-bold text-emerald-800 underline underline-offset-4">
            সব দেখুন
          </Link>
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-600">{subtitle}</p>

        {notice && (
          <div role={notice.kind === "error" ? "alert" : "status"} aria-live="polite"
            className={"mb-3 rounded-xl border px-3 py-2 text-xs font-semibold leading-5 " +
              (notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-900")}>
            <span>{notice.text}</span>
            {notice.kind === "success" && (
              <span className="mt-2 flex flex-wrap gap-3">
                <Link href="/cart" className="underline underline-offset-2">কার্ট দেখুন</Link>
                <Link href="/checkout" className="underline underline-offset-2">চেকআউট</Link>
              </span>
            )}
          </div>
        )}

        <div className="grid min-w-0 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))" }}>
          {products.slice(0, 2).map(product => {
            const limit = maxAllowed(product.stock);
            const price = product.price === null ? NaN : Number(product.price);
            const purchasable = limit > 0 && Number.isFinite(price) && price >= 0;
            const quantity = Math.min(limit || 1, quantities[product.id] ?? 1);
            const unit = product.unit ? unitLabels[product.unit] ?? product.unit : null;
            const detailHref = "/marketplace/" + product.slug;
            const busy = busyId !== null;
            return (
              <article key={product.id} className="min-w-0 rounded-xl border border-emerald-900/10 bg-white p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Link href={detailHref}
                    onClick={() => trackProductRankEvents("marketplace", "listing_click", [product.id])}
                    className="relative block h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-emerald-50"
                    aria-label={product.name + " বিস্তারিত দেখুন"}>
                    {product.image_url ? (
                      <Image src={product.image_url} fill unoptimized
                        sizes="68px" alt={product.name + " — AGRIVA Marketplace"}
                        className="object-contain p-1" />
                    ) : <span className="grid h-full place-items-center text-2xl" aria-hidden="true">🌱</span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={detailHref}
                      onClick={() => trackProductRankEvents("marketplace", "listing_click", [product.id])}
                      className="line-clamp-2 break-words text-xs font-bold leading-5 text-emerald-950 hover:underline">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm font-black text-emerald-900">
                      {Number.isFinite(price) && price >= 0 ? "৳" + numberBN(price) : "মূল্য যাচাই করুন"}
                      {unit && <span className="ml-1 text-[10px] font-medium text-slate-500">/ {unit}</span>}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{purchasable ? "স্টকে আছে" : "স্টক যাচাই করুন"}</p>
                  </div>
                </div>

                {purchasable ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex h-9 items-center rounded-lg border border-slate-200"
                      role="group" aria-label={product.name + " পরিমাণ নির্বাচন"}>
                      <button type="button" disabled={busy || quantity <= 1}
                        onClick={() => updateQuantity(product.id, quantity - 1, product.stock)}
                        aria-label={product.name + " পরিমাণ কমান"}
                        className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-emerald-50 disabled:opacity-40">
                        <Minus size={14} />
                      </button>
                      <output aria-live="polite" className="min-w-5 text-center text-xs font-black tabular-nums">{numberBN(quantity)}</output>
                      <button type="button" disabled={busy || quantity >= limit}
                        onClick={() => updateQuantity(product.id, quantity + 1, product.stock)}
                        aria-label={product.name + " পরিমাণ বাড়ান"}
                        className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-emerald-50 disabled:opacity-40">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button type="button" disabled={busy}
                      onClick={() => {
                        trackProductRankEvents("marketplace", "listing_click", [product.id]);
                        void addToCart(product, quantity);
                      }}
                      aria-label={product.name + " কার্টে যোগ করুন"}
                      className="flex min-h-9 min-w-[110px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-2 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <ShoppingCart size={14} aria-hidden="true" />
                      {busyId === product.id ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}
                    </button>
                  </div>
                ) : (
                  <Link href={detailHref} className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-emerald-800 text-xs font-bold text-emerald-900">
                    বিস্তারিত দেখুন
                  </Link>
                )}
              </article>
            );
          })}
        </div>
        {loginReturnTo && <MarketplaceAuthModal returnTo={loginReturnTo} onClose={() => setLoginReturnTo(null)} />}
      </section>
    );
  }

  return (
    <section id="related-products" aria-labelledby="related-product-heading"
      className="mt-7 scroll-mt-24 rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#edf8f0] via-white to-[#f5fbef] p-4 shadow-sm sm:mt-9 sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-emerald-700">Continue shopping · AGRIVA</p>
          <h2 id="related-product-heading" className="mt-1 text-xl font-black tracking-tight text-emerald-950 sm:text-2xl">{heading}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">{subtitle}</p>
        </div>
        <Link href={categoryHref} className="inline-flex min-h-10 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 hover:text-emerald-600">
          আরও পণ্য দেখুন
        </Link>
      </div>

      {notice && (
        <div role={notice.kind === "error" ? "alert" : "status"} aria-live="polite"
          className={"mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold " +
            (notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-900")}>
          <span className="flex min-w-0 items-center gap-2">
            {notice.kind === "success" && <CheckCircle2 size={18} className="shrink-0 text-emerald-700" aria-hidden="true" />}
            {notice.text}
          </span>
          {notice.kind === "success" && <span className="flex flex-wrap gap-2">
            <Link href="/cart" className="rounded-lg border border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-900">কার্ট দেখুন</Link>
            <Link href="/checkout" className="rounded-lg bg-emerald-900 px-3 py-2 text-xs font-bold text-white">চেকআউট</Link>
          </span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {products.map(product => {
          const limit = maxAllowed(product.stock);
          const price = product.price === null ? NaN : Number(product.price);
          const purchasable = limit > 0 && Number.isFinite(price) && price >= 0;
          const qty = Math.min(limit || 1, quantities[product.id] ?? 1);
          const unit = product.unit ? unitLabels[product.unit] ?? product.unit : null;
          const detailHref = "/marketplace/" + product.slug;
          const busy = busyId !== null;
          return (
            <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
              <Link href={detailHref} onClick={() => trackProductRankEvents("marketplace", "listing_click", [product.id])}
                className="relative block aspect-square overflow-hidden bg-[#f5faf6]" aria-label={product.name + " বিস্তারিত দেখুন"}>
                {product.image_url ? <Image src={product.image_url} alt={product.name + " — AGRIVA Marketplace"} fill unoptimized
                  sizes="(max-width: 1023px) 50vw, 25vw" className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]" />
                  : <span className="grid h-full place-items-center text-4xl" aria-hidden="true">🌱</span>}
                <span className={"absolute left-2 top-2 rounded-lg px-2 py-1 text-[10px] font-black shadow-sm " +
                  (purchasable ? "bg-emerald-800 text-white" : "bg-slate-800 text-white")}>
                  {purchasable ? "স্টকে আছে" : "স্টক যাচাই করুন"}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <Link href={detailHref} onClick={() => trackProductRankEvents("marketplace", "listing_click", [product.id])}
                  className="line-clamp-2 min-h-10 break-words text-xs font-bold leading-5 text-slate-900 hover:text-emerald-800 sm:text-sm">{product.name}</Link>
                <p className="mt-2 text-base font-black text-emerald-900 sm:text-lg">
                  {Number.isFinite(price) && price >= 0 ? "৳" + numberBN(price) : "মূল্য যাচাই করুন"}
                  {unit && <span className="ml-1 text-[10px] font-medium text-slate-500">/ {unit}</span>}
                </p>
                <div className="mt-auto pt-3">
                  {purchasable ? (
                    <>
                      <div className="mb-2 flex h-10 items-center justify-between overflow-hidden rounded-xl border border-slate-200"
                        role="group" aria-label={product.name + " পরিমাণ নির্বাচন"}>
                        <button type="button" aria-label={product.name + " পরিমাণ কমান"} disabled={busy || qty <= 1}
                          onClick={() => updateQuantity(product.id, qty - 1, product.stock)}
                          className="grid h-10 w-10 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Minus size={15} /></button>
                        <output aria-live="polite" className="font-black tabular-nums text-emerald-950">{numberBN(qty)}</output>
                        <button type="button" aria-label={product.name + " পরিমাণ বাড়ান"} disabled={busy || qty >= limit}
                          onClick={() => updateQuantity(product.id, qty + 1, product.stock)}
                          className="grid h-10 w-10 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Plus size={15} /></button>
                      </div>
                      <button type="button" disabled={busy} onClick={() => {
                        trackProductRankEvents("marketplace", "listing_click", [product.id]);
                        void addToCart(product, qty);
                      }} aria-label={product.name + " কার্টে যোগ করুন"}
                        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-2 py-2.5 text-[11px] font-black text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-wait disabled:opacity-60 sm:text-sm">
                        <ShoppingCart size={16} aria-hidden="true" />
                        {busyId === product.id ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}
                      </button>
                    </>
                  ) : (
                    <Link href={detailHref} className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-900 px-2 py-2.5 text-center text-xs font-bold text-emerald-900">বিস্তারিত দেখুন</Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {loginReturnTo && <MarketplaceAuthModal returnTo={loginReturnTo} onClose={() => setLoginReturnTo(null)} />}
    </section>
  );
}

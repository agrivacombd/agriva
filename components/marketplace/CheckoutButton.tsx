"use client";

import { useEffect, useRef, useState } from "react";
import MarketplaceAuthModal from "@/components/marketplace/MarketplaceAuthModal";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";
import { resolveMarketplaceCartUser } from "@/lib/marketplace/cart-auth";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Minus, Phone, Plus, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { calculateShippingFee } from "@/lib/marketplace/shipping-fee";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

type Props = {
  productId: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  stock: number;
  unitLabel: string;
  shippingClass: string | null;
  shippingWeightGrams: number | null;
  disabled?: boolean;
};

const CHOICES = [1, 2, 3, 5, 10];
const numberBN = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);
// Numeric keyboards in Bangladesh can output Bengali digits; normalize before
// validating, while keeping the server's integer-only cart contract unchanged.
const normalizeQuantityDigits = (value: string) => value
  .replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6))
  .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
  .trim();

export default function CheckoutButton({
  productId, productSlug, productName, unitPrice, stock, unitLabel, shippingClass, shippingWeightGrams, disabled = false,
}: Props) {
  const maxQuantity = Math.min(100, Math.max(0, Math.floor(Number(stock) || 0)));
  const [quantity, setQuantity] = useState(1);
  const [customQuantityOpen, setCustomQuantityOpen] = useState(false);
  const [customQuantitySelected, setCustomQuantitySelected] = useState(false);
  const [customQuantityInput, setCustomQuantityInput] = useState("1");
  const delivery = calculateShippingFee([{ shipping_class: shippingClass, shipping_weight_grams: shippingWeightGrams, quantity }]);
  const unavailable = disabled || maxQuantity === 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !delivery;
  const primaryOrderRef = useRef<HTMLButtonElement>(null);
  const [primaryOrderVisible, setPrimaryOrderVisible] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  // A synchronous guard prevents duplicate cart RPCs before React paints disabled state.
  const addRequestInFlightRef = useRef(false);
  const directCheckoutInFlightRef = useRef(false);
  const directCheckoutIdempotencyKeyRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [address, setAddress] = useState("");
  const selectedDistrict = BANGLADESH_DISTRICTS.find(item => item.name === district);
  const availableUpazilas = selectedDistrict?.upazilas ?? [];
  const productHref = "/marketplace/" + productSlug;
  const pendingAddHref = productHref + "?addToCart=" + encodeURIComponent(productId) + "&qty=" + quantity;
  const loginHref = "/login?next=" + encodeURIComponent(productHref);

  // Product cards can link directly to the purchase form without skipping quantity selection.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.hash === "#product-direct-cod") {
      setFormOpen(true);
      const rawBuyQuantity = url.searchParams.get("buyQty");
      if (rawBuyQuantity !== null) {
        // A related-product Buy Now link should preserve quantity without placing an order.
        url.searchParams.delete("buyQty");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
        const desired = /^\d{1,3}$/.test(rawBuyQuantity) ? Number(rawBuyQuantity) : 0;
        if (desired >= 1 && desired <= maxQuantity) setQuantity(desired);
        else setMessage("নির্বাচিত পরিমাণ এখন স্টকে নেই। নতুন পরিমাণ বেছে নিন।");
      }
    }
    const intendedProductId = url.searchParams.get("addToCart");
    if (intendedProductId !== productId) return;
    const rawQty = url.searchParams.get("qty");
    url.searchParams.delete("addToCart");
    url.searchParams.delete("qty");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    const desiredQty = rawQty && /^\d{1,3}$/.test(rawQty) ? Number(rawQty) : 1;
    if (!Number.isSafeInteger(desiredQty) || desiredQty < 1 || desiredQty > 100 || desiredQty > maxQuantity) {
      setMessage("পণ্যের স্টক বা নির্বাচিত পরিমাণ পরিবর্তিত হয়েছে। নতুন পরিমাণ বেছে নিন।");
      return;
    }
    setQuantity(desiredQty);
    void addToCart(desiredQty);
    // The one-time URL intent is removed synchronously before attempting the cart RPC.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Show one compact mobile action bar only when the in-page primary CTA is offscreen.
  useEffect(() => {
    const target = primaryOrderRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setPrimaryOrderVisible(entry.isIntersecting);
    }, { rootMargin: "0px 0px -72px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function openDirectOrder() {
    if (unavailable || loading || Boolean(orderId)) return;
    setFormOpen(true);
    setMessage("");
    window.requestAnimationFrame(() => {
      document.getElementById("product-direct-cod")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectQuantity(value: number) {
    if (!Number.isSafeInteger(value) || maxQuantity < 1) return;
    setQuantity(Math.min(maxQuantity, Math.max(1, value)));
    directCheckoutIdempotencyKeyRef.current = null;
    setCustomQuantitySelected(false);
    setCustomQuantityOpen(false);
    setMessage("");
  }

  function toggleCustomQuantity() {
    if (unavailable || loading || addingToCart || Boolean(orderId)) return;
    setCustomQuantityInput(String(quantity));
    setCustomQuantityOpen(open => !open);
    setMessage("");
  }

  function applyCustomQuantity() {
    const input = normalizeQuantityDigits(customQuantityInput);
    const requested = /^[0-9]{1,3}$/.test(input) ? Number(input) : 0;
    if (!Number.isSafeInteger(requested) || requested < 1 || requested > maxQuantity) {
      setMessage("১ থেকে " + numberBN(maxQuantity) + " " + unitLabel + " এর মধ্যে সম্পূর্ণ সংখ্যা লিখুন (স্টক ও অর্ডার সীমা অনুযায়ী)।");
      return;
    }
    setQuantity(requested);
    directCheckoutIdempotencyKeyRef.current = null;
    setCustomQuantityInput(String(requested));
    setCustomQuantitySelected(true);
    setCustomQuantityOpen(false);
    // Applying a custom quantity should also honour the buyer's cart intent.
    // Pass the validated number explicitly: React state updates are async.
    void addToCart(requested);
  }

  async function addToCart(requestedQuantity = quantity) {
    if (unavailable || addRequestInFlightRef.current || addingToCart || loading) return;
    if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > maxQuantity) { setMessage("পণ্যের স্টক যাচাই করে আবার চেষ্টা করুন।"); return; }
    addRequestInFlightRef.current = true;
    setAddingToCart(true);
    setLoginRequired(false);
    setCartAdded(false);
    setMessage("");
    try {
      const { supabase, user } = await resolveMarketplaceCartUser();
      if (!user) {
        setAuthPopupOpen(true);
        setMessage("লগইন করুন অথবা মোবাইল/ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করুন।");
        return;
      }
      const { error: addError } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: productId,
        p_quantity: requestedQuantity,
      });
      if (addError) {
        const reason = addError.message || "";
        setMessage(/Insufficient stock|Product unavailable|maximum quantity/i.test(reason)
          ? "স্টক বা কার্টে আগে থেকে থাকা পরিমাণের কারণে পণ্য যোগ করা যায়নি। কার্ট যাচাই করুন।"
          : "কার্টে পণ্য যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT", item_id: productId, quantity: requestedQuantity, value: unitPrice * requestedQuantity,
      });
      trackMetaEvent("AddToCart", { currency: "BDT", value: unitPrice * requestedQuantity, content_type: "product", content_ids: [productId], num_items: requestedQuantity });
      setCartAdded(true);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      setMessage(numberBN(requestedQuantity) + " " + unitLabel + " কার্টে যোগ হয়েছে।");
    } catch (error) {
      console.error("Add to cart failed:", error);
      setMessage("লগইন সেবা বা সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      addRequestInFlightRef.current = false;
      setAddingToCart(false);
    }
  }

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailable || directCheckoutInFlightRef.current || loading || orderId) return;
    if (!fullName.trim() || !phone.trim() || !district.trim() || !upazila.trim()) {
      setMessage("নাম, মোবাইল নম্বর, জেলা ও উপজেলা/থানা পূরণ করুন।");
      return;
    }
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
      setMessage("সঠিক মোবাইল নম্বর দিন। উদাহরণ: 01XXXXXXXXX");
      return;
    }
    trackMetaEvent("InitiateCheckout", { currency: "BDT", value: unitPrice * quantity + (delivery?.fee ?? 0), content_type: "product", content_ids: [productId], num_items: quantity });
    directCheckoutInFlightRef.current = true;
    setLoading(true);
    setLoginRequired(false);
    setMessage("");
    try {
      // Ensure a verified regular or anonymous Supabase session exists before the server checkout request.
      // This lets guest buyers place COD orders without creating a permanent account.
      await resolveMarketplaceCartUser();
      if (!directCheckoutIdempotencyKeyRef.current) {
        directCheckoutIdempotencyKeyRef.current = globalThis.crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, "");
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          idempotencyKey: directCheckoutIdempotencyKeyRef.current,
          paymentMethod: "cod",
          shippingAddress: {
            fullName: fullName.trim(),
            phone: normalizedPhone,
            district: district.trim(),
            upazila: upazila.trim(),
            address: address.trim(),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) setLoginRequired(true);
        setMessage(typeof data.error === "string" ? data.error : "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      const confirmedId = String(data.orderId || "");
      setOrderId(confirmedId);
      const orderTotal = Number(data.total);
      trackAnalyticsEvent("marketplace_order_placed", {
        currency: "BDT",
        ...(Number.isFinite(orderTotal) ? { value: orderTotal } : {}),
        item_id: productId,
        quantity,
      });
      if (data.orderId && Number.isFinite(orderTotal)) {
        trackMetaEvent("Purchase", { currency: "BDT", value: orderTotal, content_type: "product", content_ids: [productId], num_items: quantity }, confirmedId);
      }
      setMessage("অর্ডার সফল হয়েছে। " + (Number.isFinite(orderTotal) ? "মোট মূল্য ৳" + numberBN(orderTotal) + "।" : "অর্ডার নম্বরটি সংরক্ষণ করুন।"));
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। অর্ডারটি তৈরি হয়েছে কি না যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      directCheckoutInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className={"space-y-2.5 sm:space-y-3 " + (cartAdded ? "pb-24 sm:pb-28" : "")}>
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black text-[#17351f]">পরিমাণ নির্বাচন করুন</h2>
          <span className="text-xs text-slate-500">সর্বোচ্চ {numberBN(maxQuantity)} {unitLabel} (প্রতি অর্ডার)</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="পরিমাণ নির্বাচন">
          {CHOICES.filter(value => value <= maxQuantity).map(value => (
            <button key={value} type="button" aria-pressed={quantity === value && !customQuantitySelected && !customQuantityOpen}
              disabled={unavailable || loading || addingToCart || Boolean(orderId)}
              onClick={() => selectQuantity(value)} aria-label={numberBN(value) + " " + unitLabel + " নির্বাচন করুন"}
              className={"min-h-11 min-w-11 rounded-xl border px-2.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 sm:px-3 " +
                (quantity === value && !customQuantitySelected && !customQuantityOpen ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400")}>
              {numberBN(value)}<span className="hidden sm:inline"> {unitLabel}</span>
            </button>
          ))}
          <button type="button" onClick={toggleCustomQuantity}
            aria-pressed={customQuantityOpen || customQuantitySelected}
            aria-expanded={customQuantityOpen} aria-controls="agriva-custom-product-quantity"
            disabled={unavailable || loading || addingToCart || Boolean(orderId)}
            className={"min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 " +
              (customQuantityOpen || customQuantitySelected ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400")}>
            Custom{customQuantitySelected && !customQuantityOpen ? " · " + numberBN(quantity) : ""}
          </button>
        </div>
        {customQuantityOpen && (
          <div id="agriva-custom-product-quantity" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <label htmlFor="agriva-custom-quantity-input" className="block text-xs font-bold text-emerald-950">
              আপনার প্রয়োজনীয় পরিমাণ লিখুন
            </label>
            <div className="mt-2 flex flex-wrap items-stretch gap-2">
              <input id="agriva-custom-quantity-input" type="text" inputMode="numeric"
                autoComplete="off" pattern="[0-9০-৯٠-٩]*" maxLength={3} value={customQuantityInput}
                onChange={event => setCustomQuantityInput(event.target.value)}
                onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); applyCustomQuantity(); } }}
                disabled={unavailable || loading || addingToCart || Boolean(orderId)}
                aria-describedby="agriva-custom-quantity-hint"
                className="min-h-11 w-28 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-emerald-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 sm:max-w-36" />
              <button type="button" onClick={applyCustomQuantity}
                disabled={unavailable || loading || addingToCart || Boolean(orderId)}
                className="min-h-11 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50">
                প্রয়োগ করে কার্টে যোগ করুন
              </button>
            </div>
            <p id="agriva-custom-quantity-hint" className="mt-2 text-xs leading-5 text-slate-600">
              সর্বনিম্ন ১, সর্বোচ্চ {numberBN(maxQuantity)} {unitLabel}। প্রয়োগ করলে এই পরিমাণ কার্টে যোগ হবে এবং মূল্য ও ডেলিভারি হিসাব আপডেট হবে।
            </p>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3 sm:border-t sm:border-slate-100 sm:pt-4">
          <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-slate-200" role="group" aria-label="পরিমাণ বাড়ান বা কমান">
            <button type="button" aria-label="পরিমাণ কমান" disabled={unavailable || quantity <= 1 || loading || addingToCart || Boolean(orderId)}
              onClick={() => selectQuantity(quantity - 1)} className="grid h-11 w-11 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Minus size={18} /></button>
            <output aria-live="polite" className="min-w-12 border-x border-slate-200 px-3 text-center font-black tabular-nums">{numberBN(quantity)}</output>
            <button type="button" aria-label="পরিমাণ বাড়ান" disabled={unavailable || quantity >= maxQuantity || loading || addingToCart || Boolean(orderId)}
              onClick={() => selectQuantity(quantity + 1)} className="grid h-11 w-11 place-items-center hover:bg-emerald-50 disabled:opacity-40"><Plus size={18} /></button>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">পণ্যের মোট মূল্য (ডেলিভারি ছাড়া)</p>
            <p aria-live="polite" className="text-2xl font-black text-emerald-700">৳{numberBN(unitPrice * quantity)}</p>
            <p className="text-xs text-slate-500">৳{numberBN(unitPrice)} × {numberBN(quantity)} {unitLabel} · ডেলিভারি {delivery ? "৳" + numberBN(delivery.fee) : "যাচাই প্রয়োজন"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button ref={primaryOrderRef} type="button" disabled={unavailable || loading || Boolean(orderId)} onClick={openDirectOrder}
          className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-3 text-xs font-black text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
          <ShoppingBag size={18} className="shrink-0" aria-hidden="true" /> {unavailable ? "অর্ডার বন্ধ" : "Buy Now"}
        </button>
        <button type="button" disabled={unavailable || loading || addingToCart || Boolean(orderId)} onClick={() => void addToCart()}
          className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-800 bg-white px-2 py-3 text-xs font-black text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
          <ShoppingCart size={18} className="shrink-0" aria-hidden="true" /> {addingToCart ? "Adding…" : "Add to Cart"}
        </button>
      </div>
      <a href="tel:+8801717504028" aria-label={"ফোনে " + productName + " অর্ডার করুন: ০১৭১৭৫০৪০২৮"}
        className="inline-flex min-h-10 items-center gap-2 px-1 text-xs font-semibold text-emerald-800 underline underline-offset-4 transition hover:text-emerald-950 sm:text-sm">
        <Phone size={16} aria-hidden="true" /> ফোনে অর্ডারের সহায়তা নিন
      </a>

            <div id="product-direct-cod" className="scroll-mt-28 overflow-hidden rounded-xl border border-slate-200 bg-[#fbfcf7]">
        <button type="button" aria-expanded={formOpen} aria-controls="direct-cod-form" onClick={() => setFormOpen(open => !open)}
          className="flex min-h-12 w-full items-center justify-between gap-2 px-4 py-4 text-left text-sm font-black text-[#17351f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:px-5">
          <span>সরাসরি ক্যাশ অন ডেলিভারি অর্ডার</span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-800">{formOpen ? "ফর্ম বন্ধ করুন" : "ফর্ম খুলুন"} <ChevronDown size={17} className={formOpen ? "rotate-180 transition-transform" : "transition-transform"} /></span>
        </button>
        {formOpen && (
          <form id="direct-cod-form" onSubmit={checkout} className="space-y-4 border-t border-emerald-950/10 px-4 py-5 sm:px-5">
            <p className="text-sm leading-6 text-slate-600">নির্বাচিত {numberBN(quantity)} {unitLabel} সরাসরি অর্ডার করুন। লগইন ছাড়াই অর্ডার করতে পারবেন—পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#17351f]">আপনার নাম *
                <input value={fullName} onChange={e => { setFullName(e.target.value); directCheckoutIdempotencyKeyRef.current = null; }} autoComplete="name" maxLength={100} required placeholder="পূর্ণ নাম" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-bold text-[#17351f]">মোবাইল নম্বর *
                <input value={phone} onChange={e => { setPhone(e.target.value); directCheckoutIdempotencyKeyRef.current = null; }} autoComplete="tel" type="tel" inputMode="tel" maxLength={16} required placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">জেলা *
                <select value={district} onChange={e => { setDistrict(e.target.value); setUpazila(""); directCheckoutIdempotencyKeyRef.current = null; }} autoComplete="address-level1" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                  <option value="">জেলা বেছে নিন</option>
                  {BANGLADESH_DISTRICTS.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">উপজেলা / থানা *
                <select value={upazila} onChange={e => { setUpazila(e.target.value); directCheckoutIdempotencyKeyRef.current = null; }} autoComplete="address-level2" required disabled={!district} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100">
                  <option value="">{district ? "উপজেলা / থানা বেছে নিন" : "আগে জেলা নির্বাচন করুন"}</option>
                  {availableUpazilas.map((name, index) => <option key={district + "-" + index} value={name.trim()}>{name.trim()}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">সম্পূর্ণ ঠিকানা (ঐচ্ছিক)
                <textarea value={address} onChange={e => { setAddress(e.target.value); directCheckoutIdempotencyKeyRef.current = null; }} autoComplete="street-address" maxLength={500} rows={3} placeholder="গ্রাম/এলাকা, ইউনিয়ন/ওয়ার্ড, বাড়ি/রোড" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <span className="text-sm font-bold">সর্বমোট (ডেলিভারিসহ)</span>
              <strong className="text-lg text-emerald-800">{delivery ? "৳" + numberBN(unitPrice * quantity + delivery.fee) : "ওজন যাচাই প্রয়োজন"}</strong>
            </div>
            <p className="text-xs leading-5 text-slate-500">পণ্যের দাম: ৳{numberBN(unitPrice * quantity)} · ডেলিভারি: {delivery ? "৳" + numberBN(delivery.fee) : "ওজন যাচাই প্রয়োজন"}। চূড়ান্ত পরিমাণ ও চার্জ সার্ভারে যাচাই হবে।</p>
            <button type="submit" disabled={unavailable || loading || Boolean(orderId)} className="w-full rounded-xl bg-[#17351f] px-5 py-3.5 font-black text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "অর্ডার তৈরি হচ্ছে..." : orderId ? "অর্ডার নিশ্চিত হয়েছে" : "ক্যাশ অন ডেলিভারিতে অর্ডার নিশ্চিত করুন"}
            </button>
          </form>
        )}
      </div>
      {message && <p role="status" aria-live="polite" className="break-words rounded-xl bg-[#eef5ed] p-3 text-sm text-[#17351f]">{message}</p>}
      {loginRequired && <Link href={loginHref} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">লগইন করে অর্ডার করুন</Link>}
      {orderId && <Link href="/orders" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50">আমার অর্ডার দেখুন</Link>}

      {authPopupOpen && (
        <MarketplaceAuthModal returnTo={pendingAddHref} onClose={() => setAuthPopupOpen(false)} />
      )}

      {!primaryOrderVisible && !formOpen && !cartAdded && !authPopupOpen && !unavailable && !orderId && (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-emerald-900/10 bg-white/95 px-3 pt-2 shadow-[0_-6px_28px_rgba(0,35,22,.12)] backdrop-blur-lg sm:hidden"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <div className="min-w-0 shrink-0">
              <p aria-live="polite" className="text-sm font-black tabular-nums text-emerald-950">৳{numberBN(unitPrice * quantity)}</p>
              <p className="text-[10px] text-slate-500">ডেলিভারি ছাড়া</p>
            </div>
            <button type="button" disabled={loading} onClick={openDirectOrder}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-1.5 text-xs font-black text-white disabled:opacity-50">
              <ShoppingBag size={16} aria-hidden="true" /> Buy Now
            </button>
            <button type="button" disabled={loading || addingToCart}
              onClick={() => void addToCart()} aria-label={productName + " কার্টে যোগ করুন"}
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border-2 border-emerald-800 bg-white px-1.5 text-[11px] font-extrabold text-emerald-900 disabled:opacity-50">
              <ShoppingCart size={15} className="shrink-0" aria-hidden="true" />
              {addingToCart ? "Adding…" : "Add to Cart"}
            </button>
          </div>
        </div>
      )}

      {cartAdded && (
        <aside role="region" aria-label="কার্টে যোগ করা পণ্যের চেকআউট"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[60] mx-auto max-w-2xl rounded-2xl border border-emerald-700/20 bg-white/95 p-3 shadow-[0_16px_50px_rgba(0,35,22,.23)] backdrop-blur-lg sm:inset-x-6 sm:bottom-5 sm:p-4">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <CheckCircle2 size={25} className="shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0 flex-1"><p role="status" className="text-sm font-bold text-emerald-950">নির্বাচিত পণ্য কার্টে যোগ হয়েছে।</p><p className="mt-1 text-[11px] leading-4 text-slate-600">পরের পেজে ঠিকানা ও ডেলিভারি চার্জ যাচাই করে COD অর্ডার নিশ্চিত করুন।</p></div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Link href="/cart" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-900 px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50 sm:flex-none">কার্ট দেখুন</Link>
              <Link href="/checkout" className="inline-flex min-h-11 min-w-0 flex-[1.6] items-center justify-center rounded-xl bg-emerald-700 px-2 py-2 text-center text-[11px] font-black leading-5 text-white hover:bg-emerald-800 sm:flex-none sm:px-4 sm:text-xs">COD অর্ডার নিশ্চিত করতে যান</Link>
            </div>
            <button type="button" onClick={() => setCartAdded(false)} aria-label="কার্ট বার বন্ধ করুন" className="absolute right-2 top-1 rounded-full p-1 text-slate-500 hover:bg-slate-100 sm:-right-2 sm:-top-2 sm:bg-white sm:shadow-sm"><X size={14} /></button>
          </div>
        </aside>
      )}
    </div>
  );
}

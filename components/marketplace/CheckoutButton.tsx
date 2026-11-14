"use client";

import { useEffect, useRef, useState } from "react";
import MarketplaceAuthModal from "@/components/marketplace/MarketplaceAuthModal";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";
import { resolveMarketplaceCartUser } from "@/lib/marketplace/cart-auth";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Minus, Phone, Plus, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

type Props = {
  productId: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  stock: number;
  unitLabel: string;
  disabled?: boolean;
};

const CHOICES = [1, 2, 3, 5, 10];
const numberBN = (value: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

export default function CheckoutButton({
  productId, productSlug, productName, unitPrice, stock, unitLabel, disabled = false,
}: Props) {
  const maxQuantity = Math.min(100, Math.max(0, Math.floor(Number(stock) || 0)));
  const unavailable = disabled || maxQuantity === 0 || !Number.isFinite(unitPrice) || unitPrice < 0;
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  // A synchronous guard prevents duplicate cart RPCs before React paints disabled state.
  const addRequestInFlightRef = useRef(false);
  const directCheckoutInFlightRef = useRef(false);
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
    if (window.location.hash === "#product-direct-cod") setFormOpen(true);
    const url = new URL(window.location.href);
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

  function selectQuantity(value: number) {
    if (!Number.isSafeInteger(value) || maxQuantity < 1) return;
    setQuantity(Math.min(maxQuantity, Math.max(1, value)));
    setMessage("");
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
    if (!fullName.trim() || !phone.trim() || !district.trim() || !upazila.trim() || !address.trim()) {
      setMessage("নাম, মোবাইল নম্বর, জেলা, উপজেলা ও সম্পূর্ণ ঠিকানা পূরণ করুন।");
      return;
    }
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
      setMessage("সঠিক মোবাইল নম্বর দিন। উদাহরণ: 01XXXXXXXXX");
      return;
    }
    directCheckoutInFlightRef.current = true;
    setLoading(true);
    setLoginRequired(false);
    setMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
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
      setMessage("অর্ডার সফল হয়েছে। " + (Number.isFinite(orderTotal) ? "মোট মূল্য ৳" + numberBN(orderTotal) + "।" : "অর্ডার নম্বরটি সংরক্ষণ করুন।"));
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। অর্ডারটি তৈরি হয়েছে কি না যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      directCheckoutInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className={"space-y-4 " + (cartAdded ? "pb-28" : "")}>
      <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black text-[#17351f]">পরিমাণ নির্বাচন করুন</h2>
          <span className="text-xs text-slate-500">সর্বোচ্চ {numberBN(maxQuantity)} {unitLabel} (প্রতি অর্ডার)</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="দ্রুত পরিমাণ নির্বাচন">
          {CHOICES.filter(value => value <= maxQuantity).map(value => (
            <button key={value} type="button" aria-pressed={quantity === value} disabled={unavailable || loading || addingToCart || Boolean(orderId)}
              onClick={() => selectQuantity(value)}
              className={"min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 " +
                (quantity === value ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400")}>
              {numberBN(value)} {unitLabel}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
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
            <p className="text-xs text-slate-500">৳{numberBN(unitPrice)} × {numberBN(quantity)} {unitLabel}</p>
          </div>
        </div>
      </div>

      <button type="button" disabled={unavailable || loading || Boolean(orderId)} onClick={() => { setFormOpen(true); setMessage(""); }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <ShoppingBag size={19} /> {unavailable ? "বর্তমানে অর্ডার করা যাবে না" : "এখনই অর্ডার করুন"}
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a href="tel:+8801717504028" aria-label={"ফোনে " + productName + " অর্ডার করুন: ০১৭১৭৫০৪০২৮"}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white transition hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">
          <Phone size={18} /> ফোনে অর্ডার করুন
        </a>
        <button type="button" disabled={unavailable || loading || addingToCart || Boolean(orderId)} onClick={() => void addToCart()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#17351f] bg-white px-4 py-3 text-sm font-black text-[#17351f] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          <ShoppingCart size={18} /> {addingToCart ? "যোগ হচ্ছে..." : "কার্টে যোগ করুন"}
        </button>
      </div>



      <div id="product-direct-cod" className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-[#fbfcf7]">
        <button type="button" aria-expanded={formOpen} aria-controls="direct-cod-form" onClick={() => setFormOpen(open => !open)}
          className="flex min-h-12 w-full items-center justify-between gap-2 px-4 py-4 text-left text-sm font-black text-[#17351f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:px-5">
          <span>সরাসরি ক্যাশ অন ডেলিভারি অর্ডার</span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-800">{formOpen ? "ফর্ম বন্ধ করুন" : "ফর্ম খুলুন"} <ChevronDown size={17} className={formOpen ? "rotate-180 transition-transform" : "transition-transform"} /></span>
        </button>
        {formOpen && (
          <form id="direct-cod-form" onSubmit={checkout} className="space-y-4 border-t border-emerald-950/10 px-4 py-5 sm:px-5">
            <p className="text-sm leading-6 text-slate-600">নির্বাচিত {numberBN(quantity)} {unitLabel} সরাসরি অর্ডার করুন। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। লগইন প্রয়োজন।</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#17351f]">আপনার নাম *
                <input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" maxLength={100} required placeholder="পূর্ণ নাম" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-bold text-[#17351f]">মোবাইল নম্বর *
                <input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" type="tel" inputMode="tel" maxLength={16} required placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">জেলা *
                <select value={district} onChange={e => { setDistrict(e.target.value); setUpazila(""); }} autoComplete="address-level1" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                  <option value="">জেলা বেছে নিন</option>
                  {BANGLADESH_DISTRICTS.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">উপজেলা / থানা *
                <select value={upazila} onChange={e => setUpazila(e.target.value)} autoComplete="address-level2" required disabled={!district} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100">
                  <option value="">{district ? "উপজেলা / থানা বেছে নিন" : "আগে জেলা নির্বাচন করুন"}</option>
                  {availableUpazilas.map((name, index) => <option key={district + "-" + index} value={name.trim()}>{name.trim()}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#17351f] sm:col-span-2">সম্পূর্ণ ঠিকানা *
                <textarea value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" maxLength={500} required rows={3} placeholder="গ্রাম/এলাকা, ইউনিয়ন/ওয়ার্ড, বাড়ি/রোড" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <span className="text-sm font-bold">নির্বাচিত পণ্যের মোট</span>
              <strong className="text-lg text-emerald-800">৳{numberBN(unitPrice * quantity)}</strong>
            </div>
            <p className="text-xs leading-5 text-slate-500">ডেলিভারি চার্জ ও স্টক অর্ডার নিশ্চিত করার সময় যাচাই হবে।</p>
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

      {cartAdded && (
        <aside role="region" aria-label="কার্টে যোগ করা পণ্যের চেকআউট"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 mx-auto max-w-2xl rounded-2xl border border-emerald-700/20 bg-white/95 p-3 shadow-[0_16px_50px_rgba(0,35,22,.23)] backdrop-blur-lg sm:inset-x-6 sm:bottom-5 sm:p-4">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <CheckCircle2 size={25} className="shrink-0 text-emerald-600" aria-hidden="true" />
            <p role="status" className="min-w-0 flex-1 text-sm font-bold text-emerald-950">পণ্য কার্টে যুক্ত হয়েছে।</p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Link href="/cart" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-900 px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50 sm:flex-none">কার্ট দেখুন</Link>
              <Link href="/checkout" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 sm:flex-none">চেকআউট করুন</Link>
            </div>
            <button type="button" onClick={() => setCartAdded(false)} aria-label="কার্ট বার বন্ধ করুন" className="absolute right-2 top-1 rounded-full p-1 text-slate-500 hover:bg-slate-100 sm:-right-2 sm:-top-2 sm:bg-white sm:shadow-sm"><X size={14} /></button>
          </div>
        </aside>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CART_UPDATED_EVENT } from "@/components/site/HeaderCartLink";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

type Item = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  name: string;
  slug: string | null;
  image_url: string | null;
  unit: string | null;
  stock: number;
  available: boolean;
};
type Address = {
  name: string; phone: string; district: string; upazila: string;
  fullAddress: string;
};

const UNIT_LABELS: Record<string, string> = {
  kg: "কেজি", g: "গ্রাম", piece: "পিস", pack: "প্যাকেট",
  liter: "লিটার", bag: "বস্তা",
};
const money = (value: number) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value);

const initialAddress: Address = {
  name: "", phone: "", district: "", upazila: "",
  fullAddress: "",
};

function normalizeBangladeshPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, "");
  let digits = compact.replace(/^\+/, "");
  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (/^8801[3-9]\d{8}$/.test(digits)) return "+" + digits;
  if (/^01[3-9]\d{8}$/.test(digits)) return "+88" + digits;
  if (/^1[3-9]\d{8}$/.test(digits)) return "+880" + digits;
  return null;
}

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Address>(initialAddress);
  const [busy, setBusy] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const idempotencyKeyRef = useRef<string>("");

  const selectedDistrict = BANGLADESH_DISTRICTS.find(item => item.name === form.district);
  const availableUpazilas = selectedDistrict?.upazilas ?? [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0), [items]);
  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const invalidCart = items.some(item =>
    !item.available || !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
    item.quantity > Math.min(item.stock, 100) || !Number.isFinite(item.unit_price) || item.unit_price < 0
  );
  const checkoutDisabled = busy || Boolean(busyItem) || !codEnabled || invalidCart || !items.length;

  const loadCart = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setItems([]);
        setNeedsLogin(true);
        setMessage("কার্ট দেখতে ও অর্ডার করতে লগইন করুন।");
        return;
      }
      setNeedsLogin(false);
      setIsGuest(Boolean(user.is_anonymous));

      const [{ data: settings, error: settingsError }, { data: cart, error: cartError }] = await Promise.all([
        supabase.rpc("get_public_site_settings"),
        supabase.from("carts").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      if (settingsError || cartError) throw new Error("Checkout তথ্য লোড করা যাচ্ছে না। আবার চেষ্টা করুন।");
      const codSetting = (settings || []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
      setCodEnabled(codSetting?.value === "true");

      if (!cart) {
        setItems([]);
        setMessage("আপনার কার্ট খালি।");
        return;
      }
      const { data: rows, error: rowsError } = await supabase
        .from("cart_items").select("id,product_id,quantity,unit_price").eq("cart_id", cart.id);
      if (rowsError) throw new Error("কার্টের পণ্য লোড করা যায়নি।");

      const ids = (rows || []).map(row => row.product_id);
      const { data: products, error: productsError } = ids.length
        ? await supabase.from("products").select("id,name,slug,image_url,unit,price,stock,status").in("id", ids)
        : { data: [], error: null };
      if (productsError) throw new Error("পণ্যের বর্তমান মূল্য ও স্টক যাচাই করা যায়নি।");

      const productMap = new Map((products || []).map(product => [product.id, product]));
      setItems((rows || []).map(row => {
        const product = productMap.get(row.product_id);
        const stock = Math.max(0, Math.floor(Number(product?.stock || 0)));
        return {
          id: row.id,
          product_id: row.product_id,
          quantity: Number(row.quantity),
          unit_price: Number(product?.price ?? row.unit_price),
          name: product?.name || "পণ্যটি এখন পাওয়া যাচ্ছে না",
          slug: product?.slug || null,
          image_url: product?.image_url || null,
          unit: product?.unit || null,
          stock,
          available: Boolean(product && product.status === "active" && stock > 0),
        };
      }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout লোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCart(); }, [loadCart]);

  function setField<K extends keyof Address>(key: K, value: Address[K]) {
    setForm(previous => ({
      ...previous, [key]: value,
      ...(key === "district" ? { upazila: "" } : {}),
    }));
  }

  async function changeQuantity(item: Item, quantity: number) {
    if (busyItem || busy || confirmed || !item.available) return;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > Math.min(item.stock, 100)) {
      setMessage("পরিমাণ ১ থেকে পণ্যের বর্তমান স্টক ও সর্বোচ্চ ১০০টির মধ্যে রাখুন।");
      return;
    }
    setBusyItem(item.id);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("cart_items")
        .update({ quantity, unit_price: item.unit_price }).eq("id", item.id);
      if (error) throw error;
      idempotencyKeyRef.current = "";
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      await loadCart(true);
    } catch {
      setMessage("পণ্যের পরিমাণ বদলানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusyItem(null);
    }
  }

  async function remove(item: Item) {
    if (busyItem || busy || confirmed) return;
    setBusyItem(item.id);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("cart_items").delete().eq("id", item.id);
      if (error) throw error;
      idempotencyKeyRef.current = "";
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      await loadCart(true);
    } catch {
      setMessage("কার্ট থেকে পণ্য সরানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusyItem(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checkoutDisabled || confirmed) return;
    if (form.fullAddress.trim().length < 8) {
      setMessage("সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (কমপক্ষে ৮ অক্ষর)।");
      return;
    }
    const normalizedPhone = normalizeBangladeshPhone(form.phone);
    if (!normalizedPhone) {
      setMessage("বাংলাদেশের সঠিক মোবাইল নম্বর দিন: 01XXXXXXXXX অথবা +8801XXXXXXXXX।");
      return;
    }
    setBusy(true);
    setMessage("");
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    try {
      const address = {
        fullName: form.name.trim(),
        phone: normalizedPhone,
        district: form.district.trim(),
        upazila: form.upazila.trim(),
        fullAddress: form.fullAddress.trim(),
        // Existing API normalizes the single full address into required RPC fields.
      };
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress: address, idempotencyKey: idempotencyKeyRef.current }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setConfirmed(true);
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      setOrderId(String(result.orderId ?? ""));
      setItems([]);
      const billedTotal = Number(result.total);
      setMessage(Number.isFinite(billedTotal)
        ? "অর্ডার নিশ্চিত হয়েছে। চূড়ান্ত মোট ৳" + money(billedTotal) + "।"
        : "অর্ডার নিশ্চিত হয়েছে। বিস্তারিত আমার অর্ডার পেজে দেখুন।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8" role="status">চেকআউট লোড হচ্ছে…</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-7 text-[#17351f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA CHECKOUT · বাংলাদেশ</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">ডেলিভারি ঠিকানা ও অর্ডার</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">আপনার অর্ডারের পণ্য যাচাই করুন এবং সহজেই ডেলিভারি তথ্য দিন।</p>

        {message && (
          <div role="status" aria-live="polite" className={"mt-5 rounded-xl border px-4 py-3 text-sm font-semibold " +
            (confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
            {message}
            {confirmed && orderId && <p className="mt-2 break-all text-xs">Checkout reference: {orderId}</p>}
            {needsLogin && <Link href="/login?next=%2Fcheckout" className="ml-2 underline underline-offset-2">লগইন করুন</Link>}
          </div>
        )}
        {confirmed && <Link href="/orders" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white">আমার অর্ডার দেখুন</Link>}
        {!items.length && !confirmed && <Link href="/cart" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-900 px-5 py-3 font-bold text-emerald-900"><ArrowLeft size={17} /> কার্টে ফিরে যান</Link>}

        {!confirmed && items.length > 0 && (
          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(350px,0.82fr)] lg:gap-7">
            <form id="agriva-checkout-form" onSubmit={submit} className="order-2 space-y-5 rounded-3xl border border-emerald-950/10 bg-white p-4 shadow-sm sm:p-7 lg:order-1">
              <section aria-labelledby="customer-info-heading">
                <h2 id="customer-info-heading" className="text-lg font-black">১. গ্রাহকের তথ্য</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="প্রাপকের সম্পূর্ণ নাম *" value={form.name} onChange={value => setField("name", value)} autoComplete="name" />
                  <Field label="মোবাইল নম্বর *" value={form.phone} onChange={value => setField("phone", value)} placeholder="01XXXXXXXXX" type="tel" autoComplete="tel" />
                </div>
                {isGuest && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">Guest Checkout: SMS OTP ছাড়াই অর্ডার করতে পারবেন। সচল মোবাইল নম্বর দিন।</p>}
              </section>

              <section aria-labelledby="delivery-address-heading" className="border-t border-slate-100 pt-5">
                <h2 id="delivery-address-heading" className="text-lg font-black">২. বাংলাদেশের ডেলিভারি ঠিকানা</h2>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold">জেলা *</span>
                      <select value={form.district} onChange={event => setField("district", event.target.value)} autoComplete="address-level2" required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15">
                        <option value="">জেলা বেছে নিন</option>
                        {BANGLADESH_DISTRICTS.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold">উপজেলা / থানা *</span>
                      <select value={form.upazila} onChange={event => setField("upazila", event.target.value)} autoComplete="address-level3" required disabled={!form.district} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-slate-100">
                        <option value="">{form.district ? "উপজেলা / থানা বেছে নিন" : "আগে জেলা নির্বাচন করুন"}</option>
                        {availableUpazilas.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-bold">সম্পূর্ণ ডেলিভারি ঠিকানা *</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">এলাকা, গ্রাম/রোড, বাড়ি বা হোল্ডিং নম্বর একসঙ্গে লিখুন।</span>
                    <textarea value={form.fullAddress} onChange={event => setField("fullAddress", event.target.value)}
                      autoComplete="street-address" maxLength={250} minLength={8} required rows={3}
                      className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                      placeholder="যেমন: বাড়ি ১২, পূর্বপাড়া, ৩ নং ওয়ার্ড, বাজার রোড" />
                  </label>
                </div>
              </section>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <b className="text-sm">ক্যাশ অন ডেলিভারি (COD)</b>
                <p className="mt-1 text-xs leading-6 text-slate-600">{codEnabled
                  ? "অর্ডার নিশ্চিত হলে পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।"
                  : "Cash on Delivery বর্তমানে বন্ধ আছে। সাপোর্টের সঙ্গে যোগাযোগ করুন।"}</p>
              </div>
              <button type="submit" disabled={checkoutDisabled}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 lg:hidden">
                <CheckCircle2 size={18} /> {busy ? "অর্ডার নিশ্চিত হচ্ছে…" : "COD অর্ডার নিশ্চিত করুন"}
              </button>
              <p className="text-xs leading-5 text-slate-500">অর্ডার নিশ্চিত করার সময় সার্ভার থেকে মূল্য ও স্টক আবার যাচাই করা হবে।</p>
            </form>

            <aside className="order-1 min-w-0 space-y-4 lg:sticky lg:top-5 lg:order-2" aria-label="অর্ডারের সারাংশ ও চেকআউট">
              <div className="rounded-3xl border border-emerald-950/10 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-lg font-black">অর্ডার আইটেম ({money(items.length)} ধরনের পণ্য)</h2>
                <p className="mt-1 text-xs text-slate-500">মোট {money(totalUnits)}টি একক</p>

                <div className="mt-4 max-h-[52vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[46vh]">
                  {items.map(item => {
                    const unit = item.unit ? UNIT_LABELS[item.unit] || item.unit : "টি";
                    const detailLink = item.slug ? "/marketplace/" + item.slug : "/marketplace";
                    return (
                      <article key={item.id} className="relative rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start gap-3">
                          <Link href={detailLink} aria-label={item.name + " পণ্য দেখুন"}
                            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 sm:h-[72px] sm:w-[72px]">
                            {item.image_url
                              ? <Image src={item.image_url} alt={item.name} fill unoptimized sizes="72px" className="object-contain p-1" />
                              : <span className="text-2xl" aria-hidden="true">🌱</span>}
                          </Link>
                          <div className="min-w-0 flex-1 pr-6">
                            <Link href={detailLink} className="line-clamp-2 text-sm font-black leading-5 text-slate-900 hover:text-emerald-800">{item.name}</Link>
                            <p className="mt-1 text-[11px] text-slate-500">প্রতি {unit}: ৳{money(item.unit_price)}</p>
                            {!item.available && <p className="mt-1 text-xs font-semibold text-red-700">স্টক নেই বা পণ্য অনুপলব্ধ</p>}
                          </div>
                          <button type="button" onClick={() => void remove(item)} disabled={busy || Boolean(busyItem)}
                            aria-label={item.name + " কার্ট থেকে সরান"}
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40">
                            <Trash2 size={17} />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:pl-[84px]">
                          <div className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-slate-200">
                            <button type="button" onClick={() => void changeQuantity(item, item.quantity - 1)}
                              disabled={busy || Boolean(busyItem) || !item.available || item.quantity <= 1}
                              aria-label={item.name + " পরিমাণ কমান"} className="grid h-9 w-9 place-items-center bg-slate-50 hover:bg-emerald-50 disabled:opacity-40"><Minus size={15} /></button>
                            <output aria-live="polite" className="min-w-9 px-2 text-center text-sm font-extrabold">{money(item.quantity)}</output>
                            <button type="button" onClick={() => void changeQuantity(item, item.quantity + 1)}
                              disabled={busy || Boolean(busyItem) || !item.available || item.quantity >= Math.min(item.stock, 100)}
                              aria-label={item.name + " পরিমাণ বাড়ান"} className="grid h-9 w-9 place-items-center bg-slate-50 hover:bg-emerald-50 disabled:opacity-40"><Plus size={15} /></button>
                          </div>
                          <p className="text-base font-black tabular-nums text-emerald-900">৳{money(item.unit_price * item.quantity)}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-600">পণ্যের মোট</span><strong className="tabular-nums">৳{money(subtotal)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-slate-500">
                    <span>ডিসকাউন্ট</span><span className="text-xs">প্রযোজ্য নয়</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-slate-500">
                    <span>ডেলিভারি চার্জ</span><span className="text-xs">অর্ডারে যাচাই হবে</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <strong className="text-base">পণ্যের মোট (ডেলিভারি ছাড়া)</strong>
                    <strong className="text-xl font-black tabular-nums text-emerald-800">৳{money(subtotal)}</strong>
                  </div>
                </div>
                {invalidCart && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">স্টক বা পরিমাণের সমস্যা আছে। অর্ডার করার আগে কার্ট ঠিক করুন।</p>}
                <button type="submit" form="agriva-checkout-form" disabled={checkoutDisabled}
                  className="mt-5 hidden min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 lg:flex">
                  <ShoppingBag size={18} /> {busy ? "অর্ডার নিশ্চিত হচ্ছে…" : "COD অর্ডার নিশ্চিত করুন"}
                </button>
                <Link href="/cart" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-900/30 px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50">
                  <ArrowLeft size={16} /> কার্টে ফিরে যান
                </Link>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                <Truck size={15} className="mr-2 inline-block align-text-bottom" /> চূড়ান্ত মূল্য ও প্রযোজ্য চার্জ অর্ডার নিশ্চিত হওয়ার সময় সার্ভার থেকে নির্ধারিত হবে।
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete, required }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; autoComplete?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete}
        required={required ?? true} maxLength={200}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" />
    </label>
  );
}

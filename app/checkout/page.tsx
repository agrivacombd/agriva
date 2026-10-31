"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

type Item = { product_id: string; quantity: number; unit_price: number; name: string };
type Address = {
  name: string; phone: string; division: string; district: string; upazila: string;
  unionOrArea: string; villageRoadHouse: string; landmark: string; postalCode: string; deliveryInstructions: string;
};

const initialAddress: Address = {
  name: "", phone: "", division: "", district: "", upazila: "",
  unionOrArea: "", villageRoadHouse: "", landmark: "", postalCode: "", deliveryInstructions: "",
};

function normalizeBangladeshPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, "");
  let digits = compact.replace(/^\+/, "");
  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (digits.startsWith("8801") && /^8801[3-9]\d{8}$/.test(digits)) return `+ ${digits}`.replace(" ", "");
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  if (/^1[3-9]\d{8}$/.test(digits)) return `+880${digits}`;
  return null;
}

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Address>(initialAddress);
  const selectedDistrict = BANGLADESH_DISTRICTS.find(item => item.name === form.district);
  const availableUpazilas = selectedDistrict?.upazilas ?? [];
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const idempotencyKeyRef = useRef<string>("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0), [items]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setMessage("Guest Cart সেশন পাওয়া যায়নি। কার্টে ফিরে আবার পণ্য যোগ করুন।");
        setLoading(false);
        return;
      }
      setIsGuest(Boolean(user.is_anonymous));
      setPhoneVerified(Boolean(!user.is_anonymous && user.phone_confirmed_at));
      const [{ data: settings }, { data: cart }] = await Promise.all([
        supabase.rpc("get_public_site_settings"),
        supabase.from("carts").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      if (!active) return;
      const codSetting = (settings || []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
      setCodEnabled(codSetting?.value === "true");
      if (!cart) {
        setMessage("আপনার কার্ট খালি।");
        setLoading(false);
        return;
      }
      const { data: rows, error } = await supabase.from("cart_items").select("product_id,quantity,unit_price").eq("cart_id", cart.id);
      if (!active) return;
      if (error) {
        setMessage("কার্ট লোড করা যায়নি। আবার চেষ্টা করুন।");
        setLoading(false);
        return;
      }
      const ids = (rows || []).map(row => row.product_id);
      const { data: products } = ids.length
        ? await supabase.from("products").select("id,name,price,stock,status").in("id", ids)
        : { data: [] };
      if (!active) return;
      const productMap = new Map((products || []).map(product => [product.id, product]));
      setItems((rows || []).map(row => {
        const product = productMap.get(row.product_id);
        return { ...row, unit_price: Number(product?.price ?? row.unit_price), name: product?.name || "পণ্য" };
      }));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  async function sendPhoneOtp() {
    const phone = normalizeBangladeshPhone(form.phone);
    if (!phone) { setMessage("সঠিক বাংলাদেশি মোবাইল নম্বর দিন।"); return; }
    setOtpBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ phone });
      if (error) throw error;
      setOtpSent(true);
      setPhoneVerified(false);
      setMessage("আপনার নম্বরে OTP পাঠানো হয়েছে। SMS থেকে কোডটি লিখুন।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP পাঠানো যায়নি।");
    } finally { setOtpBusy(false); }
  }

  async function verifyPhoneOtp() {
    const phone = normalizeBangladeshPhone(form.phone);
    if (!phone || !/^\\d{6}$/.test(otp.trim())) {
      setMessage("SMS-এ পাওয়া ৬ সংখ্যার OTP লিখুন।"); return;
    }
    setOtpBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: "phone_change" });
      if (error || !data.user?.phone_confirmed_at || data.user.phone !== phone) {
        throw error || new Error("মোবাইল নম্বর যাচাই সম্পন্ন হয়নি।");
      }
      setPhoneVerified(true);
      setMessage("মোবাইল নম্বর সফলভাবে যাচাই হয়েছে।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP যাচাই করা যায়নি।");
    } finally { setOtpBusy(false); }
  }

  function setField<K extends keyof Address>(key: K, value: Address[K]) {
    setForm(previous => ({ ...previous, [key]: value, ...(key === "district" ? { upazila: "" } : {}) }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || busy || confirmed) return;
    if (isGuest && !phoneVerified) {
      setMessage("Guest Checkout-এর জন্য আগে মোবাইল OTP যাচাই করুন।");
      return;
    }
    if (!codEnabled) {
      setMessage("Cash on Delivery বন্ধ আছে। সাপোর্টের সঙ্গে যোগাযোগ করুন।");
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
        division: form.division.trim(),
        district: form.district.trim(),
        upazila: form.upazila.trim(),
        unionOrArea: form.unionOrArea.trim(),
        villageRoadHouse: form.villageRoadHouse.trim(),
        landmark: form.landmark.trim(),
        postalCode: form.postalCode.trim(),
        deliveryInstructions: form.deliveryInstructions.trim(),
        // Keep a backward-compatible printable address for older order views.
        address: [form.upazila, form.unionOrArea, form.villageRoadHouse].map(value => value.trim()).filter(Boolean).join(", "),
      };
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress: address, idempotencyKey: idempotencyKeyRef.current }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setConfirmed(true);
      setOrderId(String(result.orderId ?? ""));
      setItems([]);
      setMessage(`অর্ডার নিশ্চিত হয়েছে। মোট ${Number(result.total).toLocaleString("bn-BD", { style: "currency", currency: "BDT" })}।`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7f2] px-4 py-10"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8">চেকআউট লোড হচ্ছে…</div></main>;

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Checkout · বাংলাদেশ</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">ডেলিভারি ঠিকানা ও অর্ডার</h1>
      {items.length > 0 && <section className="mt-6 rounded-2xl bg-white p-5">
        <h2 className="font-bold">অর্ডার সারাংশ · {items.length} ধরনের পণ্য</h2>
        {items.map(item => <p key={item.product_id} className="mt-2 flex justify-between gap-3 text-sm text-[#647468]"><span>{item.name} × {item.quantity}</span><span className="shrink-0">৳{(item.unit_price * item.quantity).toLocaleString("bn-BD")}</span></p>)}
        <p className="mt-4 border-t pt-3 text-lg font-black">পণ্যের মোট: ৳{subtotal.toLocaleString("bn-BD", { maximumFractionDigits: 2 })}</p>
        <p className="mt-1 text-xs text-[#647468]">ডেলিভারি চার্জ থাকলে নিশ্চিত করার আগে দেখানো হবে। বর্তমান checkout-এ চার্জ ০ টাকা হিসেবে গণনা করা হয়।</p>
      </section>}
      {message && <div role="status" aria-live="polite" className="mt-6 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{message}{confirmed && orderId && <p className="mt-2 break-all">Checkout reference: {orderId}</p>}</div>}
      {confirmed && <Link href="/orders" className="mt-5 inline-flex rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white">আমার অর্ডার দেখুন</Link>}
      {!confirmed && items.length > 0 && <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">১. গ্রাহকের তথ্য</h2>
        <Field label="প্রাপকের সম্পূর্ণ নাম *" value={form.name} onChange={v => setField("name", v)} autoComplete="name" />
        <Field label="মোবাইল নম্বর *" value={form.phone} onChange={v => { setField("phone", v); setPhoneVerified(false); setOtpSent(false); setOtp(""); }} placeholder="01XXXXXXXXX" type="tel" autoComplete="tel" />
        {isGuest && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold">Guest Checkout: ফোন যাচাই বাধ্যতামূলক</p>
          {!phoneVerified ? <>
            <button type="button" onClick={() => void sendPhoneOtp()} disabled={otpBusy} className="mt-3 rounded-lg bg-[#17351f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{otpBusy ? "অপেক্ষা করুন…" : otpSent ? "আবার OTP পাঠান" : "SMS OTP পাঠান"}</button>
            {otpSent && <div className="mt-3 flex flex-wrap gap-2">
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="৬ সংখ্যার OTP" maxLength={6} className="min-w-0 flex-1 rounded-lg border px-3 py-2" />
              <button type="button" onClick={() => void verifyPhoneOtp()} disabled={otpBusy || otp.length !== 6} className="rounded-lg border border-[#17351f] px-4 py-2 text-sm font-bold disabled:opacity-50">যাচাই করুন</button>
            </div>}
          </> : <p className="mt-2 text-sm font-bold text-emerald-800">ফোন নম্বর যাচাই সম্পন্ন ✓</p>}
        </div>}
        <h2 className="pt-3 text-lg font-black">২. বাংলাদেশের ডেলিভারি ঠিকানা</h2>
        <Field label="বিভাগ *" value={form.division} onChange={v => setField("division", v)} placeholder="যেমন: রাজশাহী" autoComplete="address-level1" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm font-bold">জেলা *</span><select value={form.district} onChange={event => setField("district", event.target.value)} autoComplete="address-level2" required className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"><option value="">জেলা বেছে নিন</option>{BANGLADESH_DISTRICTS.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
          <label className="block"><span className="text-sm font-bold">উপজেলা / থানা *</span><select value={form.upazila} onChange={event => setField("upazila", event.target.value)} autoComplete="address-level3" required disabled={!form.district} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{form.district ? "উপজেলা / থানা বেছে নিন" : "আগে জেলা নির্বাচন করুন"}</option>{availableUpazilas.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        </div>
        <Field label="ইউনিয়ন / এলাকা / ওয়ার্ড *" value={form.unionOrArea} onChange={v => setField("unionOrArea", v)} />
        <Field label="গ্রাম / রোড / বাড়ি / হোল্ডিং নম্বর *" value={form.villageRoadHouse} onChange={v => setField("villageRoadHouse", v)} autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="নিকটস্থ পরিচিত স্থান (ঐচ্ছিক)" value={form.landmark} onChange={v => setField("landmark", v)} required={false} />
          <Field label="পোস্ট কোড (ঐচ্ছিক)" value={form.postalCode} onChange={v => setField("postalCode", v)} required={false} />
        </div>
        <label className="block"><span className="text-sm font-bold">ডেলিভারির অতিরিক্ত নির্দেশনা (ঐচ্ছিক)</span><textarea value={form.deliveryInstructions} onChange={event => setField("deliveryInstructions", event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" placeholder="কখন ফোন করবেন, কীভাবে আসবেন ইত্যাদি" /></label>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <b>ক্যাশ অন ডেলিভারি (COD)</b>
          <p className="mt-1 text-sm text-[#647468]">{codEnabled ? "পণ্য হাতে পেয়ে ডেলিভারি কর্মীকে টাকা দিন। অনলাইন পেমেন্ট এই মুহূর্তে চালু নেই।" : "সাইট অ্যাডমিন বর্তমানে Cash on Delivery বন্ধ রেখেছেন।"}</p>
        </div>
        <button type="submit" disabled={busy || !codEnabled} className="w-full rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">
          {busy ? "অর্ডার নিশ্চিত হচ্ছে…" : isGuest && !phoneVerified ? "আগে ফোন যাচাই করুন" : "COD অর্ডার নিশ্চিত করুন"}
        </button>
        <p className="text-xs leading-5 text-[#748074]">অর্ডার নিশ্চিত করলে স্টক ও মূল্য সার্ভার থেকে আবার যাচাই করা হবে। ভুল ঠিকানা থাকলে অর্ডার বাতিলের জন্য সাপোর্টে যোগাযোগ করুন।</p>
      </form>}
      {!items.length && !confirmed && <Link href="/cart" className="mt-5 inline-flex rounded-xl border border-[#17351f] px-5 py-3 font-bold">কার্টে ফিরে যান</Link>}
    </div>
  </main>;
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete, required }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; autoComplete?: string; required?: boolean;
}) {
  return <label className="block">
    <span className="text-sm font-bold">{label}</span>
    <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} required={required ?? true} maxLength={200} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" />
  </label>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-locations";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const selectedDistrict = BANGLADESH_DISTRICTS.find(item => item.name === district);
  const availableUpazilas = selectedDistrict?.upazilas ?? [];
  const [address, setAddress] = useState("");

  async function addToCart() {
    if (disabled || addingToCart) return;
    setAddingToCart(true);
    setLoginRequired(false);
    setMessage("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setLoginRequired(true);
        setMessage("কার্টে পণ্য যোগ করতে আগে লগইন করুন।");
        return;
      }

      const { error: addError } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: productId,
        p_quantity: 1,
      });
      if (addError) {
        const message = addError.message || "";
        setMessage(/Insufficient stock|Product unavailable/i.test(message)
          ? "পণ্যটির স্টক শেষ বা পরিবর্তিত হয়েছে।"
          : "কার্টে পণ্য যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }

      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT",
        item_id: productId,
        quantity: 1,
      });
      router.push("/cart");
    } catch (error) {
      console.error("Add to cart failed:", error);
      setMessage("কার্টে পণ্য যোগ করা যায়নি। লগইন ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      setAddingToCart(false);
    }
  }

  async function checkout() {
    if (!fullName.trim() || !phone.trim() || !district.trim() || !upazila.trim() || !address.trim()) {
      setMessage("অর্ডার করতে নাম, মোবাইল নম্বর, জেলা, উপজেলা ও সম্পূর্ণ ঠিকানা পূরণ করুন।");
      return;
    }
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
      setMessage("সঠিক মোবাইল নম্বর দিন। উদাহরণ: 01XXXXXXXXX");
      return;
    }

    setLoading(true);
    setMessage("");
    setOrderId("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
          shippingAddress: { fullName: fullName.trim(), phone: phone.trim(), district: district.trim(), upazila: upazila.trim(), address: address.trim() },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error || "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      else {
        setOrderId(String(data.orderId || ""));
        const orderTotal = Number(data.total);
        trackAnalyticsEvent("marketplace_order_placed", {
          currency: "BDT",
          ...(Number.isFinite(orderTotal) ? { value: orderTotal } : {}),
          item_id: productId,
          quantity: 1,
        });
        setMessage(`অর্ডার তৈরি হয়েছে। মোট মূল্য ৳${Number(data.total).toLocaleString("bn-BD")}।`);
      }
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        disabled={disabled || addingToCart}
        onClick={addToCart}
        className="w-full rounded-2xl border-2 border-[#17351f] bg-white px-6 py-4 font-black text-[#17351f] transition hover:bg-[#eef5ed] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addingToCart ? "কার্টে যোগ হচ্ছে..." : disabled ? "স্টকে নেই" : "কার্টে যোগ করুন"}
      </button>
      <p className="text-center text-xs text-slate-500">কার্টে পণ্য যোগ করে পরিমাণ যাচাই করে Checkout সম্পন্ন করুন।</p>
      <details className="group rounded-2xl border border-emerald-950/10 bg-[#fbfcf7] p-4 sm:p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-[#17351f] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><span>সরাসরি ক্যাশ অন ডেলিভারি অর্ডার</span><span className="text-sm font-bold text-emerald-800 group-open:hidden">ফর্ম খুলুন +</span><span className="hidden text-sm font-bold text-emerald-800 group-open:inline">বন্ধ করুন −</span></summary>
        <p className="mt-2 text-sm text-slate-600">কার্ট ব্যবহার না করে চাইলে এই পণ্যটি সরাসরি অর্ডার করতে পারবেন। পেমেন্ট: পণ্য হাতে পেয়ে।</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#17351f]">আপনার নাম
            <input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" maxLength={100} required placeholder="পূর্ণ নাম" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f]">মোবাইল নম্বর
            <input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" type="tel" inputMode="tel" maxLength={16} required placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">জেলা নির্বাচন করুন
            <select value={district} onChange={e => { setDistrict(e.target.value); setUpazila(""); }} autoComplete="address-level1" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
              <option value="">জেলা বেছে নিন</option>
              {BANGLADESH_DISTRICTS.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">উপজেলা / থানা নির্বাচন করুন
            <select value={upazila} onChange={e => setUpazila(e.target.value)} autoComplete="address-level2" required disabled={!district} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100">
              <option value="">{district ? "উপজেলা / থানা বেছে নিন" : "আগে জেলা নির্বাচন করুন"}</option>
              {availableUpazilas.map((name, index) => <option key={district + "-" + index} value={name.trim()}>{name.trim()}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">সম্পূর্ণ ঠিকানা
            <textarea value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" maxLength={500} required rows={3} placeholder="গ্রাম/এলাকা + উপজেলা + বাড়ি/রোড (এক লাইনে লিখুন)" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
        </div>
        <button type="button" disabled={disabled || loading} onClick={checkout} className="mt-4 w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "অর্ডার তৈরি হচ্ছে..." : disabled ? "স্টকে নেই" : "ক্যাশ অন ডেলিভারিতে অর্ডার করুন"}
        </button>
      </details>
      {message && <p role="status" aria-live="polite" className="break-words rounded-xl bg-[#eef5ed] p-3 text-sm text-[#17351f]">{message}</p>}
      {loginRequired && <Link href="/login?next=%2Fcart" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">লগইন করে কার্টে ফিরুন</Link>}
      {orderId && <Link href="/orders" className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50">আমার অর্ডার দেখুন</Link>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  async function checkout() {
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
          shippingAddress: { fullName: fullName.trim(), phone: phone.trim(), district: district.trim(), address: address.trim() },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error || "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      else {
        setOrderId(String(data.orderId || ""));
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
      <div className="rounded-2xl border border-emerald-950/10 bg-[#fbfcf7] p-4 sm:p-5">
        <h2 className="text-lg font-black text-[#17351f]">ডেলিভারির তথ্য</h2>
        <p className="mt-1 text-sm text-slate-600">অর্ডার নিশ্চিত করতে আপনার ঠিকানা দিন। পেমেন্ট: ক্যাশ অন ডেলিভারি।</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#17351f]">আপনার নাম
            <input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" maxLength={100} required placeholder="পূর্ণ নাম" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f]">মোবাইল নম্বর
            <input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" maxLength={20} required placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">জেলা
            <input value={district} onChange={e => setDistrict(e.target.value)} autoComplete="address-level1" maxLength={80} required placeholder="আপনার জেলা" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">সম্পূর্ণ ঠিকানা
            <textarea value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" maxLength={500} required rows={3} placeholder="গ্রাম/এলাকা, উপজেলা, রাস্তা ও পরিচিত স্থান" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
        </div>
      </div>
      <button type="button" disabled={disabled || loading} onClick={checkout} className="w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "অর্ডার তৈরি হচ্ছে..." : disabled ? "স্টকে নেই" : "ক্যাশ অন ডেলিভারিতে অর্ডার করুন"}
      </button>
      {message && <p role="status" aria-live="polite" className="break-words rounded-xl bg-[#eef5ed] p-3 text-sm text-[#17351f]">{message}</p>}
      {orderId && <Link href="/orders" className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50">আমার অর্ডার দেখুন</Link>}
    </div>
  );
}

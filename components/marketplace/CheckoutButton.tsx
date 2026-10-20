"use client";

import { useState } from "react";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function checkout() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error || "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      else setMessage(`অর্ডার তৈরি হয়েছে: ${data.orderId}। মোট মূল্য ৳${Number(data.total).toLocaleString("bn-BD")}।`);
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }
  return <div className="mt-8"><button type="button" disabled={disabled || loading} onClick={checkout} className="w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "অর্ডার তৈরি হচ্ছে..." : disabled ? "স্টকে নেই" : "এখনই কিনুন"}</button>{message && <p role="status" aria-live="polite" className="mt-3 break-words text-sm text-[#647468]">{message}</p>}</div>;
}

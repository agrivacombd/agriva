"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";

export default function PlantMarketAddToCart({
  productId, stock = 0, disabled = false,
}: {
  productId: string;
  stock?: number;
  disabled?: boolean;
}) {
  const available = Math.max(0, Math.floor(Number(stock) || 0));
  const [quantity,setQuantity] = useState(1);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [needsLogin,setNeedsLogin] = useState(false);
  const router = useRouter();

  async function add(buyNow = false) {
    if (busy || disabled || available < 1) return;
    setBusy(true);setMessage("");setNeedsLogin(false);
    try {
      if (buyNow) {
        const current = await fetch("/api/plant-market/cart", {cache:"no-store"});
        const existing = await current.json().catch(()=>({}));
        if (current.status === 401) {setNeedsLogin(true);setMessage("লগইন করে অর্ডার করুন।");return;}
        if (!current.ok) {setMessage("কার্ট যাচাই করা যাচ্ছে না।");return;}
        if ((existing.items||[]).some((item:{product_id:string})=>item.product_id!==productId)) {setMessage("কার্টে অন্য পণ্য রয়েছে। শুধু এই পণ্য কিনতে অন্য পণ্য সরান অথবা Cart থেকে সব পণ্য একসঙ্গে অর্ডার করুন।");return;}
      }
      const response = await fetch("/api/plant-market/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setNeedsLogin(true);setMessage("কার্ট ও Checkout ব্যবহার করতে লগইন করুন।");return;
      }
      if (!response.ok) {
        setMessage(typeof data.error === "string" ? data.error : "স্টক যাচাই করে আবার চেষ্টা করুন।");return;
      }
      if (buyNow) {
        // Checkout verifies the selected product and rejects unrelated cart items.
        router.push("/plant-market/checkout?buyNowProductId="+encodeURIComponent(productId));
      } else {
        setMessage(`${quantity}টি পণ্য Plant Market কার্টে যোগ হয়েছে।`);
        router.refresh();
      }
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {setBusy(false);}
  }

  return <section className="mt-6 space-y-3" aria-label="পণ্য কেনার অপশন">
    {available > 0 && !disabled && <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-700">পরিমাণ</span>
      <div className="flex items-center overflow-hidden rounded-xl border border-emerald-200" role="group" aria-label="পণ্যের পরিমাণ">
        <button type="button" aria-label="একটি কমান" disabled={busy || quantity <= 1} onClick={()=>setQuantity(v=>Math.max(1,v-1))} className="grid h-11 w-11 place-items-center disabled:opacity-40"><Minus size={17}/></button>
        <output aria-live="polite" className="min-w-12 text-center font-extrabold">{quantity}</output>
        <button type="button" aria-label="একটি বাড়ান" disabled={busy || quantity >= Math.min(available,100)} onClick={()=>setQuantity(v=>Math.min(available,100,v+1))} className="grid h-11 w-11 place-items-center disabled:opacity-40"><Plus size={17}/></button>
      </div>
      <span className="text-xs text-slate-500">সর্বোচ্চ {Math.min(available,100)}টি</span>
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={()=>void add(false)} disabled={busy || disabled || !available} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-emerald-900 px-5 py-3 font-extrabold text-emerald-950 transition hover:bg-emerald-50 disabled:opacity-50">
        <ShoppingCart size={18}/>{disabled || !available ? "স্টক শেষ" : busy ? "যোগ হচ্ছে…" : "Add to Cart"}
      </button>
      <button type="button" onClick={()=>void add(true)} disabled={busy || disabled || !available} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-50">
        <Zap size={18}/>{disabled || !available ? "স্টক শেষ" : busy ? "প্রসেস হচ্ছে…" : "Buy Now"}
      </button>
    </div>
    <p className="text-xs leading-5 text-slate-500">Buy Now চাপলে পণ্য কার্টে যোগ হয়ে Checkout খুলবে। কার্টে আগে অন্য পণ্য থাকলে সেগুলোও Order Summary-তে থাকবে—নিশ্চিত করার আগে দেখে নিন।</p>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link href="/plant-market/cart" className="text-sm font-bold text-emerald-800 underline underline-offset-4">কার্ট দেখুন</Link>
      <span className="text-xs text-slate-500">Cash on Delivery · স্টক যাচাই সাপেক্ষে</span>
    </div>
    {message && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
      <span>{message}</span>
      {needsLogin && <Link href={"/login?next=" + encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/plant-market")} className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white">লগইন করুন</Link>}
    </div>}
  </section>;
}

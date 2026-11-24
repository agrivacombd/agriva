"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";

export default function PlantMarketAddToCart({
  productId, stock = 0, disabled = false, price = 0,
}: {
  productId: string;
  stock?: number;
  disabled?: boolean;
  price?: number;
}) {
  const available = Math.max(0, Math.floor(Number(stock) || 0));
  const [quantity,setQuantity] = useState(1);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [needsLogin,setNeedsLogin] = useState(false);
  const [showSticky,setShowSticky] = useState(false);
  const purchaseRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = purchaseRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { rootMargin: "-96px 0px 0px 0px", threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const router = useRouter();

  async function add(buyNow = false) {
    if (busy || disabled || available < 1) return;
    setBusy(true);setMessage("");setNeedsLogin(false);
    try {
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
        // Checkout deliberately shows the full existing cart and its total.
        router.push("/plant-market/checkout");
      } else {
        setMessage(`${quantity}টি পণ্য Plant Market কার্টে যোগ হয়েছে।`);
        router.refresh();
      }
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {setBusy(false);}
  }

  return <section ref={purchaseRef} className="mt-6 space-y-3" aria-label="পণ্য কেনার অপশন">
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
    {showSticky && available > 0 && !disabled && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,45,30,0.12)] backdrop-blur sm:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-500">বর্তমান মূল্য</p><p className="truncate text-lg font-black text-emerald-950">৳{Number(price).toLocaleString("bn-BD")}</p></div><button type="button" onClick={()=>void add(true)} disabled={busy} className="min-h-12 flex-1 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">{busy?"প্রসেস হচ্ছে…":"এখনই কিনুন"}</button></div></div>}
    {message && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
      <span>{message}</span>
      {needsLogin && <Link href={"/login?next=" + encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/plant-market")} className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white">লগইন করুন</Link>}
    </div>}
  </section>;
}

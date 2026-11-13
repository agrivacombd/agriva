"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  async function addToCart() {
    if (disabled || adding) return;
    setAdding(true);
    setMessage("");
    setLoginRequired(false);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setLoginRequired(true);
        setMessage("কার্টে পণ্য যোগ করতে আগে লগইন করুন।");
        return;
      }

      const { error } = await supabase.rpc("add_marketplace_cart_item", {
        p_product_id: productId,
        p_quantity: 1,
      });
      if (error) {
        setMessage(/Insufficient stock|Product unavailable/i.test(error.message || "")
          ? "পণ্যটির স্টক শেষ বা পরিবর্তিত হয়েছে।"
          : "কার্টে পণ্য যোগ করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }

      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT",
        item_id: productId,
        quantity: 1,
      });
      setAdded(true);
      setMessage("পণ্যটি আপনার কার্টে যোগ হয়েছে। চাইলে আরও পণ্য বেছে নিন।");
    } catch (error) {
      console.error("Add to cart failed:", error);
      setMessage("কার্টে পণ্য যোগ করা যায়নি। লগইন ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      setAdding(false);
    }
  }

  const buttonLabel = adding ? "কার্টে যোগ হচ্ছে..." : disabled ? "স্টকে নেই" : added ? "আরও ১টি যোগ করুন" : "কার্টে যোগ করুন";

  return (
    <>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          disabled={disabled || adding}
          onClick={addToCart}
          className="w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
        {message && <p role="status" aria-live="polite" className="rounded-xl bg-[#eef5ed] p-3 text-sm text-[#17351f]">{message}</p>}
        {loginRequired && <Link href="/login?next=%2Fcart" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">লগইন করুন</Link>}
        {added && <Link href="/cart" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">কার্ট দেখুন ও Checkout করুন</Link>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-8px_24px_rgba(15,50,25,0.10)] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-500">পছন্দ হয়েছে?</p>
            <p className="truncate text-sm font-black text-[#17351f]">কার্টে যোগ করে আরও পণ্য বেছে নিন</p>
          </div>
          <button
            type="button"
            disabled={disabled || adding}
            onClick={addToCart}
            className="min-h-12 shrink-0 rounded-xl bg-[#17351f] px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
          {added && <Link href="/cart" className="hidden min-h-12 shrink-0 items-center rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-900 sm:inline-flex">কার্ট</Link>}
        </div>
      </div>
      <div aria-hidden="true" className="h-24 sm:h-20" />
    </>
  );
}

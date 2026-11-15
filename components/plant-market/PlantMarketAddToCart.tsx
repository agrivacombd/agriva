"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlantMarketAddToCart({
  productId,
  disabled = false,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const router = useRouter();

  async function add() {
    if (busy || disabled) return;
    setBusy(true);
    setMessage("");
    setNeedsLogin(false);

    try {
      const response = await fetch("/api/plant-market/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (response.status === 401) {
        setNeedsLogin(true);
        setMessage("কার্টে পণ্য যোগ করতে লগইন করুন।");
        return;
      }
      if (!response.ok) {
        setMessage("কার্টে পণ্য যোগ করা যায়নি। স্টক যাচাই করে আবার চেষ্টা করুন।");
        return;
      }

      setMessage("পণ্য কার্টে যোগ হয়েছে।");
      router.refresh();
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || disabled}
          className="min-h-12 rounded-xl bg-emerald-900 px-6 py-3 font-extrabold text-white disabled:opacity-50"
        >
          {disabled ? "স্টক শেষ" : busy ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}
        </button>
        <Link href="/plant-market/cart" className="inline-flex min-h-12 items-center rounded-xl border border-emerald-900/20 px-5 py-3 font-bold text-emerald-950">
          Plant Market Cart
        </Link>
      </div>
      {message && <div role="status" className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-emerald-800">
        <span>{message}</span>
        {needsLogin && <Link href={"/login?next=" + encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/plant-market")} className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white">লগইন করুন</Link>}
      </div>}
    </div>
  );
}

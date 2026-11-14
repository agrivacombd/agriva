"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Share2 } from "lucide-react";

type Props = {
  productName: string;
  productUrl: string;
  imageUrl: string | null;
  priceLabel: string;
};

/**
 * Deliberately user-initiated and limited to the canonical product URL.
 * No auto-posts, referral parameters, bulk sharing, popups or repeated prompts.
 */
export default function ProductShareCard({ productName, productUrl, imageUrl, priceLabel }: Props) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setMessage("পণ্যের লিংক কপি হয়েছে।");
    } catch {
      setCopied(false);
      setMessage("লিংকটি নিচের বক্স থেকে নির্বাচন করে কপি করুন।");
    }
  }

  async function shareProduct() {
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: productName, url: productUrl });
      setMessage("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("শেয়ার করা যায়নি। চাইলে লিংক কপি করুন।");
    }
  }

  return (
    <section aria-label="পণ্যের শেয়ার কার্ড"
      className="mt-3 flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:mt-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="48px" unoptimized className="object-contain p-1" />
          ) : <span className="grid h-full place-items-center text-xl" aria-hidden="true">🌱</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold text-slate-900">পণ্যটি শেয়ার করুন</h2>
          <p className="truncate text-xs text-slate-600">{productName}</p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-800">{priceLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void shareProduct()}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
          <Share2 size={16} aria-hidden="true" /> শেয়ার করুন
        </button>
        <button type="button" onClick={() => void copyLink()}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? "কপি হয়েছে" : "লিংক কপি"}
        </button>
      </div>
      {message && <p role="status" aria-live="polite" className="text-xs leading-5 text-slate-600">{message}</p>}
      {message.includes("বক্স") && (
        <input readOnly value={productUrl} onFocus={event => event.currentTarget.select()}
          aria-label="পণ্যের স্থায়ী লিংক" className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700" />
      )}
    </section>
  );
}

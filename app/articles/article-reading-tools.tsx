"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-emerald-100/80" role="progressbar" aria-label="লেখা পড়ার অগ্রগতি" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
      <div className="h-full bg-emerald-600 transition-[width] duration-100" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function ShareArticle({ title, url }: { title: string; url: string }) {
  const [message, setMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  // The server supplies a single canonical, query-free URL. Never share the
  // current browser location (which may include campaign or tracking params).
  const shareUrl = url;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const platforms = [
    { label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl },
    { label: "WhatsApp", href: "https://api.whatsapp.com/send?text=" + encodeURIComponent(title + "\n" + shareUrl) },
    { label: "X", href: "https://twitter.com/intent/tweet?url=" + encodedUrl + "&text=" + encodedTitle },
    { label: "LinkedIn", href: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl },
    { label: "Telegram", href: "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedTitle },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("লেখার লিংক কপি হয়েছে।");
    } catch {
      setMessage("কপি করা যায়নি। নিচের লিংক সিলেক্ট করে কপি করুন।");
      setShowAll(true);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, url: shareUrl });
      setMessage("শেয়ার মেনু ব্যবহার করা হয়েছে।");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("শেয়ার করা যায়নি। অন্য শেয়ার অপশন ব্যবহার করুন।");
    }
  }

  return (
    <section aria-label="নিবন্ধ শেয়ার করুন" className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-emerald-950">লেখাটি শেয়ার করুন</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">যাদের কাজে লাগবে তাদের সঙ্গে শেয়ার করুন। অপ্রয়োজনীয় বারবার পোস্ট করা এড়িয়ে চলুন।</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={nativeShare} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900">
          ↗ Share
        </button>
        <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
          Copy Link
        </button>
        <button type="button" aria-expanded={showAll} aria-controls="blog-share-platforms" onClick={() => setShowAll(value => !value)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
          {showAll ? "প্ল্যাটফর্ম বন্ধ করুন" : "Facebook / WhatsApp / আরও"}
        </button>
      </div>
      {showAll && <div id="blog-share-platforms" className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {platforms.map(platform => <a key={platform.label} href={platform.href} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 px-3 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
            {platform.label} ↗
          </a>)}
        </div>
        <label className="block text-xs font-semibold text-slate-600">
          Canonical URL
          <input readOnly onFocus={event => event.currentTarget.select()} value={shareUrl} aria-label="নিবন্ধের শেয়ার লিংক"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-700" />
        </label>
      </div>}
      <p aria-live="polite" className="mt-3 text-xs text-slate-600">{message}</p>
    </section>
  );
}

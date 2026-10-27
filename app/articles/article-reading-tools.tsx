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

export function ShareArticle({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function shareArticle() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("শেয়ার মেনু খোলা হয়েছে");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setMessage("লেখার লিংক কপি হয়েছে");
      } else {
        setMessage("এই ব্রাউজারে শেয়ার সুবিধা নেই। ঠিকানা বার থেকে লিংক কপি করুন।");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("শেয়ার করা যায়নি। ঠিকানা বার থেকে লিংক কপি করুন।");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={shareArticle} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50">
        ↗ লেখাটি শেয়ার করুন
      </button>
      <p aria-live="polite" className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

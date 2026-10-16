"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SearchResult = {
  intent: string;
  answer: string;
  answerSource?: "openai" | "built-in";
  resultCount: number;
  zeroResult: boolean;
  opportunityType?: string;
  suggestedTitle: string;
  error?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const raw = await response.text();
      let data: SearchResult;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(response.ok
          ? "সার্চ সার্ভার থেকে সঠিক উত্তর আসেনি। পেজটি refresh করে আবার চেষ্টা করুন।"
          : `সার্চ সার্ভারে সমস্যা হয়েছে (HTTP ${response.status})। একটু পরে আবার চেষ্টা করুন।`);
      }
      if (!response.ok) throw new Error(data.error || `অনুসন্ধান করা যায়নি (HTTP ${response.status})।`);
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("এই অনুসন্ধানের উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-12 text-[#17351f] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-black text-[#17351f]">AGRIVA</Link>
          <Link href="/ai" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">AGRIVA AI-তে প্রশ্ন করুন</Link>
        </div>
        <p className="mt-8 font-bold text-[#b58b28]">AGRIVA INTELLIGENCE</p>
        <h1 className="mt-2 text-4xl font-black">Smart Search</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#657467]">কৃষি বিষয়ে প্রশ্ন করুন—AGRIVA আপনার প্রশ্নের ধরন বুঝে পরামর্শ দেবে এবং পণ্যের মিল খুঁজবে।</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">কৃষি বিষয়ে অনুসন্ধান</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={2000} className="min-h-14 w-full rounded-2xl border border-[#d5dfd1] bg-white px-5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="যেমন: ধানের পাতায় বাদামী দাগ কেন হচ্ছে?" required />
          </label>
          <button disabled={loading || !query.trim()} className="min-h-14 rounded-2xl bg-[#17351f] px-7 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "বিশ্লেষণ হচ্ছে..." : "অনুসন্ধান করুন"}</button>
        </form>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {result && (
          <section className="mt-8 space-y-5 rounded-3xl border border-[#e0e8dc] bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e7f0e6] px-3 py-1 text-xs font-bold">প্রশ্নের ধরন: {result.intent}</span>
              <span className="rounded-full bg-[#edf2f7] px-3 py-1 text-xs font-bold">মিল পাওয়া পণ্য: {result.resultCount ?? 0}</span>
              <span className="rounded-full bg-[#fff4d7] px-3 py-1 text-xs font-bold">{result.answerSource === "openai" ? "AI উত্তর" : "সাধারণ সহায়ক উত্তর"}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">AGRIVA-এর পরামর্শ</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-[#425348]">{result.answer}</p>
            </div>
            {result.zeroResult && <p className="rounded-2xl bg-[#fff8e7] p-4 text-sm leading-6 text-[#73561a]">এই প্রশ্নের সঙ্গে মিলে এমন অনুমোদিত পণ্য এখন পাওয়া যায়নি। প্রশ্নটি ভবিষ্যৎ কৃষি কনটেন্ট বা পণ্যের চাহিদা বোঝার জন্য সংরক্ষণ করা হতে পারে।</p>}
            <p className="text-xs leading-5 text-[#657467]">কৃষি পরামর্শ সাধারণ তথ্য হিসেবে দেওয়া হয়। রোগ বা কীটনাশক ব্যবহারের সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার সঙ্গে যাচাই করুন।</p>
          </section>
        )}
      </div>
    </main>
  );
}

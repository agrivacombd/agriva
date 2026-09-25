"use client";

import { FormEvent, useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ intent: string; answer: string; opportunity?: { type: string; keyword: string } } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
    setResult(await response.json());
    setLoading(false);
  }

  return <main className="min-h-screen bg-[#f6f8f3] px-6 py-16 text-[#17351f]"><div className="mx-auto max-w-4xl"><p className="font-bold text-[#b58b28]">AGRIVA AI</p><h1 className="mt-2 text-4xl font-black">Smart Search</h1><p className="mt-3 text-[#657467]">Ask AGRIVA about crops, diseases, products, farming or agriculture knowledge.</p><form onSubmit={submit} className="mt-8 flex gap-3"><input value={query} onChange={e=>setQuery(e.target.value)} className="min-h-14 flex-1 rounded-2xl border bg-white px-5 outline-none" placeholder="যেমন: ধানের পাতায় বাদামী দাগ কেন হচ্ছে?"/><button className="rounded-2xl bg-[#17351f] px-7 font-bold text-white">{loading ? "Analyzing..." : "Search"}</button></form>{result && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#e7f0e6] px-3 py-1 text-xs font-bold">Intent: {result.intent}</span>{result.opportunity && <span className="rounded-full bg-[#fff4d7] px-3 py-1 text-xs font-bold">Opportunity: {result.opportunity.type}</span>}</div><h2 className="mt-5 text-xl font-bold">AGRIVA response</h2><p className="mt-2 leading-7 text-[#657467]">{result.answer}</p></section>}</div></main>;
}

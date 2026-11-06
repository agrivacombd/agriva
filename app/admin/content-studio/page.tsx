"use client";

import { useState } from "react";

export default function ContentStudioPage() {
  const [keyword, setKeyword] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!keyword.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/content-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword, language: "English" }) });
    const data = await res.json();
    setBrief(data.brief ?? null);
    setLoading(false);
  }

  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1500px]"><header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8"><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · GROWTH, SEO & ANALYTICS</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Content Studio</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">Search demand থেকে editorial brief তৈরি করুন। এই workflow brief generation-এর জন্য; এটি নিজে থেকে CMS-এ publish বা persist করে না।</p></div></header><div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#e0e9dd] bg-white p-4 shadow-[0_2px_12px_rgba(23,53,31,0.03)] sm:flex-row sm:p-5"><input value={keyword} onChange={e=>setKeyword(e.target.value)} className="min-h-14 flex-1 rounded-2xl border bg-white px-5" placeholder="e.g. rice leaf disease"/><button onClick={generate} className="rounded-2xl bg-[#17351f] px-7 font-bold text-white">{loading ? "Generating..." : "Generate brief"}</button></div>{brief && <section className="mt-6 space-y-6 rounded-3xl border border-[#e0e9dd] bg-white p-6 shadow-sm sm:p-7"><div><p className="text-sm font-bold text-[#1f7a45]">TITLE</p><h2 className="mt-1 text-2xl font-black">{brief.title}</h2></div><div><p className="font-bold">Outline</p><ol className="mt-3 list-decimal space-y-2 pl-5 text-[#647468]">{brief.outline.map((x:string)=><li key={x}>{x}</li>)}</ol></div><div><p className="font-bold">FAQ</p><ul className="mt-3 space-y-2 text-[#647468]">{brief.faq.map((x:string)=><li key={x}>• {x}</li>)}</ul></div><div className="rounded-2xl bg-[#eef5ed] p-5"><p className="font-bold">SEO metadata</p><p className="mt-2 text-sm"><b>Meta title:</b> {brief.seo.metaTitle}</p><p className="mt-2 text-sm"><b>Description:</b> {brief.seo.metaDescription}</p><p className="mt-2 text-sm"><b>Keywords:</b> {brief.seo.keywords.join(", ")}</p></div></section>}</div></main>;
}

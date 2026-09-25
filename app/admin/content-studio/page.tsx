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

  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-5xl"><p className="font-bold uppercase tracking-[.18em] text-[#b58b28]">AI Content Studio</p><h1 className="mt-2 text-4xl font-black">Turn demand into content</h1><p className="mt-3 text-[#647468]">Enter a high-demand search keyword to create an editorial brief.</p><div className="mt-8 flex gap-3"><input value={keyword} onChange={e=>setKeyword(e.target.value)} className="min-h-14 flex-1 rounded-2xl border bg-white px-5" placeholder="e.g. rice leaf disease"/><button onClick={generate} className="rounded-2xl bg-[#17351f] px-7 font-bold text-white">{loading ? "Generating..." : "Generate brief"}</button></div>{brief && <section className="mt-8 space-y-6 rounded-3xl bg-white p-7 shadow-sm"><div><p className="text-sm font-bold text-[#1f7a45]">TITLE</p><h2 className="mt-1 text-2xl font-black">{brief.title}</h2></div><div><p className="font-bold">Outline</p><ol className="mt-3 list-decimal space-y-2 pl-5 text-[#647468]">{brief.outline.map((x:string)=><li key={x}>{x}</li>)}</ol></div><div><p className="font-bold">FAQ</p><ul className="mt-3 space-y-2 text-[#647468]">{brief.faq.map((x:string)=><li key={x}>• {x}</li>)}</ul></div><div className="rounded-2xl bg-[#eef5ed] p-5"><p className="font-bold">SEO metadata</p><p className="mt-2 text-sm"><b>Meta title:</b> {brief.seo.metaTitle}</p><p className="mt-2 text-sm"><b>Description:</b> {brief.seo.metaDescription}</p><p className="mt-2 text-sm"><b>Keywords:</b> {brief.seo.keywords.join(", ")}</p></div></section>}</div></main>;
}

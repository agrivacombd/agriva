"use client";

import { useState } from "react";
import { ArrowRight, Bot, Leaf, Search, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";

const modules = [
  { icon: Bot, title: "AGRIVA AI", text: "Ask questions, understand farm context and get intelligent next steps.", href: "/ai" },
  { icon: Search, title: "Smart Search", text: "Search agriculture knowledge, products and content from one place.", href: "/search" },
  { icon: Leaf, title: "Farm Intelligence", text: "Bring farms, crops, weather and insights into one dashboard.", href: "/farms" },
  { icon: ShoppingBag, title: "Marketplace", text: "Discover relevant agriculture products with smarter recommendations.", href: "/marketplace" },
];

export default function HomeClient() {
  const [query, setQuery] = useState("");
  function submitSearch() {
    const value = query.trim();
    window.location.href = value ? `/search?q=${encodeURIComponent(value)}` : "/search";
  }
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="AGRIVA home"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0b6b4f] text-white shadow-lg"><Leaf size={23} /></div><div><div className="text-xl font-black tracking-tight text-[#064b39]">AGRIVA</div><div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c99a3e]">AI Agriculture</div></div></a>
        <nav className="hidden gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Main navigation"><a href="/ai" className="hover:text-[#0b6b4f]">AI</a><a href="/tools" className="hover:text-[#0b6b4f]">Tools</a><a href="/farms" className="hover:text-[#0b6b4f]">Farms</a><a href="/blog" className="hover:text-[#0b6b4f]">Blog</a><a href="/marketplace" className="hover:text-[#0b6b4f]">Marketplace</a></nav>
        <a href="/ai" className="rounded-xl bg-[#0b6b4f] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#064b39]">Open App</a>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-12 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-[#0b6b4f] shadow-sm"><Sparkles size={14} /> AI-powered agriculture intelligence</div>
          <h1 className="text-5xl font-black tracking-tight text-[#12352a] md:text-7xl">One intelligent platform for <span className="text-[#0b6b4f]">modern agriculture.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">AGRIVA brings AI assistance, smart search, farm intelligence, agriculture content and marketplace tools into one modern web Super App.</p>
          <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="mx-auto mt-9 flex max-w-2xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-emerald-900/5"><Search className="ml-3 text-slate-400" size={21} aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" placeholder="Ask AGRIVA anything about agriculture…" aria-label="Search agriculture" /><button type="submit" className="rounded-xl bg-[#0b6b4f] px-5 py-3 text-sm font-bold text-white">Ask AI</button></form>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-500"><a href="/tools" className="rounded-full bg-white px-4 py-2 shadow-sm hover:text-[#0b6b4f]">Explore tools</a><a href="/blog" className="rounded-full bg-white px-4 py-2 shadow-sm hover:text-[#0b6b4f]">Read agriculture guides</a><a href="/marketplace" className="rounded-full bg-white px-4 py-2 shadow-sm hover:text-[#0b6b4f]">Shop marketplace</a></div>
        </div>
        <div id="features" className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{modules.map(({ icon: Icon, title, text, href }) => <a href={href} key={title} className="group rounded-3xl border border-white bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#0b6b4f]"><Icon size={23} /></div><h2 className="font-extrabold text-[#12352a]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#0b6b4f]">Open <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></a>)}</div>
        <section id="intelligence" className="mt-8 grid gap-6 rounded-[2rem] bg-[#064b39] p-8 text-white md:p-10 lg:grid-cols-[1.1fr_.9fr]"><div><div className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-200"><TrendingUp size={17} /> AGRIVA Intelligence</div><h2 className="text-3xl font-black md:text-4xl">Search today. Discover tomorrow&apos;s demand.</h2><p className="mt-4 max-w-xl leading-7 text-emerald-50/75">AGRIVA is designed to learn from aggregated search demand and surface content and product opportunities for the admin team.</p><a href="/admin" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#064b39]">Open intelligence <ArrowRight size={16} /></a></div><div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="text-xs font-bold uppercase tracking-widest text-emerald-200">AI Demand Center</div><div className="mt-5 space-y-3">{["Rice disease management", "Organic fertilizer", "Tomato pest control"].map((q, i) => <div key={q} className="flex items-center justify-between rounded-2xl bg-white/10 p-4"><span className="text-sm font-semibold">{q}</span><span className="text-xs font-bold text-emerald-200">{184 - i * 42} searches</span></div>)}</div></div></section>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

const sections: { group: string; items: { title: string; desc: string; href: string; icon: string; draft?: boolean }[] }[] = [
  { group: "Marketplace", items: [
    { title: "পণ্য ব্যবস্থাপনা", desc: "Live পণ্য, draft, moderation ও taxonomy", href: "/admin/products", icon: "📦" },
    { title: "Product SEO Studio", desc: "নতুন পণ্য, metadata, keyword ও কৃষি-তথ্য", href: "/admin/product-studio", icon: "🌱", draft: true },
    { title: "অর্ডার ও fulfillment", desc: "অর্ডার, payment status ও delivery", href: "/admin/orders", icon: "🧾" },
    { title: "ক্যাটাগরি", desc: "Marketplace category ও subcategory", href: "/admin/categories", icon: "🗂️" },
    { title: "Harvest marketplace", desc: "ফসলের listing ও farmer supply", href: "/admin/harvest", icon: "🌾" },
  ]},
  { group: "People & money", items: [
    { title: "ব্যবহারকারী", desc: "Account, role ও onboarding", href: "/admin/users", icon: "👥" },
    { title: "কমিশন ও payout", desc: "রিসেলার কমিশন ও settlement overview", href: "/admin", icon: "💳" },
    { title: "Transport", desc: "Transport partner ও booking operations", href: "/admin/transport", icon: "🚚" },
  ]},
  { group: "Content & growth", items: [
    { title: "Content Studio", desc: "Content draft, review ও editorial workflow", href: "/admin/content-studio", icon: "✍️" },
    { title: "Content drafts", desc: "SEO content draft library", href: "/admin/content-drafts", icon: "📝" },
    { title: "Article review", desc: "Article drafts ও approval queue", href: "/admin/articles", icon: "📚" },
    { title: "AI content", desc: "AI-assisted content tools", href: "/admin/ai-content", icon: "✨" },
    { title: "Search intelligence", desc: "Search query ও keyword opportunities", href: "/admin/search-intelligence", icon: "🔎" },
    { title: "Opportunities", desc: "Growth opportunities ও content planning", href: "/admin/opportunities", icon: "📈" },
  ]},
  { group: "Platform & governance", items: [
    { title: "Site settings", desc: "Homepage notice, support ও checkout flags", href: "/admin/settings", icon: "⚙️" },
    { title: "Admin audit log", desc: "Administrative actions ও accountability", href: "/admin/audit", icon: "🛡️" },
    { title: "Reports", desc: "Business reports ও CSV export", href: "/admin/reports", icon: "📊" },
    { title: "Jobs", desc: "Agriculture jobs ও application operations", href: "/admin/jobs", icon: "🧑‍🌾" },
  ]},
];

type Metric = { label: string; value: number | null; hint: string; href: string; tone?: string };
export default function CommandCenterClient({ metrics, health }: { metrics: Metric[]; health: { label: string; available: boolean; note: string }[] }) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("সব");
  const groups = ["সব", ...sections.map(s => s.group)];
  const filtered = sections.map(s => ({ ...s, items: s.items.filter(i => (activeGroup === "সব" || s.group === activeGroup) && (i.title + " " + i.desc).toLowerCase().includes(query.toLowerCase())) })).filter(s => s.items.length);
  const available = health.filter(x => x.available).length;
  return <main className="min-h-screen bg-[#f4f7f1] text-[#17351f]">
    <header className="bg-[#103b28] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-2xl">🌿</span><span><span className="block text-lg font-black tracking-wide">AGRIVA</span><span className="block text-xs text-emerald-100">SUPER ADMIN COMMAND CENTER</span></span></Link>
          <div className="flex flex-wrap gap-2"><Link href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold hover:bg-white/10">Live site ↗</Link><Link href="/admin" className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-[#103b28]">Legacy dashboard</Link></div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-200">One control room · all workflows</p><h1 className="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">Site command center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">লাইভ সাইট, পণ্য, অর্ডার, কনটেন্ট, ব্যবহারকারী, SEO ও অপারেশন—এক জায়গা থেকে দেখুন। প্রতিটি module-এর নিজস্ব permission ও workflow বজায় থাকে।</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/[.07] p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">Data connectivity check</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">{available}/{health.length} available</span></div><p className="mt-2 text-xs leading-5 text-emerald-50/80">এটি read-only schema check; missing table হলে সেটিকে unavailable হিসেবে দেখানো হবে—কোনো migration বা write করা হয় না।</p></div>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section aria-label="Live metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map(m => <Link key={m.label} href={m.href} className="group rounded-2xl border border-[#dce6d8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"><p className="text-xs font-bold text-[#718071]">{m.label}</p><p className="mt-2 text-2xl font-black tabular-nums">{m.value === null ? "—" : m.value.toLocaleString()}</p><p className="mt-1 text-xs text-[#748274]">{m.hint}</p></Link>)}
      </section>
      <section className="mt-7 rounded-2xl border border-[#dce6d8] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-black">সব admin module</h2><p className="mt-1 text-sm text-[#718071]">Search করুন অথবা category বেছে নিন।</p></div><div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Module খুঁজুন..." aria-label="Search admin modules" className="min-w-0 rounded-xl border border-[#d8e3d4] px-3 py-2.5 text-sm outline-none focus:border-emerald-600 sm:w-64"/><select value={activeGroup} onChange={e=>setActiveGroup(e.target.value)} aria-label="Filter module group" className="rounded-xl border border-[#d8e3d4] bg-white px-3 py-2.5 text-sm">{groups.map(g=><option key={g}>{g}</option>)}</select></div></div>
        <div className="mt-5 space-y-7">{filtered.map(section=><div key={section.group}><h3 className="mb-3 text-xs font-extrabold uppercase tracking-[.15em] text-[#8b762f]">{section.group}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{section.items.map(item=><Link key={item.href+item.title} href={item.href} className="flex min-w-0 gap-3 rounded-2xl border border-[#e3eae0] bg-[#fcfdfb] p-4 transition hover:border-emerald-400 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-600"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eaf3e6] text-xl">{item.icon}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-extrabold">{item.title}{item.draft&&<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">DRAFT</span>}</span><span className="mt-1 block text-xs leading-5 text-[#718071]">{item.desc}</span><span className="mt-3 inline-flex text-xs font-extrabold text-emerald-800">Open module →</span></span></Link>)}</div></div>)}</div>
        {filtered.length===0&&<p className="mt-6 rounded-xl bg-[#f4f7f1] p-5 text-sm text-[#718071]">কোনো module পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।</p>}
      </section>
      <section className="mt-7 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-[#dce6d8] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#8b762f]">Release & safety</p><h2 className="mt-2 text-xl font-black">Live আর draft—দুটিই আলাদা করে যাচাই করুন</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-[#5f7062]"><li>• Product status ও moderation status আলাদা; শুধু active হলেই public হওয়া উচিত নয়।</li><li>• Content drafts এবং published articles-এর workflow আলাদা রাখুন; draft public publish নয়।</li><li>• Orders, payout, payment settings এবং user roles-এর মতো sensitive action সংশ্লিষ্ট protected module থেকেই করুন।</li><li>• Database schema mismatch থাকলে read errors দেখুন; live database-এ migration অনুমান করে চালাবেন না।</li></ul><Link href="/admin/audit" className="mt-4 inline-flex rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">Review audit log →</Link></div>
        <div className="rounded-2xl border border-[#dce6d8] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#8b762f]">Read-only health</p><h2 className="mt-2 text-xl font-black">Connected data sources</h2><div className="mt-4 space-y-2">{health.map(h=><div key={h.label} className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f9f5] p-3"><div><p className="text-sm font-bold">{h.label}</p><p className="mt-1 text-xs leading-5 text-[#718071]">{h.note}</p></div><span className={h.available?"rounded-full bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-900":"rounded-full bg-amber-100 px-2 py-1 text-xs font-extrabold text-amber-900"}>{h.available?"Available":"Check schema"}</span></div>)}</div><p className="mt-3 text-xs leading-5 text-[#718071]">Statusটি বর্তমান server-এর read-only query result। এটি uptime monitor বা deployment health-এর বিকল্প নয়।</p></div>
      </section>
      <footer className="py-8 text-center text-xs text-[#7a8879]">AGRIVA admin workspace · responsive for mobile, tablet and desktop · protected by server-side admin checks</footer>
    </div>
  </main>;
}

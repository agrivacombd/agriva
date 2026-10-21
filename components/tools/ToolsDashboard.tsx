"use client";

import { useMemo, useState } from "react";

const toolCards = [
  { id: "fertilizer", icon: "🧪", title: "সার হিসাব ক্যালকুলেটর", description: "আপনার নির্ধারিত প্রতি একরের মাত্রা থেকে মোট সারের পরিমাণ হিসাব করুন।" },
  { id: "seed", icon: "🌱", title: "বীজের হিসাব", description: "জমির আয়তন ও প্রতি একরে বীজের হার দিয়ে প্রয়োজনীয় বীজ হিসাব করুন।" },
  { id: "profit", icon: "৳", title: "চাষের খরচ ও লাভ", description: "খরচ, উৎপাদন ও বিক্রয়মূল্য দিয়ে সম্ভাব্য লাভ-লোকসান বুঝুন।" },
  { id: "calendar", icon: "🗓️", title: "ফসল ক্যালেন্ডার", description: "মৌসুমের কাজগুলো সাজিয়ে রাখুন এবং কাজ শেষ হলে টিক দিন।" },
] as const;

const tasks = [
  "জমি ও মাটির অবস্থা পর্যবেক্ষণ",
  "বিশ্বস্ত উৎস থেকে বীজ নির্বাচন",
  "জমি প্রস্তুত ও পানি নিষ্কাশনের ব্যবস্থা",
  "ফসলের নিয়মিত পর্যবেক্ষণ",
  "আগাছা ও রোগবালাই সমন্বিতভাবে ব্যবস্থাপনা",
  "ফসল কাটার উপযুক্ত সময় যাচাই",
];

function NumberField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix?: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-emerald-500"><input type="number" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-xl bg-transparent px-3 py-2.5 text-base font-medium outline-none" /><span className="pr-3 text-xs text-slate-500">{suffix}</span></span></label>;
}

export default function ToolsDashboard() {
  const [area, setArea] = useState("1");
  const [fertilizerRate, setFertilizerRate] = useState("25");
  const [seedRate, setSeedRate] = useState("20");
  const [unit, setUnit] = useState("acre");
  const [costs, setCosts] = useState({ seed: "1500", fertilizer: "3000", labor: "2500", irrigation: "1000", other: "500" });
  const [yieldKg, setYieldKg] = useState("1200");
  const [pricePerKg, setPricePerKg] = useState("35");
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const multiplier = unit === "acre" ? 1 : unit === "decimal" ? 1 / 100 : 2.47105;
  const acres = Math.max(0, Number(area || 0) * multiplier);
  const fertilizerTotal = useMemo(() => acres * Math.max(0, Number(fertilizerRate || 0)), [acres, fertilizerRate]);
  const seedTotal = useMemo(() => acres * Math.max(0, Number(seedRate || 0)), [acres, seedRate]);
  const totalCost = Object.values(costs).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const revenue = Math.max(0, Number(yieldKg || 0)) * Math.max(0, Number(pricePerKg || 0));
  const money = (n: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(n) + " টাকা";
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-7xl">
      <a href="/" className="text-sm font-bold text-emerald-800 hover:underline">← AGRIVA হোম</a>
      <section className="mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-6 text-white sm:p-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">কৃষকের ডিজিটাল টুলবক্স</span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">কৃষিকাজের হিসাব, পরিকল্পনা ও শেখা—এক জায়গায়</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">জমির পরিমাণ অনুযায়ী হিসাব করুন, চাষের খরচ বুঝুন এবং মৌসুমের কাজ গুছিয়ে নিন। সহজ বাংলা, মোবাইল-ফ্রেন্ডলি টুল।</p>
          <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => jump("fertilizer")} className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-900 hover:bg-emerald-50">হিসাব শুরু করুন ↓</button><button onClick={() => jump("learning")} className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">কৃষি গাইড দেখুন</button></div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {toolCards.map((tool) => <button key={tool.id} onClick={() => jump(tool.id)} className="group rounded-2xl border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">{tool.icon}</span><h2 className="mt-4 text-lg font-extrabold">{tool.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p><span className="mt-4 inline-block text-sm font-bold text-emerald-800">ব্যবহার করুন →</span></button>)}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <a href="/crop-disease" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="text-2xl">🔬</span><h2 className="mt-3 text-lg font-extrabold">ছবি দিয়ে রোগ বিশ্লেষণ</h2><p className="mt-2 text-sm leading-6 text-slate-600">ফসলের ছবি দিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক রোগ বিশ্লেষণ ও ব্যক্তিগত ইতিহাস দেখুন।</p><span className="mt-4 inline-block text-sm font-bold text-emerald-800">ছবি বিশ্লেষণ করুন →</span></a>
        <a href="/market-prices" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="text-2xl">📈</span><h2 className="mt-3 text-lg font-extrabold">কৃষিপণ্যের বাজারদর</h2><p className="mt-2 text-sm leading-6 text-slate-600">সরকারি বাজারদরের উৎসে যান এবং বিক্রির আগে দাম যাচাই করুন।</p><span className="mt-4 inline-block text-sm font-bold text-emerald-800">বাজারদর দেখুন →</span></a>
        <a href="/weather" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="text-2xl">🌦️</span><h2 className="mt-3 text-lg font-extrabold">কৃষি আবহাওয়া</h2><p className="mt-2 text-sm leading-6 text-slate-600">নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস দেখুন।</p><span className="mt-4 inline-block text-sm font-bold text-emerald-800">পূর্বাভাস দেখুন →</span></a>
        <a href="/crop-calendar" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="text-2xl">🗓️</span><h2 className="mt-3 text-lg font-extrabold">আমার ফসল ক্যালেন্ডার</h2><p className="mt-2 text-sm leading-6 text-slate-600">ফসল বেছে কাজের তালিকা তৈরি করুন এবং ব্রাউজারে সংরক্ষণ করুন।</p><span className="mt-4 inline-block text-sm font-bold text-emerald-800">পরিকল্পনা করুন →</span></a>
      </section>

      <section id="fertilizer" className="mt-10 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><span className="text-3xl">🧪</span><div><h2 className="text-2xl font-black">সার হিসাব ক্যালকুলেটর</h2><p className="mt-1 text-sm text-slate-600">আপনার কৃষি কর্মকর্তা/মাটির পরীক্ষায় নির্ধারিত প্রতি একরের মাত্রা বসিয়ে মোট পরিমাণ বের করুন।</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><NumberField label="জমির পরিমাণ" value={area} onChange={setArea} suffix={unit === "acre" ? "একর" : unit === "decimal" ? "শতক" : "হেক্টর"} /><NumberField label="প্রতি একরে সারের মাত্রা" value={fertilizerRate} onChange={setFertilizerRate} suffix="কেজি" /><label className="block text-sm font-semibold text-slate-700">জমির একক<select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base"><option value="acre">একর</option><option value="decimal">শতক</option><option value="hectare">হেক্টর</option></select></label></div>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">মোট প্রয়োজনীয় সার (আপনার দেওয়া মাত্রা অনুযায়ী)</p><p className="mt-1 text-3xl font-black text-emerald-950">{new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(fertilizerTotal)} কেজি</p></div>
        <p className="mt-4 text-xs leading-5 text-amber-800">সতর্কতা: এখানে কোনো নির্দিষ্ট সারের সুপারিশ দেওয়া হচ্ছে না। ফসল, মাটির পরীক্ষা ও স্থানীয় কৃষি নির্দেশনা অনুযায়ী মাত্রা নিশ্চিত করুন।</p>
      </section>

      <section id="seed" className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><span className="text-3xl">🌱</span><div><h2 className="text-2xl font-black">বীজের হিসাব</h2><p className="mt-1 text-sm text-slate-600">প্রতি একরে আপনার নির্ধারিত বীজের হার অনুযায়ী প্রয়োজনীয় বীজ হিসাব করুন।</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><NumberField label="জমির পরিমাণ" value={area} onChange={setArea} suffix={unit === "acre" ? "একর" : unit === "decimal" ? "শতক" : "হেক্টর"} /><NumberField label="প্রতি একরে বীজের হার" value={seedRate} onChange={setSeedRate} suffix="কেজি" /></div>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">মোট বীজ লাগবে</p><p className="mt-1 text-3xl font-black text-emerald-950">{new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(seedTotal)} কেজি</p></div>
        <p className="mt-4 text-xs leading-5 text-amber-800">বীজের হার ফসল, জাত, বপন/রোপণ পদ্ধতি ও মৌসুম অনুযায়ী বদলায়। উদাহরণ হিসেবে দেওয়া হার ব্যবহারের আগে যাচাই করুন।</p>
      </section>

      <section id="profit" className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><span className="text-3xl">৳</span><div><h2 className="text-2xl font-black">চাষের খরচ ও লাভ-লোকসান</h2><p className="mt-1 text-sm text-slate-600">নিজের আনুমানিক খরচ ও বিক্রির তথ্য দিয়ে হিসাব করুন।</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{([{key:"seed",label:"বীজের খরচ"},{key:"fertilizer",label:"সার ও উপকরণ"},{key:"labor",label:"শ্রমিকের খরচ"},{key:"irrigation",label:"সেচের খরচ"},{key:"other",label:"অন্যান্য খরচ"}] as const).map((item) => <NumberField key={item.key} label={item.label} value={costs[item.key]} onChange={(v) => setCosts((old) => ({...old,[item.key]:v}))} suffix="টাকা" />)}<NumberField label="মোট উৎপাদন" value={yieldKg} onChange={setYieldKg} suffix="কেজি" /><NumberField label="প্রতি কেজি বিক্রয়মূল্য" value={pricePerKg} onChange={setPricePerKg} suffix="টাকা" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">মোট খরচ</p><p className="mt-1 text-xl font-black">{money(totalCost)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">সম্ভাব্য বিক্রয় আয়</p><p className="mt-1 text-xl font-black">{money(revenue)}</p></div><div className={"rounded-2xl p-4 " + (revenue-totalCost >= 0 ? "bg-emerald-50" : "bg-rose-50")}><p className="text-sm text-slate-600">সম্ভাব্য {revenue-totalCost >= 0 ? "লাভ" : "লোকসান"}</p><p className="mt-1 text-xl font-black">{money(Math.abs(revenue-totalCost))}</p></div></div>
        <p className="mt-4 text-xs leading-5 text-slate-500">এটি আপনার দেওয়া তথ্যের ভিত্তিতে অনুমান; জমির ভাড়া, ঋণের সুদ, নষ্ট হওয়া ফসল ও পরিবহনসহ সব খরচ অন্তর্ভুক্ত করতে ভুলবেন না।</p>
      </section>

      <section id="calendar" className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><span className="text-3xl">🗓️</span><div><h2 className="text-2xl font-black">ফসল ক্যালেন্ডার: কাজের চেকলিস্ট</h2><p className="mt-1 text-sm text-slate-600">আপনার ফসল অনুযায়ী কাজের তালিকা সাজান। টিক দেওয়া কাজগুলো এই সেশনে চিহ্নিত থাকবে।</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{tasks.map((task) => <label key={task} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-emerald-50"><input type="checkbox" checked={checkedTasks.includes(task)} onChange={(e) => setCheckedTasks((old) => e.target.checked ? [...old, task] : old.filter((x) => x !== task))} className="mt-1 h-4 w-4 accent-emerald-700" /><span className={"text-sm leading-6 " + (checkedTasks.includes(task) ? "text-slate-400 line-through" : "text-slate-700")}>{task}</span></label>)}</div><p className="mt-4 text-sm font-bold text-emerald-900">সম্পন্ন: {checkedTasks.length}/{tasks.length} টি কাজ</p>
      </section>

      <section id="learning" className="mt-10 scroll-mt-6 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8"><p className="text-sm font-bold text-emerald-200">শিখুন · প্রয়োগ করুন · উন্নতি করুন</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">কৃষি শেখার পরবর্তী ধাপ</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-100">সারের মাত্রা, বীজ নির্বাচন ও রোগবালাই ব্যবস্থাপনায় স্থানীয় কৃষি কর্মকর্তার পরামর্শ এবং যাচাইকৃত কৃষি তথ্য অনুসরণ করুন। পরবর্তী ধাপে প্রতিটি ফসলের জন্য আলাদা বাংলা গাইড ও কুইজ যুক্ত করা যাবে।</p><div className="mt-5 flex flex-wrap gap-3"><a href="/learn" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950">সব কৃষি গাইড ও কুইজ দেখুন →</a><a href="https://ais.gov.bd/" target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950">কৃষি তথ্য সার্ভিস ↗</a><a href="https://market.dam.gov.bd/" target="_blank" rel="noreferrer" className="rounded-xl border border-white/30 px-4 py-3 text-sm font-bold text-white">সরকারি বাজারদর ↗</a></div></section>
      <p className="mt-8 text-center text-xs leading-5 text-slate-500">AGRIVA কৃষি টুলস · হিসাবগুলো আপনার দেওয়া তথ্যের ওপর নির্ভরশীল। ফসলভিত্তিক পরামর্শের জন্য স্থানীয় কৃষি কর্মকর্তার নির্দেশনা নিন।</p>
    </div>
  </main>;
}

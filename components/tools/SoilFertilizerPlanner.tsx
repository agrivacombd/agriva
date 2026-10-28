"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const fmt = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });
const number = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; };
const contentFraction = (value: string) => { const percent = number(value); return percent > 0 && percent <= 100 ? percent / 100 : null; };
const safeProduct = (...values: number[]) => { const result = values.reduce((product, value) => product * value, 1); return Number.isFinite(result) ? result : 0; };
const safeDivide = (numerator: number, denominator: number) => { const result = numerator / denominator; return Number.isFinite(result) ? result : 0; };
const moneyKg = (value: number) => `${fmt.format(value)} কেজি`;

function Field({ label, value, onChange, suffix, hint }: { label: string; value: string; onChange: (value: string) => void; suffix: string; hint?: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100"><input type="number" min="0" step="any" value={value} onChange={event => onChange(event.target.value)} className="w-full min-w-0 rounded-xl bg-transparent px-3 py-3 text-base font-medium outline-none" /><span className="whitespace-nowrap pr-3 text-xs text-slate-500">{suffix}</span></span>{hint && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}</label>;
}

export default function SoilFertilizerPlanner() {
  const [area, setArea] = useState("1");
  const [unit, setUnit] = useState("acre");
  const [crop, setCrop] = useState("ধান");
  const [source, setSource] = useState("মাটি পরীক্ষার রিপোর্ট / কৃষি কর্মকর্তার সুপারিশ");
  const [rates, setRates] = useState({ n: "", p: "", k: "" });
  const [contents, setContents] = useState({ urea: "46", tsp: "46", mop: "60" });
  const acres = safeProduct(number(area), unit === "decimal" ? 0.01 : unit === "hectare" ? 2.47105 : 1);
  const results = useMemo(() => {
    const ureaFraction = contentFraction(contents.urea);
    const tspFraction = contentFraction(contents.tsp);
    const mopFraction = contentFraction(contents.mop);
    return {
    urea: ureaFraction ? safeDivide(safeProduct(number(rates.n), acres), ureaFraction) : 0,
    tsp: tspFraction ? safeDivide(safeProduct(number(rates.p), acres), tspFraction) : 0,
    mop: mopFraction ? safeDivide(safeProduct(number(rates.k), acres), mopFraction) : 0,
    n: safeProduct(number(rates.n), acres),
    p: safeProduct(number(rates.p), acres),
    k: safeProduct(number(rates.k), acres),
  };
  }, [acres, rates, contents]);
  const updateRate = (key: keyof typeof rates, value: string) => setRates(old => ({ ...old, [key]: value }));
  const updateContent = (key: keyof typeof contents, value: string) => setContents(old => ({ ...old, [key]: value }));
  const reset = () => { setArea("1"); setUnit("acre"); setCrop("ধান"); setRates({ n: "", p: "", k: "" }); setContents({ urea: "46", tsp: "46", mop: "60" }); };

  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="text-sm font-bold text-emerald-800 hover:underline">← AGRIVA হোম</Link>
      <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">মাটি ও সার পরিকল্পনা</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">মাটির সুপারিশ থেকে সারের পরিমাণ হিসাব করুন</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার সুপারিশে দেওয়া পুষ্টি উপাদানের হার লিখুন। জমির পরিমাণ অনুযায়ী আনুমানিক ইউরিয়া, TSP ও MOP-এর পরিমাণ হিসাব হবে।</p>
      </header>

      <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black">১. ফসল ও জমির তথ্য</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">ফসলের নাম<input value={crop} maxLength={80} onChange={event => setCrop(event.target.value)} placeholder="যেমন: ধান" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="block text-sm font-bold text-slate-700">জমির পরিমাণ<input type="number" min="0" step="any" value={area} onChange={event => setArea(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="block text-sm font-bold text-slate-700">জমির একক<select value={unit} onChange={event => setUnit(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"><option value="acre">একর</option><option value="decimal">শতক</option><option value="hectare">হেক্টর</option></select></label>
          <label className="block text-sm font-bold text-slate-700">সুপারিশের উৎস<input value={source} maxLength={140} onChange={event => setSource(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
        </div>
        <p className="mt-3 text-sm text-slate-500">হিসাবের জমি: প্রায় {fmt.format(acres)} একর।</p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black">২. প্রতি একরে পুষ্টি উপাদানের সুপারিশ লিখুন</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">N, P₂O₅ ও K₂O-এর হার আপনার রিপোর্ট/বিশ্বস্ত সুপারিশ থেকে নিন। এই টুল নিজে থেকে ফসলভিত্তিক মাত্রা নির্ধারণ করে না।</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="নাইট্রোজেন (N)" value={rates.n} onChange={v => updateRate("n", v)} suffix="কেজি/একর" />
          <Field label="ফসফেট (P₂O₅)" value={rates.p} onChange={v => updateRate("p", v)} suffix="কেজি/একর" />
          <Field label="পটাশ (K₂O)" value={rates.k} onChange={v => updateRate("k", v)} suffix="কেজি/একর" />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black">৩. সারের প্যাকেটের উপাদান শতাংশ যাচাই করুন</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">নিচের শতাংশগুলো প্রচলিত উদাহরণ হিসেবে দেওয়া। আপনার কেনা সারের ব্যাগের লেবেল আলাদা হলে সেই অনুযায়ী পরিবর্তন করুন। শতাংশ অবশ্যই ০-এর বেশি এবং ১০০ বা কম হতে হবে; ভুল শতাংশ হলে সংশ্লিষ্ট সারের ফল ০ দেখাবে।</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="ইউরিয়ায় N" value={contents.urea} onChange={v => updateContent("urea", v)} suffix="%" />
          <Field label="TSP-তে P₂O₅" value={contents.tsp} onChange={v => updateContent("tsp", v)} suffix="%" />
          <Field label="MOP-তে K₂O" value={contents.mop} onChange={v => updateContent("mop", v)} suffix="%" />
        </div>
      </section>

      <section className="mt-6" aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">আপনার জমির আনুমানিক সার হিসাব</h2><p className="mt-1 text-sm text-slate-600">ফসল: {crop.trim() || "উল্লেখ করা হয়নি"} · উৎস: {source.trim() || "উল্লেখ করা হয়নি"}</p></div><button type="button" onClick={reset} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50">আবার শুরু করুন</button></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[{title:"ইউরিয়া",value:results.urea,sub:"N-এর হিসাব থেকে"},{title:"TSP",value:results.tsp,sub:"P₂O₅-এর হিসাব থেকে"},{title:"MOP",value:results.mop,sub:"K₂O-এর হিসাব থেকে"}].map(item => <article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{item.title}</p><p className="mt-2 text-3xl font-black text-emerald-900">{moneyKg(item.value)}</p><p className="mt-1 text-xs text-slate-500">{item.sub}</p></article>)}
        </div>
        <div className="mt-4 rounded-2xl bg-emerald-50 p-5"><h3 className="font-black text-emerald-950">পুষ্টি উপাদানের মোট চাহিদা (আপনার দেওয়া হার অনুযায়ী)</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><p className="rounded-xl bg-white p-3 text-sm">N: <strong>{moneyKg(results.n)}</strong></p><p className="rounded-xl bg-white p-3 text-sm">P₂O₅: <strong>{moneyKg(results.p)}</strong></p><p className="rounded-xl bg-white p-3 text-sm">K₂O: <strong>{moneyKg(results.k)}</strong></p></div></div>
      </section>

      <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>গুরুত্বপূর্ণ সতর্কতা:</strong> এটি কেবল আপনার দেওয়া সুপারিশ ও সার-লেবেলের শতাংশ থেকে গাণিতিক হিসাব। মাটির পরীক্ষা, ফসলের জাত, মৌসুম, জমির অবস্থা এবং স্থানীয় নির্দেশনা ছাড়া সার প্রয়োগ করবেন না। মাইক্রোনিউট্রিয়েন্ট, জৈব সার, অন্য NPK সার এবং একাধিক পণ্যে একই পুষ্টি উপাদান থাকলে এই সরল হিসাব পুরো পরিকল্পনা নয়। প্রয়োগের সময় ও ভাগ কৃষি কর্মকর্তার পরামর্শ অনুযায়ী ঠিক করুন।</aside>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/tools" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">অন্যান্য কৃষি টুলস</Link><a href="https://ais.gov.bd/" target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-900 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">কৃষি তথ্য সার্ভিস</a></div>
    </div>
  </main>;
}

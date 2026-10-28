"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CropEstimate = {
  id: string;
  name: string;
  costPerAcre: string;
  yieldKgPerAcre: string;
  pricePerKg: string;
};

const initialCrops: CropEstimate[] = [
  { id: "crop-1", name: "ধান", costPerAcre: "", yieldKgPerAcre: "", pricePerKg: "" },
  { id: "crop-2", name: "ভুট্টা", costPerAcre: "", yieldKgPerAcre: "", pricePerKg: "" },
  { id: "crop-3", name: "আলু", costPerAcre: "", yieldKgPerAcre: "", pricePerKg: "" },
];

const numberFormat = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });
const money = (value: number) => `৳${numberFormat.format(value)}`;
const asNumber = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; };
const safeProduct = (...values: number[]) => { const result = values.reduce((product, value) => product * value, 1); return Number.isFinite(result) ? result : 0; };
const safeDivide = (numerator: number, denominator: number) => { const result = numerator / denominator; return Number.isFinite(result) ? result : 0; };

export default function CropChoiceSimulator() {
  const [area, setArea] = useState("1");
  const [unit, setUnit] = useState("acre");
  const [crops, setCrops] = useState<CropEstimate[]>(initialCrops);
  const acres = safeProduct(asNumber(area), unit === "decimal" ? 0.01 : unit === "hectare" ? 2.47105 : 1);

  const results = useMemo(() => crops.map((crop) => {
    const cost = safeProduct(acres, asNumber(crop.costPerAcre));
    const yieldKg = safeProduct(acres, asNumber(crop.yieldKgPerAcre));
    const revenue = safeProduct(yieldKg, asNumber(crop.pricePerKg));
    const rawProfit = revenue - cost;
    const profit = Number.isFinite(rawProfit) ? rawProfit : 0;
    return { ...crop, cost, yieldKg, revenue, profit, breakEvenPrice: yieldKg > 0 ? safeDivide(cost, yieldKg) : 0 };
  }), [crops, acres]);

  const ranked = [...results].filter((crop) => crop.name.trim() && crop.costPerAcre !== "" && crop.yieldKgPerAcre !== "" && crop.pricePerKg !== "" && asNumber(crop.yieldKgPerAcre) > 0 && asNumber(crop.pricePerKg) > 0)
    .sort((a, b) => b.profit - a.profit);
  const updateCrop = (id: string, field: keyof CropEstimate, value: string) => {
    setCrops(current => current.map(crop => crop.id === id ? { ...crop, [field]: value } : crop));
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-emerald-800 hover:underline">← AGRIVA হোম</Link>
        <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">নতুন কৃষি টুল · Crop Choice Simulator</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">কোন ফসল চাষ করবেন? হিসাব মিলিয়ে দেখুন</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">আপনার এলাকার সম্ভাব্য খরচ, ফলন ও বিক্রির দাম বসিয়ে সর্বোচ্চ তিনটি ফসলের আয়, ব্যয়, সম্ভাব্য লাভ এবং লোকসান-সমতা মূল্য তুলনা করুন।</p>
        </header>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">১. জমির পরিমাণ দিন</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">জমির পরিমাণ
              <input type="number" min="0" step="any" value={area} onChange={event => setArea(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-bold text-slate-700">জমির একক
              <select value={unit} onChange={event => setUnit(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
                <option value="acre">একর</option><option value="decimal">শতক</option><option value="hectare">হেক্টর</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-500">হিসাবের জন্য জমির পরিমাণ প্রায় {numberFormat.format(acres)} একরে রূপান্তর করা হয়েছে।</p>
        </section>

        <section className="mt-6">
          <div className="mb-4"><h2 className="text-2xl font-black">২. প্রতিটি ফসলের আনুমানিক তথ্য দিন</h2><p className="mt-2 text-sm leading-6 text-slate-600">নিচের সব হার প্রতি একরের জন্য দিন। আপনার স্থানীয় অভিজ্ঞতা বা নির্ভরযোগ্য তথ্য ব্যবহার করুন।</p></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {crops.map((crop, index) => (
              <article key={crop.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 font-black text-emerald-900">{index + 1}</span><h3 className="text-lg font-black">ফসল {index + 1}</h3></div>
                <label className="mt-4 block text-sm font-bold text-slate-700">ফসলের নাম
                  <input value={crop.name} maxLength={60} onChange={event => updateCrop(crop.id, "name", event.target.value)} placeholder="যেমন: ধান" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="mt-4 block text-sm font-bold text-slate-700">প্রতি একরে মোট খরচ (টাকা)
                  <input type="number" min="0" step="any" value={crop.costPerAcre} onChange={event => updateCrop(crop.id, "costPerAcre", event.target.value)} placeholder="যেমন: ৩০০০০" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="mt-4 block text-sm font-bold text-slate-700">প্রতি একরে সম্ভাব্য ফলন (কেজি)
                  <input type="number" min="0" step="any" value={crop.yieldKgPerAcre} onChange={event => updateCrop(crop.id, "yieldKgPerAcre", event.target.value)} placeholder="যেমন: ২৫০০" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="mt-4 block text-sm font-bold text-slate-700">প্রতি কেজির সম্ভাব্য দাম (টাকা)
                  <input type="number" min="0" step="any" value={crop.pricePerKg} onChange={event => updateCrop(crop.id, "pricePerKg", event.target.value)} placeholder="যেমন: ৩৫" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">৩. তুলনামূলক ফলাফল</h2><p className="mt-2 text-sm text-slate-600">সব হিসাব আপনার দেওয়া অনুমানের ভিত্তিতে।</p></div><button type="button" onClick={() => setCrops(initialCrops.map(crop => ({ ...crop })))} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50">আবার শুরু করুন</button></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {results.map((crop) => (
              <article key={crop.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold text-slate-500">{crop.name.trim() || "নাম দেওয়া হয়নি"}</p>
                <p className={"mt-2 text-2xl font-black " + (crop.profit >= 0 ? "text-emerald-800" : "text-rose-700")}>{money(crop.profit)}</p>
                <p className="text-xs text-slate-500">সম্ভাব্য {crop.profit >= 0 ? "লাভ" : "লোকসান"}</p>
                <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">মোট খরচ</dt><dd className="font-bold">{money(crop.cost)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">সম্ভাব্য আয়</dt><dd className="font-bold">{money(crop.revenue)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">মোট ফলন</dt><dd className="font-bold">{numberFormat.format(crop.yieldKg)} কেজি</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">লোকসান-সমতা দাম</dt><dd className="font-bold">{crop.yieldKg > 0 ? money(crop.breakEvenPrice) + "/কেজি" : "ফলনের তথ্য দিন"}</dd></div></dl>
              </article>
            ))}
          </div>
          {ranked.length > 0 && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="font-black text-emerald-950">আপনার দেওয়া তথ্য অনুযায়ী</h3><p className="mt-2 text-sm leading-6 text-emerald-900">{ranked[0].name} ফসলটির আনুমানিক লাভ সবচেয়ে বেশি ({money(ranked[0].profit)})। এটি বাজারদর, আবহাওয়া, রোগ, ফলন ও খরচের পরিবর্তন সাপেক্ষে বদলাতে পারে—এটিকে নিশ্চিত সুপারিশ হিসেবে নেবেন না।</p></div>}
        </section>

        <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>গুরুত্বপূর্ণ:</strong> জমির ভাড়া, পরিবহন, সংরক্ষণ, ঋণের সুদ, ফসল নষ্ট হওয়া ও অন্যান্য খরচ হিসাবের মধ্যে না থাকলে ফলাফল কম-বেশি হতে পারে। স্থানীয় কৃষি কর্মকর্তার পরামর্শ ও বর্তমান বাজারদর যাচাই করে সিদ্ধান্ত নিন।</aside>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/tools" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">অন্যান্য কৃষি টুলস</Link><Link href="/market-prices" className="rounded-xl border border-emerald-900 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">বাজারদর যাচাই করুন</Link></div>
      </div>
    </main>
  );
}

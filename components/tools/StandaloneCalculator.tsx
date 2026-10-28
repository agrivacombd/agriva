"use client";

import { useEffect, useMemo, useState } from "react";

export type CalculatorKind = "fertilizer" | "seed" | "profit" | "calendar";
type Locale = "bn" | "en";

const copy = {
  bn: {
    home: "AGRIVA হোম", eyebrow: "ফ্রি কৃষি টুল", area: "জমির পরিমাণ", unit: "জমির একক", acre: "একর", hectare: "হেক্টর", decimal: "শতক",
    rate: "প্রতি একরে হার", kg: "কেজি", result: "আনুমানিক প্রয়োজনীয় পরিমাণ", note: "ফলাফল আপনার দেওয়া তথ্যের ভিত্তিতে গণনা করা হয়েছে। ফসল, জাত, মাটি ও স্থানীয় কৃষি নির্দেশনা অনুযায়ী হার যাচাই করুন।",
    seedRate: "প্রতি একরে বীজের হার", costSeed: "বীজের খরচ", costFertilizer: "সার ও উপকরণ", costLabor: "শ্রমিকের খরচ", costWater: "সেচের খরচ", costOther: "অন্যান্য খরচ",
    yield: "মোট উৎপাদন", price: "প্রতি কেজির বিক্রয়মূল্য", currency: "মুদ্রা", bdt: "বাংলাদেশি টাকা (BDT)", usd: "মার্কিন ডলার (USD)", inr: "ভারতীয় রুপি (INR)",
    totalCost: "মোট খরচ", revenue: "সম্ভাব্য বিক্রয় আয়", profit: "সম্ভাব্য লাভ", loss: "সম্ভাব্য লোকসান", checklist: "চাষের কাজের চেকলিস্ট", progress: "সম্পন্ন কাজ",
    tasks: ["জমি ও মাটির অবস্থা পর্যবেক্ষণ", "বিশ্বস্ত উৎস থেকে বীজ নির্বাচন", "জমি প্রস্তুত ও পানি নিষ্কাশনের ব্যবস্থা", "ফসলের নিয়মিত পর্যবেক্ষণ", "আগাছা ও রোগবালাই সমন্বিতভাবে ব্যবস্থাপনা", "ফসল কাটার উপযুক্ত সময় যাচাই"],
    disclaimer: "এটি পরিকল্পনার সহায়ক অনুমান, নিশ্চয়তা নয়। পরিবহন, জমির ভাড়া, ঋণের সুদ ও অন্যান্য খরচও হিসাবের মধ্যে রাখুন।",
  },
  en: {
    home: "AGRIVA home", eyebrow: "Free agriculture tool", area: "Land area", unit: "Area unit", acre: "Acres", hectare: "Hectares", decimal: "Decimals",
    rate: "Rate per acre", kg: "kg", result: "Estimated required amount", note: "Calculated from your inputs. Verify rates against the crop, variety, soil test and local agricultural guidance.",
    seedRate: "Seed rate per acre", costSeed: "Seed cost", costFertilizer: "Fertilizer and inputs", costLabor: "Labour cost", costWater: "Irrigation cost", costOther: "Other costs",
    yield: "Total yield", price: "Selling price per kg", currency: "Currency", bdt: "Bangladeshi taka (BDT)", usd: "US dollar (USD)", inr: "Indian rupee (INR)",
    totalCost: "Total cost", revenue: "Estimated revenue", profit: "Estimated profit", loss: "Estimated loss", checklist: "Crop task checklist", progress: "Tasks completed",
    tasks: ["Inspect land and soil conditions", "Choose seeds from a trusted source", "Prepare the field and drainage", "Monitor crop growth regularly", "Manage weeds and pests using an integrated approach", "Check the appropriate harvest time"],
    disclaimer: "This is a planning estimate, not a guarantee. Include transport, land rent, interest and any other relevant costs.",
  },
} as const;

const titles = {
  fertilizer: { bn: "সার হিসাব ক্যালকুলেটর", en: "Fertilizer Rate Calculator" },
  seed: { bn: "বীজের হার ক্যালকুলেটর", en: "Seed Rate Calculator" },
  profit: { bn: "চাষের খরচ ও লাভ-লোকসান ক্যালকুলেটর", en: "Farming Cost and Profit Calculator" },
  calendar: { bn: "ফসল ক্যালেন্ডার: কাজের চেকলিস্ট", en: "Crop Calendar and Task Checklist" },
};

const descriptions = {
  fertilizer: { bn: "জমির আয়তন ও আপনার নির্ধারিত সারের হার দিয়ে মোট প্রয়োজনীয় পরিমাণ হিসাব করুন।", en: "Estimate fertilizer quantity from your field area and the rate recommended for your crop." },
  seed: { bn: "জমির আয়তন ও বীজের হার দিয়ে আনুমানিক প্রয়োজনীয় বীজের পরিমাণ হিসাব করুন।", en: "Estimate seed quantity using your field area and the seed rate for your crop." },
  profit: { bn: "নিজের উৎপাদন, বিক্রয়মূল্য ও সব খরচ লিখে সম্ভাব্য লাভ বা লোকসান হিসাব করুন।", en: "Enter your yield, selling price and production costs to estimate profit or loss." },
  calendar: { bn: "মৌসুমের কাজগুলো চিহ্নিত করে অগ্রগতি অনুসরণ করুন।", en: "Track seasonal farm tasks and mark each step as complete." },
};

const moneyCodes = ["BDT", "USD", "INR"] as const;
type MoneyCode = typeof moneyCodes[number];

export default function StandaloneCalculator({ kind, locale }: { kind: CalculatorKind; locale: Locale }) {
  const t = copy[locale];
  const [area, setArea] = useState("1");
  const [areaUnit, setAreaUnit] = useState<"acre" | "hectare" | "decimal">("acre");
  const [rate, setRate] = useState(kind === "seed" ? "20" : "25");
  const [currency, setCurrency] = useState<MoneyCode>("BDT");
  const [costs, setCosts] = useState({ seed: "1500", fertilizer: "3000", labor: "2500", irrigation: "1000", other: "500" });
  const [yieldKg, setYieldKg] = useState("1200");
  const [pricePerKg, setPricePerKg] = useState("35");
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const taskStorageKey = "agriva-crop-checklist-v1";

  useEffect(() => {
    if (kind !== "calendar") return;
    try {
      const saved = window.localStorage.getItem(taskStorageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setCheckedTasks(parsed.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < t.tasks.length));
      }
    } catch {
      // Ignore unavailable or malformed local storage data.
    } finally {
      setTasksLoaded(true);
    }
  }, [kind, taskStorageKey, t.tasks.length]);

  useEffect(() => {
    if (kind !== "calendar" || !tasksLoaded) return;
    try { window.localStorage.setItem(taskStorageKey, JSON.stringify(checkedTasks)); } catch { /* Storage may be disabled. */ }
  }, [kind, taskStorageKey, checkedTasks, tasksLoaded]);

  const acres = Number(area || 0) * (areaUnit === "acre" ? 1 : areaUnit === "hectare" ? 2.47105 : 0.01);
  const totalRate = useMemo(() => Math.max(0, acres) * Math.max(0, Number(rate || 0)), [acres, rate]);
  const totalCost = Object.values(costs).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const revenue = Math.max(0, Number(yieldKg || 0)) * Math.max(0, Number(pricePerKg || 0));
  const net = revenue - totalCost;
  const number = (value: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 }).format(value);
  const money = (value: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  const areaUnitLabel = areaUnit === "acre" ? t.acre : areaUnit === "hectare" ? t.hectare : t.decimal;
  const isBn = locale === "bn";

  const field = (label: string, value: string, setValue: (next: string) => void, suffix: string, step = "any") => (
    <label className="block text-sm font-semibold text-slate-700">{label}
      <span className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-emerald-500">
        <input type="number" min="0" step={step} value={value} onChange={(event) => setValue(event.target.value)} className="w-full min-w-0 rounded-xl bg-transparent px-3 py-3 text-base font-medium outline-none" />
        <span className="whitespace-nowrap px-3 text-xs text-slate-500">{suffix}</span>
      </span>
    </label>
  );

  return (
    <main className="min-h-[70vh] bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 text-sm font-bold text-emerald-800"><a href={locale === "en" ? "/en/agriculture-calculators" : "/agriculture-calculators"} className="hover:underline">← {t.home}</a></div>
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">{t.eyebrow}</span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{titles[kind][locale]}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">{descriptions[kind][locale]}</p>
        </section>

        {kind === "calendar" ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black sm:text-2xl">{t.checklist}</h2><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-900">{t.progress}: {checkedTasks.length}/{t.tasks.length}</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: (checkedTasks.length / t.tasks.length * 100) + "%" }} /></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.tasks.map((task, index) => <label key={task} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-emerald-50"><input type="checkbox" checked={checkedTasks.includes(index)} onChange={(event) => setCheckedTasks((old) => event.target.checked ? [...old, index] : old.filter((n) => n !== index))} className="mt-1 h-4 w-4 accent-emerald-700" /><span className={"text-sm leading-6 " + (checkedTasks.includes(index) ? "text-slate-400 line-through" : "text-slate-700")}>{task}</span></label>)}
            </div>
            <button type="button" onClick={() => setCheckedTasks([])} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">{isBn ? "চেকলিস্ট রিসেট করুন" : "Reset checklist"}</button>
          </section>
        ) : kind === "fertilizer" || kind === "seed" ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {field(t.area, area, setArea, areaUnitLabel)}
              {field(kind === "seed" ? t.seedRate : t.rate, rate, setRate, t.kg)}
              <label className="block text-sm font-semibold text-slate-700">{t.unit}<select value={areaUnit} onChange={(event) => setAreaUnit(event.target.value as typeof areaUnit)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base"><option value="acre">{t.acre}</option><option value="hectare">{t.hectare}</option><option value="decimal">{t.decimal}</option></select></label>
            </div>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">{t.result}</p><p className="mt-1 text-3xl font-black text-emerald-950">{number(totalRate)} {t.kg}</p></div>
            <p className="mt-4 text-xs leading-6 text-amber-800">{t.note}</p>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-5 max-w-sm"><label className="block text-sm font-semibold text-slate-700">{t.currency}<select value={currency} onChange={(event) => setCurrency(event.target.value as MoneyCode)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base"><option value="BDT">{t.bdt}</option><option value="USD">{t.usd}</option><option value="INR">{t.inr}</option></select></label></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {field(t.costSeed, costs.seed, (value) => setCosts((old) => ({ ...old, seed: value })), currency)}
              {field(t.costFertilizer, costs.fertilizer, (value) => setCosts((old) => ({ ...old, fertilizer: value })), currency)}
              {field(t.costLabor, costs.labor, (value) => setCosts((old) => ({ ...old, labor: value })), currency)}
              {field(t.costWater, costs.irrigation, (value) => setCosts((old) => ({ ...old, irrigation: value })), currency)}
              {field(t.costOther, costs.other, (value) => setCosts((old) => ({ ...old, other: value })), currency)}
              {field(t.yield, yieldKg, setYieldKg, t.kg)}
              {field(t.price, pricePerKg, setPricePerKg, currency + "/" + t.kg)}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{t.totalCost}</p><p className="mt-1 text-xl font-black">{money(totalCost)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{t.revenue}</p><p className="mt-1 text-xl font-black">{money(revenue)}</p></div>
              <div className={"rounded-2xl p-4 " + (net >= 0 ? "bg-emerald-50" : "bg-rose-50")}><p className="text-sm text-slate-600">{net >= 0 ? t.profit : t.loss}</p><p className="mt-1 text-xl font-black">{money(Math.abs(net))}</p></div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">{t.disclaimer}</p>
          </section>
        )}
        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 sm:p-7">
          <h2 className="text-lg font-black">{isBn ? "হিসাব ব্যবহারের পরামর্শ" : "Using this calculator responsibly"}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{isBn ? "পরিকল্পনার জন্য একাধিক সম্ভাব্য পরিস্থিতি পরীক্ষা করুন। সার বা বীজের চূড়ান্ত হার নির্ধারণে মাটি পরীক্ষা, ফসলের জাত এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শকে অগ্রাধিকার দিন।" : "Try several scenarios for planning. For fertilizer or seed recommendations, prioritize soil-test results, crop variety guidance and advice from a qualified local agronomist."}</p>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

type Locale = "bn" | "en";
type ExtraTool = "soil" | "crop-choice";

const words = {
  bn: {
    soilTitle: "মাটি ও সার পরিকল্পনাকারী", soilDesc: "মাটি পরীক্ষা বা কৃষি কর্মকর্তার সুপারিশে পাওয়া প্রতি একরের পুষ্টি উপাদানের মাত্রা বসিয়ে জমির মোট হিসাব করুন।",
    cropTitle: "ফসল বাছাই ও লাভ তুলনা", cropDesc: "নিজের খরচ, ফলন ও বিক্রয়মূল্য দিয়ে একাধিক ফসলের সম্ভাব্য লাভ তুলনা করুন।",
    area: "জমির পরিমাণ", unit: "একক", acre: "একর", hectare: "হেক্টর", decimal: "শতক", perAcre: "প্রতি একরে", nitrogen: "নাইট্রোজেন (N)", phosphorus: "ফসফরাস (P₂O₅)", potassium: "পটাশ (K₂O)", kg: "কেজি",
    totalNutrients: "জমির জন্য মোট পুষ্টি উপাদান", note: "এটি কেবল আপনার দেওয়া মাটি পরীক্ষা বা সুপারিশের মাত্রা থেকে হিসাব। ফসল ও মাটির অবস্থা অনুযায়ী সারের সুপারিশ আলাদা হতে পারে।",
    currency: "মুদ্রা", bdt: "বাংলাদেশি টাকা (BDT)", usd: "মার্কিন ডলার (USD)", inr: "ভারতীয় রুপি (INR)", crop: "ফসল", cost: "প্রতি একরে খরচ", yield: "প্রতি একরে ফলন (কেজি)", price: "প্রতি কেজি দাম", totalCost: "মোট খরচ", revenue: "সম্ভাব্য আয়", net: "সম্ভাব্য লাভ/লোকসান", reset: "তথ্য রিসেট করুন",
    cropNames: ["ধান", "ভুট্টা", "আলু"], footer: "এটি একটি আনুমানিক তুলনা, নিশ্চিত ফলন বা বাজারদরের পূর্বাভাস নয়। পরিবহন, জমির ভাড়া, ঋণের সুদ ও অন্যান্য খরচ যোগ করুন।",
  },
  en: {
    soilTitle: "Soil and Fertilizer Planner", soilDesc: "Enter per-acre nutrient rates from a soil test or qualified local recommendation to estimate field totals.",
    cropTitle: "Crop Choice and Profit Comparison", cropDesc: "Compare potential crop returns using your own production costs, expected yields and selling prices.",
    area: "Land area", unit: "Unit", acre: "Acres", hectare: "Hectares", decimal: "Decimals", perAcre: "Per acre", nitrogen: "Nitrogen (N)", phosphorus: "Phosphorus (P₂O₅)", potassium: "Potash (K₂O)", kg: "kg",
    totalNutrients: "Total nutrient quantities for this field", note: "This only calculates rates you provide from a soil test or recommendation. Fertilizer needs vary by crop and soil conditions.",
    currency: "Currency", bdt: "Bangladeshi taka (BDT)", usd: "US dollar (USD)", inr: "Indian rupee (INR)", crop: "Crop", cost: "Cost per acre", yield: "Yield per acre (kg)", price: "Price per kg", totalCost: "Total cost", revenue: "Estimated revenue", net: "Estimated profit/loss", reset: "Reset values",
    cropNames: ["Rice", "Maize", "Potato"], footer: "This is an estimate, not a guaranteed yield or market-price forecast. Include transport, land rent, interest and other relevant costs.",
  },
} as const;

const fmt = (value: number, locale: Locale) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 }).format(value);

export default function InternationalExtraTools({ kind, locale }: { kind: ExtraTool; locale: Locale }) {
  const t = words[locale];
  const [area, setArea] = useState("1");
  const [unit, setUnit] = useState<"acre" | "hectare" | "decimal">("acre");
  const [nutrients, setNutrients] = useState({ nitrogen: "40", phosphorus: "20", potassium: "20" });
  const [currency, setCurrency] = useState<"BDT" | "USD" | "INR">("BDT");
  const [crops, setCrops] = useState(() => t.cropNames.map((name) => ({ name, cost: "", yieldKg: "", price: "" })));
  const acres = Math.max(0, Number(area || 0)) * (unit === "acre" ? 1 : unit === "hectare" ? 2.47105 : 0.01);
  const nutrientTotals = {
    nitrogen: acres * Math.max(0, Number(nutrients.nitrogen || 0)),
    phosphorus: acres * Math.max(0, Number(nutrients.phosphorus || 0)),
    potassium: acres * Math.max(0, Number(nutrients.potassium || 0)),
  };
  const results = useMemo(() => crops.map((crop) => {
    const cost = acres * Math.max(0, Number(crop.cost || 0));
    const revenue = acres * Math.max(0, Number(crop.yieldKg || 0)) * Math.max(0, Number(crop.price || 0));
    return { ...crop, cost, revenue, net: revenue - cost };
  }), [acres, crops]);
  const money = (value: number) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  const unitLabel = unit === "acre" ? t.acre : unit === "hectare" ? t.hectare : t.decimal;
  const field = (label: string, value: string, onChange: (value: string) => void, suffix: string) => <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-emerald-500"><input type="number" min="0" step="any" value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 rounded-xl bg-transparent px-3 py-3 text-base outline-none" /><span className="whitespace-nowrap px-3 text-xs text-slate-500">{suffix}</span></span></label>;

  return <main className="min-h-[70vh] bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12"><div className="mx-auto max-w-5xl">
    <div className="mb-5 text-sm font-bold text-emerald-800"><a href={locale === "en" ? "/en/agriculture-calculators" : "/agriculture-calculators"} className="hover:underline">← {locale === "en" ? "All agriculture calculators" : "সব কৃষি ক্যালকুলেটর"}</a></div>
    <section className="rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-emerald-100">{locale === "en" ? "AGRICULTURE PLANNING TOOL" : "কৃষি পরিকল্পনা টুল"}</p><h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{kind === "soil" ? t.soilTitle : t.cropTitle}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">{kind === "soil" ? t.soilDesc : t.cropDesc}</p></section>
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2"><div>{field(t.area, area, setArea, unitLabel)}</div><label className="block text-sm font-semibold text-slate-700">{t.unit}<select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base"><option value="acre">{t.acre}</option><option value="hectare">{t.hectare}</option><option value="decimal">{t.decimal}</option></select></label></div>
      {kind === "soil" ? <>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">{field(t.nitrogen, nutrients.nitrogen, (value) => setNutrients((old) => ({ ...old, nitrogen: value })), t.kg + "/" + t.perAcre)}{field(t.phosphorus, nutrients.phosphorus, (value) => setNutrients((old) => ({ ...old, phosphorus: value })), t.kg + "/" + t.perAcre)}{field(t.potassium, nutrients.potassium, (value) => setNutrients((old) => ({ ...old, potassium: value })), t.kg + "/" + t.perAcre)}</div>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-5"><h2 className="font-black">{t.totalNutrients}</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{[{ label: t.nitrogen, value: nutrientTotals.nitrogen }, { label: t.phosphorus, value: nutrientTotals.phosphorus }, { label: t.potassium, value: nutrientTotals.potassium }].map((item) => <div key={item.label} className="rounded-xl bg-white p-4"><p className="text-sm text-slate-600">{item.label}</p><p className="mt-1 text-xl font-black">{fmt(item.value, locale)} {t.kg}</p></div>)}</div></div><p className="mt-4 text-xs leading-6 text-amber-800">{t.note}</p>
      </> : <>
        <div className="mt-5 max-w-sm"><label className="block text-sm font-semibold text-slate-700">{t.currency}<select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base"><option value="BDT">{t.bdt}</option><option value="USD">{t.usd}</option><option value="INR">{t.inr}</option></select></label></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">{crops.map((crop, index) => <fieldset key={index} className="rounded-2xl border border-emerald-100 p-4"><legend className="px-2 font-black">{crop.name}</legend><div className="grid gap-3">{field(t.cost, crop.cost, (value) => setCrops((old) => old.map((item, i) => i === index ? { ...item, cost: value } : item)), currency + "/" + t.perAcre)}{field(t.yield, crop.yieldKg, (value) => setCrops((old) => old.map((item, i) => i === index ? { ...item, yieldKg: value } : item)), t.kg)}{field(t.price, crop.price, (value) => setCrops((old) => old.map((item, i) => i === index ? { ...item, price: value } : item)), currency + "/" + t.kg)}</div></fieldset>)}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{results.map((result) => <article key={result.name} className="rounded-2xl bg-slate-50 p-4"><h2 className="font-black">{result.name}</h2><p className="mt-2 text-sm text-slate-600">{t.totalCost}: {money(result.cost)}</p><p className="mt-1 text-sm text-slate-600">{t.revenue}: {money(result.revenue)}</p><p className={"mt-2 text-lg font-black " + (result.net >= 0 ? "text-emerald-800" : "text-rose-700")}>{t.net}: {money(result.net)}</p></article>)}</div>
      </>}
      <p className="mt-5 text-xs leading-6 text-slate-500">{t.footer}</p><button type="button" onClick={() => { setArea("1"); setUnit("acre"); setNutrients({ nitrogen: "40", phosphorus: "20", potassium: "20" }); setCurrency("BDT"); setCrops(t.cropNames.map((name) => ({ name, cost: "", yieldKg: "", price: "" }))); }} className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">{t.reset}</button>
    </section>
  </div></main>;
}

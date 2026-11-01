"use client";

import { useMemo, useState } from "react";

type Unit = "sqft" | "decimal" | "katha" | "bigha" | "acre" | "hectare";
const UNITS: { value: Unit; label: string; factor: number }[] = [
  { value: "sqft", label: "বর্গফুট", factor: 1 },
  { value: "decimal", label: "শতাংশ / ডেসিমেল", factor: 435.6 },
  { value: "katha", label: "কাঠা", factor: 720 },
  { value: "bigha", label: "বিঘা", factor: 14400 },
  { value: "acre", label: "একর", factor: 43560 },
  { value: "hectare", label: "হেক্টর", factor: 107639.104167 },
];
const numberFormat = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 4 });
const englishNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

export default function LandCalculatorClient() {
  const [mode, setMode] = useState<"convert" | "rectangle" | "price">("convert");
  const [amount, setAmount] = useState("5");
  const [unit, setUnit] = useState<Unit>("decimal");
  const [length, setLength] = useState("100");
  const [width, setWidth] = useState("50");
  const [dimensionUnit, setDimensionUnit] = useState<"ft" | "m">("ft");
  const [rate, setRate] = useState("250000");
  const [rateUnit, setRateUnit] = useState<Unit>("decimal");
  const [copied, setCopied] = useState(false);

  const squareFeet = useMemo(() => {
    if (mode === "rectangle") {
      const l = Number(length);
      const w = Number(width);
      if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return 0;
      const sqm = l * w * (dimensionUnit === "m" ? 10.7639104167 : 1);
      return sqm;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n * (UNITS.find((u) => u.value === unit)?.factor ?? 1);
  }, [mode, amount, unit, length, width, dimensionUnit]);

  const results = useMemo(
    () => UNITS.map((u) => ({ ...u, value: squareFeet / u.factor })),
    [squareFeet],
  );
  const totalPrice = useMemo(() => {
    const perUnit = Number(rate);
    const factor = UNITS.find((u) => u.value === rateUnit)?.factor ?? 1;
    if (!Number.isFinite(perUnit) || perUnit < 0) return null;
    return (squareFeet / factor) * perUnit;
  }, [squareFeet, rate, rateUnit]);

  const valid = squareFeet > 0 && Number.isFinite(squareFeet);
  const copyResult = async () => {
    if (!valid) return;
    const text = [
      "AGRIVA — জমির হিসাব",
      ...results.map((r) => `${r.label}: ${englishNumber.format(r.value)}`),
      mode === "price" && totalPrice !== null ? `আনুমানিক মূল্য: ৳${englishNumber.format(totalPrice)}` : "",
      "দ্রষ্টব্য: অঞ্চলভেদে কাঠা ও বিঘার মাপ ভিন্ন হতে পারে।",
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-7">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="হিসাবের ধরন">
          {[
            ["convert", "একক রূপান্তর"],
            ["rectangle", "দৈর্ঘ্য × প্রস্থ"],
            ["price", "জমির মূল্য"],
          ].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key as typeof mode)}
              className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${mode === key ? "bg-emerald-800 text-white shadow-sm" : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"}`}>
              {label}
            </button>
          ))}
        </div>

        {mode === "convert" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr]">
            <label className="block text-sm font-bold text-slate-700">জমির পরিমাণ
              <input inputMode="decimal" type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" placeholder="যেমন ৫" />
            </label>
            <label className="block text-sm font-bold text-slate-700">যে এককে পরিমাণ দিয়েছেন
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </label>
          </div>
        )}

        {mode === "rectangle" && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">জমির দৈর্ঘ্য
                <input inputMode="decimal" type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="block text-sm font-bold text-slate-700">জমির প্রস্থ
                <input inputMode="decimal" type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
              </label>
            </div>
            <label className="block text-sm font-bold text-slate-700">দৈর্ঘ্য ও প্রস্থের একক
              <select value={dimensionUnit} onChange={(e) => setDimensionUnit(e.target.value as "ft" | "m")} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:max-w-xs">
                <option value="ft">ফুট</option><option value="m">মিটার</option>
              </select>
            </label>
          </div>
        )}

        {mode === "price" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">জমির পরিমাণ
              <input inputMode="decimal" type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-bold text-slate-700">পরিমাণের একক
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">প্রতি এককের দাম (টাকা)
              <input inputMode="decimal" type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-bold text-slate-700">দামের একক
              <select value={rateUnit} onChange={(e) => setRateUnit(e.target.value as Unit)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </label>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-emerald-950">হিসাবের ফলাফল</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">লাইভ হিসাব</span>
          </div>
          {valid ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {results.map((r) => (
                  <div key={r.value + r.label} className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-500">{r.label}</p>
                    <p className="mt-1 break-all text-lg font-black text-emerald-900">{numberFormat.format(r.value)}</p>
                  </div>
                ))}
              </div>
              {mode === "price" && totalPrice !== null && (
                <div className="mt-3 rounded-xl bg-emerald-900 p-4 text-white">
                  <p className="text-sm text-emerald-100">আনুমানিক মোট জমির মূল্য</p>
                  <p className="mt-1 text-2xl font-black">৳{numberFormat.format(totalPrice)}</p>
                </div>
              )}
              <button type="button" onClick={copyResult} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-800 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-white">
                {copied ? "কপি হয়েছে ✓" : "ফলাফল কপি করুন"}
              </button>
            </>
          ) : <p className="mt-3 text-sm text-rose-700">সঠিক ও শূন্যের চেয়ে বড় পরিমাণ লিখুন।</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-900">বাংলাদেশে প্রচলিত জমির একক</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">এই ক্যালকুলেটরে প্রচলিত একটি সাধারণ রূপান্তর ধরা হয়েছে: ১ শতাংশ = ৪৩৫.৬ বর্গফুট, ১ কাঠা = ৭২০ বর্গফুট, ১ বিঘা = ১৪,৪০০ বর্গফুট এবং ১ একর = ৪৩,৫৬০ বর্গফুট।</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">কাঠা ও বিঘার মাপ অঞ্চল, দলিল বা স্থানীয় রীতি অনুযায়ী ভিন্ন হতে পারে। জমি কেনাবেচা বা দলিলের কাজে স্থানীয় ভূমি অফিস/সার্ভেয়ারের নির্ধারিত মাপ যাচাই করুন।</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-900">কীভাবে জমির ক্ষেত্রফল হিসাব করবেন?</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">আয়তাকার জমির ক্ষেত্রে দৈর্ঘ্য ও প্রস্থ একই এককে নিয়ে গুণ করলে বর্গফুট বা বর্গমিটারে ক্ষেত্রফল পাওয়া যায়। এরপর একক রূপান্তর ট্যাব ব্যবহার করে শতাংশ, কাঠা, বিঘা বা একরে ফলাফল দেখুন।</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">অনিয়মিত আকৃতির জমি হলে একাধিক সহজ আকৃতিতে ভাগ করে প্রতিটির ক্ষেত্রফল যোগ করুন অথবা একজন দক্ষ সার্ভেয়ারের সাহায্য নিন।</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-900">সাধারণ প্রশ্ন ও উত্তর</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {[
            ["১ শতাংশ জমি কত বর্গফুট?", "১ শতাংশ বা ডেসিমেল = ৪৩৫.৬ বর্গফুট।"],
            ["১ কাঠা কত শতাংশ?", "এই ক্যালকুলেটরের প্রচলিত ৭২০ বর্গফুট মান অনুযায়ী ১ কাঠা প্রায় ১.৬৫৩ শতাংশ।"],
            ["১ বিঘা কত শতাংশ?", "১৪,৪০০ বর্গফুটকে ৪৩৫.৬ দিয়ে ভাগ করলে প্রায় ৩৩.০৬ শতাংশ হয়। স্থানীয় বিঘার মাপ ভিন্ন হতে পারে।"],
            ["জমির দাম কীভাবে হিসাব করব?", "জমির মোট পরিমাণ ও প্রতি এককের দাম দিন। ক্যালকুলেটর আনুমানিক মোট মূল্য দেখাবে।"],
            ["এই ফলাফল কি দলিলের জন্য চূড়ান্ত?", "না। এটি সাধারণ হিসাবের সহায়ক টুল। দলিল, রেজিস্ট্রি বা সীমানা নির্ধারণের আগে সরকারি/স্থানীয় মাপ যাচাই করুন।"],
          ].map(([q, a]) => <details key={q} className="py-3"><summary className="cursor-pointer font-bold text-slate-800">{q}</summary><p className="mt-2 text-sm leading-6 text-slate-600">{a}</p></details>)}
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Diagnosis = {
  crop: string;
  disease: string;
  confidence: "low" | "medium" | "high";
  confidenceNote: string;
  symptoms: string[];
  possibleCauses: string[];
  immediateActions: string[];
  prevention: string[];
  whenToSeekHelp: string;
  disclaimer: string;
};

type HistoryItem = {
  id: string;
  crop: string;
  location: string | null;
  symptoms: string | null;
  diagnosis: Diagnosis;
  created_at: string;
};

const crops = [
  { value: "ধান", label: "ধান" },
  { value: "টমেটো", label: "টমেটো" },
  { value: "আলু", label: "আলু" },
  { value: "বেগুন", label: "বেগুন" },
  { value: "মরিচ", label: "মরিচ" },
  { value: "পাট", label: "পাট" },
  { value: "গম", label: "গম" },
  { value: "ভুট্টা", label: "ভুট্টা" },
  { value: "আম", label: "আম" },
  { value: "অন্যান্য", label: "অন্যান্য" },
];

function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidenceLabel = diagnosis.confidence === "high" ? "তুলনামূলক বেশি" : diagnosis.confidence === "medium" ? "মাঝারি" : "কম / অনিশ্চিত";
  const sections = [
    { title: "ছবিতে দেখা লক্ষণ", items: diagnosis.symptoms },
    { title: "সম্ভাব্য কারণ", items: diagnosis.possibleCauses },
    { title: "এখন যা করতে পারেন", items: diagnosis.immediateActions },
    { title: "প্রতিরোধের উপায়", items: diagnosis.prevention },
  ];
  return (
    <article className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-700">{diagnosis.crop}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">{diagnosis.disease}</h2>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">নিশ্চয়তা: {confidenceLabel}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{diagnosis.confidenceNote}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-extrabold text-slate-900">{section.title}</h3>
            {section.items.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{section.items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">নির্ভরযোগ্যভাবে শনাক্ত করা যায়নি।</p>}
          </section>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-extrabold text-amber-950">কখন বিশেষজ্ঞের সাহায্য নেবেন</h3>
        <p className="mt-1 text-sm leading-6 text-amber-900">{diagnosis.whenToSeekHelp}</p>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{diagnosis.disclaimer} কীটনাশক প্রয়োগের আগে স্থানীয় কৃষি কর্মকর্তা বা উপযুক্ত বিশেষজ্ঞের পরামর্শ নিন।</p>
    </article>
  );
}

export default function CropDiseasePanel() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState("ধান");
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyMessage, setHistoryMessage] = useState("আপনার আগের বিশ্লেষণ দেখতে লগইন করুন।");

  useEffect(() => {
    let active = true;
    fetch("/api/crop-disease", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (response.ok) {
          setHistory(data.history || []);
          setHistoryMessage(data.history?.length ? "" : "এখনো কোনো সংরক্ষিত বিশ্লেষণ নেই।");
        } else {
          setHistoryMessage(data.error || "ইতিহাস লোড করা যায়নি।");
        }
      })
      .catch(() => { if (active) setHistoryMessage("ইতিহাস লোড করতে ইন্টারনেট সংযোগ পরীক্ষা করুন।"); });
    return () => { active = false; };
  }, []);

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null;
    setError("");
    setResult(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!next) {
      setPhoto(null);
      setPreview("");
      return;
    }
    setPhoto(next);
    setPreview(URL.createObjectURL(next));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.set("photo", photo);
      form.set("crop", crop);
      form.set("location", location);
      form.set("symptoms", symptoms);
      const response = await fetch("/api/crop-disease", { method: "POST", body: form, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ছবি বিশ্লেষণ করা যায়নি।");
      setResult(data.result);
      setHistory((current) => [data.result, ...current.filter((item) => item.id !== data.result.id)].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ছবি বিশ্লেষণ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5faf6] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলস</Link>
        <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white sm:p-10">
          <p className="text-sm font-bold text-emerald-200">AGRIVA · AI কৃষি সহায়তা</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">ছবি দিয়ে ফসলের রোগ বিশ্লেষণ</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">পাতা, কাণ্ড বা ফলের পরিষ্কার ছবি দিন। AI সম্ভাব্য লক্ষণ ও সতর্ক করণীয় সাজিয়ে দেবে। ফলাফল প্রাথমিক ধারণা—নিশ্চিত রোগ নির্ণয় নয়।</p>
        </header>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="crop" className="mb-2 block text-sm font-bold text-slate-800">ফসলের নাম</label>
                <select id="crop" value={crop} onChange={(event) => setCrop(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" required>
                  {crops.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <label htmlFor="location" className="mb-2 mt-4 block text-sm font-bold text-slate-800">জেলা / এলাকা (ঐচ্ছিক)</label>
                <input id="location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="যেমন: নওগাঁ" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
                <label htmlFor="symptoms" className="mb-2 mt-4 block text-sm font-bold text-slate-800">আপনি কী লক্ষণ দেখছেন? (ঐচ্ছিক)</label>
                <textarea id="symptoms" value={symptoms} onChange={(event) => setSymptoms(event.target.value)} maxLength={1000} rows={4} placeholder="যেমন: পাতায় বাদামি দাগ, পাতা হলুদ হয়ে যাচ্ছে..." className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              </div>
              <div>
                <label htmlFor="photo" className="mb-2 block text-sm font-bold text-slate-800">ফসলের ছবি (JPG, PNG বা WebP; সর্বোচ্চ ৫ MB)</label>
                <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} required className="block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-900" />
                {preview ? <img src={preview} alt="আপলোডের জন্য নির্বাচিত ফসলের ছবি" className="mt-3 max-h-72 w-full rounded-2xl border border-slate-200 object-contain" /> : <div className="mt-3 grid min-h-52 place-items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-5 text-center text-sm leading-6 text-emerald-900">পরিষ্কার আলোতে আক্রান্ত অংশের কাছ থেকে ছবি তুলুন। সম্ভব হলে পুরো গাছ ও আক্রান্ত অংশের আলাদা ছবি তুলুন—প্রতিবার একটি ছবি বিশ্লেষণ করা যাবে।</div>}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">ব্যক্তিগত ছবি ও বিশ্লেষণের ইতিহাস আপনার লগইন করা অ্যাকাউন্টে সংরক্ষিত হয়। ছবি বিশ্লেষণের আগে লগইন প্রয়োজন; Gemini API key এবং Supabase migration কনফিগার না থাকলে সেবা চলবে না।</div>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error} {error.includes("লগইন") || error.includes("লগ ইন") ? <Link href="/login" className="font-bold underline">লগইন করুন</Link> : null}</p>}
            <button type="submit" disabled={!photo || busy} className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-extrabold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "ছবি বিশ্লেষণ হচ্ছে..." : "ছবি বিশ্লেষণ করুন"}</button>
          </form>
        </section>

        {result && <section className="mt-6"><div className="mb-3 flex items-center gap-2"><span aria-hidden="true">🔎</span><h2 className="text-xl font-black">বিশ্লেষণের ফলাফল</h2></div><DiagnosisCard diagnosis={result.diagnosis} /></section>}

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-bold text-emerald-700">ব্যক্তিগত ইতিহাস</p><h2 className="mt-1 text-2xl font-black">সাম্প্রতিক বিশ্লেষণ</h2></div>
            <Link href="/login" className="text-sm font-bold text-emerald-800 underline underline-offset-4">অ্যাকাউন্টে লগইন</Link>
          </div>
          {historyMessage && <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{historyMessage}</p>}
          <div className="mt-4 space-y-3">
            {history.map((item) => <details key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-inside font-bold text-slate-900">{item.crop} · {item.diagnosis?.disease || "বিশ্লেষণ"} <span className="ml-2 text-xs font-medium text-slate-500">{new Date(item.created_at).toLocaleDateString("bn-BD")}</span></summary>
              <div className="mt-4"><DiagnosisCard diagnosis={item.diagnosis} /></div>
              {item.location && <p className="mt-2 text-xs text-slate-500">এলাকা: {item.location}</p>}
            </details>)}
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-6 text-slate-500">AI-র ফলাফল ভুল হতে পারে এবং ছবি দেখে সব রোগ আলাদা করা যায় না। অজানা বা ছড়িয়ে পড়া রোগে উপজেলা কৃষি অফিস / স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।</p>
      </div>
    </main>
  );
}

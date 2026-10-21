"use client";

import { useEffect, useState } from "react";

const crops: Record<string, { season: string; tasks: string[] }> = {
  "ধান": { season: "জাত ও মৌসুম অনুযায়ী সময় বদলায়", tasks: ["জমি ও পানি নিষ্কাশন ব্যবস্থা পরীক্ষা", "মানসম্মত বীজ ও উপযুক্ত জাত নির্বাচন", "জমি প্রস্তুতি এবং বপন/রোপণের পরিকল্পনা", "নিয়মিত পানি ও আগাছা ব্যবস্থাপনা", "রোগবালাই নিয়মিত পর্যবেক্ষণ", "পরিপক্বতা যাচাই করে ফসল কাটার পরিকল্পনা"] },
  "গম": { season: "স্থানীয় আবহাওয়া ও জাত অনুযায়ী সময় বদলায়", tasks: ["জমি ও মাটির অবস্থা পরীক্ষা", "উপযুক্ত জাত ও মানসম্মত বীজ নির্বাচন", "স্থানীয় নির্দেশনা অনুযায়ী বপনের পরিকল্পনা", "আগাছা ও আর্দ্রতা পর্যবেক্ষণ", "রোগবালাই নিয়মিত পর্যবেক্ষণ", "শস্য পরিপক্ব হলে কাটার প্রস্তুতি"] },
  "সবজি": { season: "প্রজাতি ও এলাকার ওপর নির্ভরশীল", tasks: ["সবজির প্রজাতি ও মৌসুম নির্বাচন", "বীজতলা/চারা ও জমি প্রস্তুত", "সেচ ও পানি নিষ্কাশনের ব্যবস্থা", "নিয়মিত পোকা ও রোগ পর্যবেক্ষণ", "প্রয়োজনে সমন্বিত বালাই ব্যবস্থাপনা", "পরিপক্বতা অনুযায়ী সংগ্রহ ও বাজার পরিকল্পনা"] },
  "আলু": { season: "জাত ও এলাকার ওপর নির্ভরশীল", tasks: ["মাটি ও জমির নিষ্কাশন যাচাই", "রোগমুক্ত বীজ আলু নির্বাচন", "স্থানীয় নির্দেশনা অনুযায়ী রোপণের পরিকল্পনা", "মাটির আর্দ্রতা ও গাছ পর্যবেক্ষণ", "রোগবালাই ও গাছের স্বাস্থ্য পর্যবেক্ষণ", "পরিপক্বতা ও সংরক্ষণ পরিকল্পনা"] },
};

export default function CropCalendarPanel() {
  const [crop, setCrop] = useState("ধান");
  const [startDate, setStartDate] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const tasks = crops[crop].tasks;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agriva-crop-calendar-v1");
      if (raw) {
        const data = JSON.parse(raw) as { crop?: string; startDate?: string; completed?: string[] };
        if (data.crop && crops[data.crop]) setCrop(data.crop);
        if (data.startDate) setStartDate(data.startDate);
        if (Array.isArray(data.completed)) setCompleted(data.completed);
      }
    } catch { /* Ignore invalid local browser data. */ }
  }, []);

  useEffect(() => {
    if (!saved) return;
    try { localStorage.setItem("agriva-crop-calendar-v1", JSON.stringify({ crop, startDate, completed })); } catch { /* Saving may be disabled by browser settings. */ }
  }, [crop, startDate, completed, saved]);

  function toggleTask(task: string, checked: boolean) {
    setCompleted((old) => checked ? [...new Set([...old, task])] : old.filter((item) => item !== task));
    setSaved(true);
  }

  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12"><div className="mx-auto max-w-4xl">
    <a href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলবক্সে ফিরুন</a>
    <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-950 to-teal-700 p-7 text-white sm:p-10"><p className="text-sm font-bold text-emerald-200">পরিকল্পনা ও রিমাইন্ডার</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">আমার ফসল ক্যালেন্ডার</h1><p className="mt-4 text-sm leading-7 text-emerald-50">ফসলের কাজের তালিকা তৈরি করুন, কাজ শেষ হলে টিক দিন। তালিকাটি এই ব্রাউজারে সংরক্ষিত থাকবে।</p></header>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">ফসল নির্বাচন করুন<select value={crop} onChange={(e) => { setCrop(e.target.value); setCompleted([]); setSaved(true); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base">{Object.keys(crops).map((name) => <option key={name}>{name}</option>)}</select></label><label className="text-sm font-bold text-slate-700">চাষ শুরু/রোপণের তারিখ<input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setSaved(true); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base" /></label></div>
      <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">সময়কাল: {crops[crop].season}. কাজের সঠিক সময় ফসলের জাত, আবহাওয়া ও স্থানীয় কৃষি পরামর্শ অনুযায়ী ঠিক করুন।</p>
      <div className="mt-6 flex items-center justify-between gap-3"><h2 className="text-xl font-black">কাজের তালিকা</h2><span className="text-sm font-bold text-emerald-800">{completed.filter((task) => tasks.includes(task)).length}/{tasks.length} সম্পন্ন</span></div>
      <div className="mt-3 space-y-3">{tasks.map((task) => <label key={task} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-4 hover:bg-emerald-50"><input type="checkbox" checked={completed.includes(task)} onChange={(e) => toggleTask(task, e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span className={"text-sm leading-6 " + (completed.includes(task) ? "text-slate-400 line-through" : "text-slate-700")}>{task}</span></label>)}</div>
      {saved && <p className="mt-4 text-xs font-semibold text-emerald-800">এই ব্রাউজারে সংরক্ষণের চেষ্টা করা হয়েছে।</p>}
      <button onClick={() => { setCompleted([]); setSaved(true); }} className="mt-5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">চেকলিস্ট রিসেট করুন</button>
    </section>
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-extrabold text-amber-950">নোটিফিকেশন সম্পর্কে</h2><p className="mt-2 text-sm leading-6 text-amber-900">এটি আপাতত ব্রাউজারে সংরক্ষিত চেকলিস্ট—ফোনে স্বয়ংক্রিয় নোটিফিকেশন পাঠায় না। সময়সূচি স্থানীয় কৃষি নির্দেশনা অনুযায়ী সাজান।</p></section>
  </div></main>;
}

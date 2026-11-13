"use client";

import Link from "next/link";
import CropShareCardMaker from "./CropShareCardMaker";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Diagnosis = {
  crop: string;
  disease: string;
  confidence: "low" | "medium" | "high";
  confidenceNote: string;
  imageQuality?: "good" | "limited" | "unusable";
  imageQualityNote?: string;
  alternativeDiagnoses?: string[];
  followUpQuestions?: string[];
  needsMorePhotos?: boolean;
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

const districts = ["ঢাকা","ফরিদপুর","গাজীপুর","গোপালগঞ্জ","কিশোরগঞ্জ","মাদারীপুর","মানিকগঞ্জ","মুন্সীগঞ্জ","নারায়ণগঞ্জ","নরসিংদী","রাজবাড়ী","শরীয়তপুর","টাঙ্গাইল","চট্টগ্রাম","কক্সবাজার","কুমিল্লা","ব্রাহ্মণবাড়িয়া","চাঁদপুর","ফেনী","নোয়াখালী","লক্ষ্মীপুর","খাগড়াছড়ি","রাঙ্গামাটি","বান্দরবান","রাজশাহী","নওগাঁ","নাটোর","চাঁপাইনবাবগঞ্জ","পাবনা","সিরাজগঞ্জ","বগুড়া","জয়পুরহাট","খুলনা","বাগেরহাট","সাতক্ষীরা","যশোর","ঝিনাইদহ","মাগুরা","নড়াইল","কুষ্টিয়া","চুয়াডাঙ্গা","মেহেরপুর","বরিশাল","ভোলা","পটুয়াখালী","পিরোজপুর","ঝালকাঠি","বরগুনা","সিলেট","সুনামগঞ্জ","হবিগঞ্জ","মৌলভীবাজার","রংপুর","দিনাজপুর","ঠাকুরগাঁও","পঞ্চগড়","নীলফামারী","লালমনিরহাট","কুড়িগ্রাম","গাইবান্ধা","ময়মনসিংহ","জামালপুর","শেরপুর","নেত্রকোণা"];

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
      {diagnosis.imageQuality && <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-slate-700">
        <h3 className="font-extrabold text-slate-900">ছবির মান ও বিশ্লেষণের সীমাবদ্ধতা</h3>
        <p className="mt-1">{diagnosis.imageQuality === "good" ? "ছবির দৃশ্যমান তথ্য তুলনামূলক স্পষ্ট।" : diagnosis.imageQuality === "limited" ? "ছবির কিছু গুরুত্বপূর্ণ অংশ স্পষ্ট নয়।" : "এই ছবি থেকে নির্ভরযোগ্যভাবে রোগ শনাক্ত করা যাচ্ছে না।"} {diagnosis.imageQualityNote}</p>
        {diagnosis.needsMorePhotos && <p className="mt-2 font-semibold text-sky-900">আরও ভালো ফলের জন্য আক্রান্ত অংশের কাছ থেকে এবং পুরো গাছের আলাদা পরিষ্কার ছবি দিয়ে আবার বিশ্লেষণ করুন।</p>}
      </div>}
      {!!diagnosis.alternativeDiagnoses?.length && <section className="mt-4 rounded-2xl border border-slate-200 p-4">
        <h3 className="font-extrabold text-slate-900">অন্যান্য সম্ভাবনা (নিশ্চিত নয়)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{diagnosis.alternativeDiagnoses.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </section>}
      {!!diagnosis.followUpQuestions?.length && <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <h3 className="font-extrabold text-emerald-950">আরও নির্ভুল বিশ্লেষণের জন্য যা জানা প্রয়োজন</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{diagnosis.followUpQuestions.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </section>}
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

type FeedEntry = { id: string; slug: string; displayName: string; crop: string; district: string | null; disease: string; confidence: string; publishedAt: string; imageUrl: string | null };

function CropHealthFeed({ history }: { history: HistoryItem[] }) {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [ownPublishedIds, setOwnPublishedIds] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    const response = await fetch("/api/crop-health-feed", { cache: "no-store" });
    if (response.ok) { const data = await response.json(); setFeed(data.feed || []); setOwnPublishedIds(data.ownPublishedDetectionIds || []); }
    else setMessage("পাবলিক ফিড লোড করা যায়নি।");
  }
  useEffect(() => { void refresh(); fetch("/api/crop-health-feed/profile", { cache: "no-store" }).then(async response => { if (response.ok) { const data = await response.json(); setDisplayName(data.displayName || ""); } }).catch(() => {}); }, []);
  async function publish() {
    if (!consent || !selectedId || displayName.trim().length < 2 || pending) return;
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/crop-health-feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ detectionId: selectedId, consent: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "প্রকাশ করা যায়নি।");
      setMessage("আপনার অনুমোদিত বিশ্লেষণ ফিডে প্রকাশিত হয়েছে।");
      setConsent(false); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "প্রকাশ করা যায়নি।"); }
    finally { setPending(false); }
  }
  async function unpublish(detectionId: string) {
    if (pending || !window.confirm("এই বিশ্লেষণ ও প্রকাশিত ছবি পাবলিক ফিড থেকে সরাতে চান?")) return;
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/crop-health-feed", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ detectionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "সরানো যায়নি।");
      setMessage("প্রকাশনা সরানো হয়েছে। আপনার ব্যক্তিগত ইতিহাস অক্ষত আছে।"); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "সরানো যায়নি।"); }
    finally { setPending(false); }
  }
  return <section className="mt-10" aria-label="AGRIVA Crop Health Feed">
    <p className="text-sm font-bold text-emerald-700">AGRIVA Crop Health Feed</p>
    <h2 className="mt-1 text-2xl font-black">কৃষকদের অনুমোদিত সাম্প্রতিক বিশ্লেষণ</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">শুধু ব্যবহারকারীর স্বেচ্ছায় প্রকাশ করা নাম, ছবি ও AI-এর সম্ভাব্য ফলাফল এখানে দেখানো হয়। এগুলো নিশ্চিত রোগ নির্ণয় নয়।</p>
    {!!history.length && <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
      <h3 className="font-extrabold">আপনার বিশ্লেষণ স্বেচ্ছায় শেয়ার করুন</h3>
      <p className="mt-1 text-xs leading-5 text-slate-600">শেয়ার না করলে সবকিছু ব্যক্তিগত থাকবে। শেয়ার করলে আপনার AGRIVA অ্যাকাউন্টের নাম, প্রথম ছবি, ফসল, জেলা, সম্ভাব্য রোগ ও তারিখ সবাই দেখতে পারবেন। আপনার অ্যাকাউন্ট, ফোন, ইমেইল ও ব্যক্তিগত লক্ষণের বিবরণ প্রকাশ হবে না।</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="text-sm font-semibold">অ্যাকাউন্টের নাম (স্বয়ংক্রিয়)<p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal">{displayName || "প্রোফাইলে নাম পাওয়া যায়নি"}</p></div>
        <label className="text-sm font-semibold">বিশ্লেষণ নির্বাচন করুন<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">একটি বিশ্লেষণ নির্বাচন করুন</option>{history.map((item) => <option key={item.id} value={item.id}>{item.crop} · {new Date(item.created_at).toLocaleDateString("bn-BD")}</option>)}</select></label>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" /><span>আমি স্বেচ্ছায় নির্বাচিত বিশ্লেষণের অ্যাকাউন্টের নাম, প্রথম ছবি ও সংক্ষিপ্ত ফলাফল সবার জন্য প্রকাশের অনুমতি দিচ্ছি। পরে প্রকাশনা সরাতে পারব।</span></label>
      <button type="button" disabled={!consent || !selectedId || displayName.trim().length < 2 || pending} onClick={publish} className="mt-3 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-50">{pending ? "অপেক্ষা করুন..." : "অনুমতি দিয়ে প্রকাশ করুন"}</button>
      {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
      <div className="mt-3 space-y-2">{history.filter((item) => ownPublishedIds.includes(item.id)).map((item) => <button type="button" key={item.id} disabled={pending} onClick={() => unpublish(item.id)} className="block text-sm font-semibold text-rose-700 underline">প্রকাশনা সরান: {item.crop} ({new Date(item.created_at).toLocaleDateString("bn-BD")})</button>)}</div>
    </div>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{feed.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {item.imageUrl && <img src={item.imageUrl} alt={item.crop + " ফসলের প্রকাশিত ছবি"} loading="lazy" className="h-44 w-full bg-slate-50 object-contain" />}
      <div className="p-4"><p className="text-sm font-bold text-emerald-800">{item.displayName}</p><p className="mt-1 text-xs text-slate-500">{item.crop}{item.district ? " · " + item.district : ""} · {new Date(item.publishedAt).toLocaleDateString("bn-BD")}</p><h3 className="mt-2 font-extrabold">{item.disease}</h3><p className="mt-1 text-xs text-slate-500">AGRIVA AI-এর প্রাথমিক বিশ্লেষণ · নিশ্চিত রোগ নির্ণয় নয়</p><Link href={`/crop-disease/feed/${item.slug}`} className="mt-3 inline-block text-sm font-bold text-emerald-800 underline underline-offset-4">প্রকাশিত বিশ্লেষণ বিস্তারিত দেখুন</Link></div>
    </article>)}</div>
    {!feed.length && <p className="mt-4 rounded-xl bg-white p-5 text-sm text-slate-600">এখনও কেউ প্রকাশের অনুমতি দেননি। প্রথম বিশ্লেষণটি স্বেচ্ছায় শেয়ার করতে পারেন।</p>}
  </section>;
}

export default function CropDiseasePanel() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [crop, setCrop] = useState("ধান");
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyMessage, setHistoryMessage] = useState("আপনার আগের বিশ্লেষণ দেখতে লগইন করুন।");
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "guest">("checking");

  useEffect(() => {
    let active = true;
    fetch("/api/crop-disease", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (response.ok) {
          setAuthStatus("authenticated");
          setHistory(data.history || []);
          setHistoryMessage(data.history?.length ? "" : "এখনো কোনো সংরক্ষিত বিশ্লেষণ নেই।");
        } else {
          if (response.status === 401) setAuthStatus("guest");
          else setAuthStatus("authenticated");
          setHistoryMessage(data.error || "ইতিহাস লোড করা যায়নি।");
        }
      })
      .catch(() => { if (active) { setAuthStatus("checking"); setHistoryMessage("লগইন যাচাই করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পেজ রিফ্রেশ করুন।"); } });
    return () => { active = false; };
  }, []);

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    setError("");
    setResult(null);
    previews.forEach((url) => URL.revokeObjectURL(url));
    if (selected.length > 4) {
      setPhotos([]);
      setPreviews([]);
      event.target.value = "";
      setError("সর্বোচ্চ ৪টি ছবি নির্বাচন করুন।");
      return;
    }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024)) {
      setPhotos([]);
      setPreviews([]);
      event.target.value = "";
      setError("প্রতিটি ছবি JPG, PNG বা WebP এবং সর্বোচ্চ ৫ MB হতে হবে।");
      return;
    }
    setPhotos(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photos.length || busy || authStatus !== "authenticated") return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      photos.forEach((photo) => form.append("photo", photo));
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

        {authStatus !== "authenticated" ? <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-10" aria-live="polite">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl" aria-hidden="true">🔒</div>
          <h2 className="text-xl font-black text-slate-900">{authStatus === "checking" ? "লগইন যাচাই করা হচ্ছে" : "ফসলের ছবি বিশ্লেষণ করতে লগইন করুন"}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">{authStatus === "checking" ? "আপনার অ্যাকাউন্ট যাচাই না হওয়া পর্যন্ত ছবি আপলোড বন্ধ থাকবে। কিছুক্ষণ অপেক্ষা করুন অথবা পেজ রিফ্রেশ করুন।" : "আপনার ছবি ও বিশ্লেষণের ইতিহাস ব্যক্তিগতভাবে সংরক্ষণ করতে AGRIVA অ্যাকাউন্ট প্রয়োজন। লগইন করার পর ছবি আপলোড ও বিশ্লেষণ করতে পারবেন।"}</p>
          {authStatus === "guest" && <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/login?next=%2Fcrop-disease" className="rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-900">লগইন করুন</Link><Link href="/signup" className="rounded-xl border border-emerald-200 px-6 py-3 font-bold text-emerald-900 hover:bg-emerald-50">নতুন অ্যাকাউন্ট খুলুন</Link></div>}
        </section> : <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="crop" className="mb-2 block text-sm font-bold text-slate-800">ফসলের নাম</label>
                <select id="crop" value={crop} onChange={(event) => setCrop(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" required>
                  {crops.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <label htmlFor="location" className="mb-2 mt-4 block text-sm font-bold text-slate-800">জেলা নির্বাচন করুন (ঐচ্ছিক)</label>
                <select id="location" value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="">জেলা নির্বাচন করুন (ঐচ্ছিক)</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select>
                <label htmlFor="symptoms" className="mb-2 mt-4 block text-sm font-bold text-slate-800">আপনি কী লক্ষণ দেখছেন? (ঐচ্ছিক)</label>
                <textarea id="symptoms" value={symptoms} onChange={(event) => setSymptoms(event.target.value)} maxLength={1000} rows={4} placeholder="যেমন: পাতায় বাদামি দাগ, পাতা হলুদ হয়ে যাচ্ছে..." className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              </div>
              <div>
                <label htmlFor="photo" className="mb-2 block text-sm font-bold text-slate-800">ফসলের ছবি (১–৪টি; প্রতি ছবি সর্বোচ্চ ৫ MB)</label>
                <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} multiple required className="block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-900" />
                {previews.length ? <div className="mt-3 grid grid-cols-2 gap-3" aria-label="নির্বাচিত ছবির প্রিভিউ">{previews.map((url, index) => <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={url} alt={`নির্বাচিত ফসলের ছবি ${index + 1}`} className="h-36 w-full object-contain" /><p className="truncate px-2 py-1 text-center text-xs text-slate-600">{index + 1}. {photos[index]?.name}</p></div>)}</div> : <div className="mt-3 grid min-h-52 place-items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-5 text-center text-sm leading-6 text-emerald-900">একই সমস্যার সর্বোচ্চ ৪টি ছবি দিন—পুরো গাছ, আক্রান্ত অংশের ক্লোজআপ, পাতা এবং কাণ্ড বা শীষ। সব ছবি একসঙ্গে বিশ্লেষণ করা হবে।</div>}
                <p className="mt-2 text-xs text-slate-600">নির্বাচিত: {photos.length}/৪টি ছবি · JPG, PNG বা WebP</p>
              </div>
            </div>
            <aside aria-label="AGRIVA AI কৃষি সহায়তা সম্পর্কে" className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm leading-6 text-slate-700">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-2xl">🌱</span>
                <div>
                  <h2 className="font-extrabold text-emerald-950">AGRIVA AI কৃষি সহায়তা</h2>
                  <p className="text-xs text-emerald-800">স্মার্ট প্রযুক্তিতে ফসলের যত্ন</p>
                </div>
              </div>
              <p className="mt-3">ফসলের আক্রান্ত অংশের পরিষ্কার ছবি আপলোড করুন। AGRIVA AI ছবির দৃশ্যমান লক্ষণ বিশ্লেষণ করে সম্ভাব্য রোগ, প্রাথমিক করণীয় ও প্রতিরোধমূলক পরামর্শ প্রদান করবে।</p>
              <div className="mt-4 flex items-start gap-2">
                <span aria-hidden="true" className="text-emerald-700">✓</span>
                <div>
                  <h3 className="font-bold text-slate-900">আপনার তথ্য, আপনার নিয়ন্ত্রণে</h3>
                  <p className="text-xs leading-5 text-slate-600">আপনার ছবি ও বিশ্লেষণের ইতিহাস ব্যক্তিগতভাবে সংরক্ষিত থাকবে এবং অ্যাকাউন্ট থেকে পুনরায় দেখতে পারবেন।</p>
                </div>
              </div>
              <div className="mt-4 border-t border-emerald-100 pt-3 text-xs leading-5 text-slate-600">
                <p>AI বিশ্লেষণ প্রাথমিক সহায়তার জন্য। নিশ্চিত রোগ নির্ণয় ও কীটনাশক প্রয়োগের আগে কৃষি বিশেষজ্ঞের পরামর্শ নিন।</p>
                <p className="mt-2">ছবি বিশ্লেষণে তৃতীয় পক্ষের AI সেবা ব্যবহার করা হয়। বিস্তারিত জানতে <Link href="/privacy-policy" className="font-semibold text-emerald-800 underline underline-offset-2">গোপনীয়তা নীতি</Link> দেখুন।</p>
              </div>
            </aside>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error} {error.includes("লগইন") || error.includes("লগ ইন") ? <Link href="/login" className="font-bold underline">লগইন করুন</Link> : null}</p>}
            <button type="submit" disabled={!photos.length || busy} className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 font-extrabold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "ছবি বিশ্লেষণ হচ্ছে..." : "ছবি বিশ্লেষণ করুন"}</button>
          </form>
        </section>}

        {result && <section className="mt-6"><div className="mb-3 flex items-center gap-2"><span aria-hidden="true">🔎</span><h2 className="text-xl font-black">বিশ্লেষণের ফলাফল</h2></div><DiagnosisCard diagnosis={result.diagnosis} /></section>}

        <CropShareCardMaker initialCrop={result?.crop || ""} initialDisease={result?.diagnosis?.disease || ""} initialDistrict={result?.location || ""} />

        <CropHealthFeed history={history} />

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-bold text-emerald-700">ব্যক্তিগত ইতিহাস</p><h2 className="mt-1 text-2xl font-black">সাম্প্রতিক বিশ্লেষণ</h2></div>
            {authStatus === "guest" && <Link href="/login?next=%2Fcrop-disease" className="text-sm font-bold text-emerald-800 underline underline-offset-4">অ্যাকাউন্টে লগইন</Link>}
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

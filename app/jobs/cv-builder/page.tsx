"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CV = {
  fullName: string; headline: string; phone: string; email: string; address: string;
  summary: string; education: string; experience: string; skills: string; languages: string;
  certifications: string; photoUrl: string;
};
const emptyCV: CV = { fullName:"", headline:"", phone:"", email:"", address:"", summary:"", education:"", experience:"", skills:"", languages:"", certifications:"", photoUrl:"" };
const templates = [
  { id:"classic", name:"Classic Professional", note:"পরিচ্ছন্ন, আনুষ্ঠানিক", accent:"#166534" },
  { id:"modern", name:"Modern Green", note:"আধুনিক, দুই কলামের অনুভূতি", accent:"#0f766e" },
  { id:"simple", name:"Simple & ATS-friendly", note:"সাধারণ, সহজে পড়া যায়", accent:"#334155" },
  { id:"agri", name:"Agriculture Specialist", note:"কৃষি ও খামারের কাজের জন্য", accent:"#854d0e" },
];

export default function CVBuilderPage() {
  const [cv, setCV] = useState<CV>(emptyCV);
  const [template, setTemplate] = useState("classic");
  const [language, setLanguage] = useState<"en"|"bn">("en");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agriva-cv-v1");
      if (raw) {
        const data = JSON.parse(raw) as { cv?: CV; template?: string; language?: "en"|"bn" };
        if (data.cv) setCV({ ...emptyCV, ...data.cv });
        if (data.template && templates.some(t => t.id === data.template)) setTemplate(data.template);
        if (data.language === "bn" || data.language === "en") setLanguage(data.language);
      }
    } catch { /* Ignore invalid local browser data. */ }
    setLoaded(true);
  }, []);

  const selected = templates.find(t => t.id === template) ?? templates[0];
  const isBn = language === "bn";
  const labels = isBn
    ? { title:"আমার CV তৈরি করুন", subtitle:"একবার তথ্য দিন, পছন্দের ডিজাইন বেছে নিন, তারপর PDF ডাউনলোড করুন বা চাকরিতে আবেদন করুন।", personal:"ব্যক্তিগত তথ্য", fullName:"পূর্ণ নাম", headline:"পেশাগত পরিচিতি", phone:"ফোন নম্বর", email:"ইমেইল", address:"ঠিকানা", summary:"নিজের সম্পর্কে", education:"শিক্ষাগত যোগ্যতা", experience:"কাজের অভিজ্ঞতা", skills:"দক্ষতা", languages:"ভাষা", certifications:"প্রশিক্ষণ ও সার্টিফিকেট", photo:"ছবির URL (ঐচ্ছিক)", design:"CV ডিজাইন বেছে নিন", preview:"লাইভ প্রিভিউ", save:"CV সেভ করুন", download:"PDF ডাউনলোড / প্রিন্ট", apply:"চাকরি খুঁজুন ও আবেদন করুন", saved:"এই ডিভাইসে CV সেভ হয়েছে", tip:"আপনার তথ্য এই ব্রাউজারেই সেভ হয়। শেয়ার করা ডিভাইসে ব্যক্তিগত তথ্য রেখে যাবেন না।", placeholder:"এখানে লিখুন...", edit:"তথ্য পরিবর্তন করুন" }
    : { title:"Build your CV", subtitle:"Enter your information once, choose your favourite design, then download a PDF or continue to jobs.", personal:"Personal information", fullName:"Full name", headline:"Professional headline", phone:"Phone number", email:"Email", address:"Address", summary:"Professional summary", education:"Education", experience:"Work experience", skills:"Skills", languages:"Languages", certifications:"Training & certifications", photo:"Photo URL (optional)", design:"Choose a CV design", preview:"Live preview", save:"Save CV", download:"Download PDF / Print", apply:"Browse jobs & apply", saved:"CV saved on this device", tip:"Your CV is stored in this browser only. Avoid saving personal details on a shared device.", placeholder:"Write here...", edit:"Edit information" };

  const update = (key: keyof CV, value: string) => { setCV(prev => ({ ...prev, [key]: value })); setSaved(false); };
  const persist = () => {
    try { localStorage.setItem("agriva-cv-v1", JSON.stringify({ cv, template, language })); setSaved(true); }
    catch { setSaved(false); }
  };
  const previewText = useMemo(() => (value: string) => value.trim().split("\n").filter(Boolean), []);

  if (!loaded) return <main className="min-h-screen bg-[#f5f8f1] p-8 text-[#17351f]">CV Builder loading…</main>;

  return <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
    <section className="bg-gradient-to-br from-[#103f2b] to-[#24734a] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/jobs" className="text-sm font-bold text-emerald-100 hover:underline">← AGRIVA Jobs</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-lime-200">AGRIVA CAREER TOOLS</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{labels.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">{labels.subtitle}</p></div>
          <label className="text-sm font-bold">Language <select value={language} onChange={e => { setLanguage(e.target.value as "bn"|"en"); setSaved(false); }} className="ml-2 rounded-lg border-0 bg-white px-3 py-2 text-slate-900"><option value="en">English CV</option><option value="bn">বাংলা CV</option></select></label>
        </div>
      </div>
    </section>

    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
      <section className="space-y-6 print:hidden">
        <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">{labels.personal}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(["fullName","headline","phone","email","address","photoUrl"] as const).map(key => <label key={key} className="text-sm font-bold">{labels[key === "photoUrl" ? "photo" : key]}<input value={cv[key]} onChange={e=>update(key,e.target.value)} maxLength={200} placeholder={labels.placeholder} type={key==="email"?"email":"text"} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/></label>)}
          </div>
          {(["summary","education","experience","skills","languages","certifications"] as const).map(key => <label key={key} className="mt-4 block text-sm font-bold">{labels[key]}<textarea value={cv[key]} onChange={e=>update(key,e.target.value)} maxLength={key==="summary"?2000:4000} rows={key==="summary"?3:4} placeholder={labels.placeholder} className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-normal leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/></label>)}
          <p className="mt-3 text-xs leading-5 text-slate-500">{labels.tip}</p>
          <div className="mt-4 flex flex-wrap gap-3"><button onClick={persist} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white">{labels.save}</button>{saved&&<span role="status" className="self-center text-sm font-bold text-emerald-800">{labels.saved}</span>}</div>
        </div>
        <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">{labels.design}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
            {templates.map(t=><button key={t.id} onClick={()=>{setTemplate(t.id);setSaved(false);}} className={"rounded-xl border p-4 text-left transition "+(template===t.id?"border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100":"border-slate-200 hover:border-emerald-300")}><span className="mb-3 block h-2 rounded-full" style={{background:t.accent}}/><span className="block font-extrabold">{t.name}</span><span className="mt-1 block text-xs text-slate-500">{t.note}</span><span className="mt-3 block text-xs font-bold text-emerald-800">{template===t.id?"✓ Selected":"Choose design"}</span></button>)}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={()=>window.print()} className="min-h-12 flex-1 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-extrabold text-white">{labels.download}</button><Link href="/jobs" className="min-h-12 flex-1 rounded-xl border border-emerald-800 px-4 py-3 text-center text-sm font-extrabold text-emerald-900">{labels.apply} →</Link></div>
          <p className="mt-3 text-xs leading-5 text-slate-500">PDF বানাতে Print dialog-এ “Save as PDF” নির্বাচন করুন।</p>
        </div>
      </section>

      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{labels.preview}</h2><span className="text-xs font-bold text-slate-500">{selected.name}</span></div>
        <article id="cv-preview" className="cv-paper min-h-[900px] overflow-hidden bg-white shadow-lg ring-1 ring-black/5" style={{fontFamily: isBn ? "Arial, sans-serif" : "Arial, sans-serif"}}>
          <header className="p-7 text-white sm:p-9" style={{background:selected.accent}}>
            <div className="flex items-start gap-4">
              {cv.photoUrl.trim()&&<img src={cv.photoUrl} alt="" className="h-20 w-20 rounded-xl border-2 border-white/60 object-cover" />}
              <div className="min-w-0"><h1 className="break-words text-2xl font-black sm:text-3xl">{cv.fullName || (isBn?"আপনার নাম":"Your Name")}</h1><p className="mt-2 text-sm font-semibold opacity-90">{cv.headline || (isBn?"পেশাগত পরিচিতি":"Professional headline")}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90">{[cv.phone,cv.email,cv.address].filter(Boolean).map(v=><span key={v} className="break-words">{v}</span>)}</div></div>
            </div>
          </header>
          <div className={"p-7 sm:p-9 "+(template==="modern"?"grid gap-7 sm:grid-cols-[.72fr_1.28fr]":"")}>
            {template==="modern"&&<aside className="space-y-6"><CVSection title={labels.skills} values={previewText(cv.skills)} accent={selected.accent}/><CVSection title={labels.languages} values={previewText(cv.languages)} accent={selected.accent}/><CVSection title={labels.certifications} values={previewText(cv.certifications)} accent={selected.accent}/></aside>}
            <div className="space-y-6">
              <CVSection title={labels.summary} values={previewText(cv.summary)} accent={selected.accent}/>
              <CVSection title={labels.experience} values={previewText(cv.experience)} accent={selected.accent}/>
              <CVSection title={labels.education} values={previewText(cv.education)} accent={selected.accent}/>
              {template!=="modern"&&<><CVSection title={labels.skills} values={previewText(cv.skills)} accent={selected.accent}/><CVSection title={labels.languages} values={previewText(cv.languages)} accent={selected.accent}/><CVSection title={labels.certifications} values={previewText(cv.certifications)} accent={selected.accent}/></>}
            </div>
          </div>
          {template==="agri"&&<footer className="mx-7 border-t-2 py-4 text-xs font-bold sm:mx-9" style={{borderColor:selected.accent,color:selected.accent}}>AGRIVA · Agriculture & Rural Careers</footer>}
        </article>
      </section>
    </div>
    <style jsx global>{`
      @media print {
        @page { size: A4; margin: 10mm; }
        body { background: white !important; }
        body * { visibility: hidden !important; }
        #cv-preview, #cv-preview * { visibility: visible !important; }
        #cv-preview { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; min-height: 0 !important; box-shadow: none !important; ring: 0 !important; }
        .cv-paper { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  </main>;
}

function CVSection({ title, values, accent }: { title:string; values:string[]; accent:string }) {
  return <section className="break-inside-avoid"><h2 className="border-b pb-2 text-sm font-black uppercase tracking-wide" style={{borderColor:accent,color:accent}}>{title}</h2>{values.length>0?<div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{values.map((v,i)=><p key={i} className="whitespace-pre-wrap break-words">{v}</p>)}</div>:<p className="mt-3 text-sm italic text-slate-300">Add information here</p>}</section>;
}

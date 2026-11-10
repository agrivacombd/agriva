"use client";

import Link from "next/link";
import CVInsights from "@/components/jobs/CVInsights";
import { loadCV, saveCV } from "@/lib/jobs/cv/storage";
import type { CVDocument, CVEducationEntry, CVExperienceEntry } from "@/lib/jobs/cv/types";
import { useEffect, useMemo, useState } from "react";

type CV = {
  fullName: string; headline: string; phone: string; email: string; address: string;
  summary: string; education: string; experience: string; skills: string; languages: string;
  certifications: string; photoUrl: string;
};
const emptyCV: CV = { fullName:"", headline:"", phone:"", email:"", address:"", summary:"", education:"", experience:"", skills:"", languages:"", certifications:"", photoUrl:"" };

function documentToLegacyCV(document: CVDocument): CV {
  const join = (items: Array<{ content?: string; jobTitle?: string; company?: string; description?: string; achievements?: string; degree?: string; institution?: string; details?: string }>) => items.map((item) => [item.content, item.jobTitle, item.company, item.description, item.achievements, item.degree, item.institution, item.details].filter(Boolean).join(" · ")).join("\n");
  return {
    fullName: document.profile.fullName,
    headline: document.profile.headline,
    phone: document.profile.phone,
    email: document.profile.email,
    address: document.profile.address,
    photoUrl: document.profile.photoUrl,
    summary: document.summary,
    experience: join(document.experience),
    education: join(document.education),
    skills: join(document.skills),
    languages: join(document.languages),
    certifications: join(document.certifications),
  };
}

function legacyCVToDocument(cv: CV, template: string, language: "en" | "bn", work: CVExperienceEntry[], education: CVEducationEntry[]): CVDocument {
  const entries = (value: string, prefix: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((content, index) => ({ id: `${prefix}-${index + 1}`, content }));
  return {
    schemaVersion: 3,
    profile: { fullName: cv.fullName, headline: cv.headline, phone: cv.phone, email: cv.email, address: cv.address, photoUrl: cv.photoUrl },
    summary: cv.summary,
    experience: work,
    education,
    skills: entries(cv.skills, "skill"),
    languages: entries(cv.languages, "language"),
    certifications: entries(cv.certifications, "certification"),
    settings: { language, templateId: template },
  };
}
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
  const [workEntries, setWorkEntries] = useState<CVExperienceEntry[]>([]);
  const [educationEntries, setEducationEntries] = useState<CVEducationEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const result = loadCV(window.localStorage);
    if (result.document) {
      setCV({ ...emptyCV, ...documentToLegacyCV(result.document) });
      setWorkEntries(result.document.experience);
      setEducationEntries(result.document.education);
      const storedTemplate = result.document.settings.templateId;
      if (templates.some((item) => item.id === storedTemplate)) setTemplate(storedTemplate);
      setLanguage(result.document.settings.language);
    }
    setLoaded(true);
  }, []);

  const selected = templates.find(t => t.id === template) ?? templates[0];
  const isBn = language === "bn";
  const labels = isBn
    ? { title:"আমার CV তৈরি করুন", subtitle:"একবার তথ্য দিন, পছন্দের ডিজাইন বেছে নিন, তারপর PDF ডাউনলোড করুন বা চাকরিতে আবেদন করুন।", personal:"ব্যক্তিগত তথ্য", fullName:"পূর্ণ নাম", headline:"পেশাগত পরিচিতি", phone:"ফোন নম্বর", email:"ইমেইল", address:"ঠিকানা", summary:"নিজের সম্পর্কে", education:"শিক্ষাগত যোগ্যতা", experience:"কাজের অভিজ্ঞতা", skills:"দক্ষতা", languages:"ভাষা", certifications:"প্রশিক্ষণ ও সার্টিফিকেট", photo:"ছবির URL (ঐচ্ছিক)", design:"CV ডিজাইন বেছে নিন", preview:"লাইভ প্রিভিউ", save:"CV সেভ করুন", download:"PDF ডাউনলোড / প্রিন্ট", apply:"চাকরি খুঁজুন ও আবেদন করুন", saved:"এই ডিভাইসে CV সেভ হয়েছে", tip:"আপনার তথ্য এই ব্রাউজারেই সেভ হয়। শেয়ার করা ডিভাইসে ব্যক্তিগত তথ্য রেখে যাবেন না।", placeholder:"এখানে লিখুন...", edit:"তথ্য পরিবর্তন করুন" }
    : { title:"Build your CV", subtitle:"Enter your information once, choose your favourite design, then download a PDF or continue to jobs.", personal:"Personal information", fullName:"Full name", headline:"Professional headline", phone:"Phone number", email:"Email", address:"Address", summary:"Professional summary", education:"Education", experience:"Work experience", skills:"Skills", languages:"Languages", certifications:"Training & certifications", photo:"Photo URL (optional)", design:"Choose a CV design", preview:"Live preview", save:"Save CV", download:"Download PDF / Print", apply:"Browse jobs & apply", saved:"CV saved on this device", tip:"Your CV is stored in this browser only. Avoid saving personal details on a shared device.", placeholder:"Write here...", edit:"Edit information" };

  const update = (key: keyof CV, value: string) => { setCV(prev => ({ ...prev, [key]: value })); setSaved(false); };
  const persist = () => {
    const document = legacyCVToDocument(cv, template, language, workEntries, educationEntries);
    setSaved(saveCV(window.localStorage, document, { language, template }));
  };

  useEffect(() => {
    if (!loaded) return;
    const timeout = window.setTimeout(() => {
      const document = legacyCVToDocument(cv, template, language, workEntries, educationEntries);
      setSaved(saveCV(window.localStorage, document, { language, template }));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [cv, template, language, loaded, workEntries, educationEntries]);
  useEffect(() => {
    setCV((current) => ({ ...current, experience: workEntries.map((item) => [item.jobTitle, item.company, item.location, item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : item.startDate || item.endDate, item.description, item.achievements].filter(Boolean).join(" · ")).filter(Boolean).join("\n") }));
  }, [workEntries]);
  useEffect(() => {
    setCV((current) => ({ ...current, education: educationEntries.map((item) => [item.degree, item.institution, item.location, item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : item.startDate || item.endDate, item.details].filter(Boolean).join(" · ")).filter(Boolean).join("\n") }));
  }, [educationEntries]);
  const previewText = useMemo(() => (value: string) => value.trim().split("\n").filter(Boolean), []);

  if (!loaded) return <main className="min-h-screen bg-[#f5f8f1] p-8 text-[#17351f]">CV Builder loading…</main>;

  return <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
    <section className="bg-gradient-to-br from-[#103f2b] to-[#24734a] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/jobs" className="text-sm font-bold text-emerald-100 hover:underline">← AGRIVA Jobs</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-lime-200">AGRIVA CAREER TOOLS</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">{labels.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">{labels.subtitle}</p></div>
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
          {(["summary","education","experience","skills","languages","certifications"] as const).map(key => key === "summary" ? (
            <label key={key} className="mt-4 block text-sm font-bold">{labels[key]}<textarea value={cv.summary} onChange={e=>update("summary",e.target.value)} maxLength={2000} rows={4} placeholder={labels.placeholder} className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-normal leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/></label>
          ) : key === "experience" ? (
            <div key={key} className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold">{labels.experience}</h3>
              <div className="mt-3 space-y-4">{workEntries.map((item,index)=><fieldset key={item.id} className="rounded-lg border border-slate-200 p-3"><legend className="px-1 text-xs font-bold">Experience {index+1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["jobTitle","company","location","startDate","endDate"] as const).map(field=><label key={field} className="text-xs font-bold">{({jobTitle:"Job title",company:"Company",location:"Location",startDate:"Start date",endDate:"End date"})[field]}<input value={item[field]} onChange={e=>{const next=[...workEntries];next[index]={...item,[field]:e.target.value};setWorkEntries(next);setSaved(false);}} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"/></label>)}
                </div>
                <label className="mt-3 block text-xs font-bold">Responsibilities / description<textarea value={item.description} onChange={e=>{const next=[...workEntries];next[index]={...item,description:e.target.value};setWorkEntries(next);setSaved(false);}} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal"/></label>
                <label className="mt-3 block text-xs font-bold">Achievements<textarea value={item.achievements} onChange={e=>{const next=[...workEntries];next[index]={...item,achievements:e.target.value};setWorkEntries(next);setSaved(false);}} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal"/></label>
                <button type="button" onClick={()=>setWorkEntries(items=>items.filter(entry=>entry.id!==item.id))} className="mt-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Remove</button>
              </fieldset>)}</div>
              <button type="button" onClick={()=>setWorkEntries(items=>[...items,{id:crypto.randomUUID(),jobTitle:"",company:"",location:"",startDate:"",endDate:"",description:"",achievements:""}])} className="mt-3 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-extrabold text-emerald-800">+ Add experience</button>
            </div>
          ) : key === "education" ? (
            <div key={key} className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold">{labels.education}</h3>
              <div className="mt-3 space-y-4">{educationEntries.map((item,index)=><fieldset key={item.id} className="rounded-lg border border-slate-200 p-3"><legend className="px-1 text-xs font-bold">Education {index+1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["degree","institution","location","startDate","endDate"] as const).map(field=><label key={field} className="text-xs font-bold">{({degree:"Degree / qualification",institution:"Institution",location:"Location",startDate:"Start date",endDate:"End date"})[field]}<input value={item[field]} onChange={e=>{const next=[...educationEntries];next[index]={...item,[field]:e.target.value};setEducationEntries(next);setSaved(false);}} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"/></label>)}
                </div>
                <label className="mt-3 block text-xs font-bold">Results / details<textarea value={item.details} onChange={e=>{const next=[...educationEntries];next[index]={...item,details:e.target.value};setEducationEntries(next);setSaved(false);}} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal"/></label>
                <button type="button" onClick={()=>setEducationEntries(items=>items.filter(entry=>entry.id!==item.id))} className="mt-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Remove</button>
              </fieldset>)}</div>
              <button type="button" onClick={()=>setEducationEntries(items=>[...items,{id:crypto.randomUUID(),degree:"",institution:"",location:"",startDate:"",endDate:"",details:""}])} className="mt-3 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-extrabold text-emerald-800">+ Add education</button>
            </div>
          ) : (
            <div key={key} className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold">{labels[key]}</h3><span className="text-xs text-slate-500">{cv[key].split(/\r?\n/).filter(line=>line.trim()).length} {isBn?"টি":"entries"}</span></div>
              <div className="mt-3 space-y-2">
                {cv[key].split(/\r?\n/).map((entry,index)=>({entry,index})).map(({entry,index})=>(
                  <div key={index} className="flex items-start gap-2">
                    <input value={entry} onChange={e=>{const rows=cv[key].split(/\r?\n/);rows[index]=e.target.value;update(key,rows.join("\n"));}} maxLength={500} aria-label={`${labels[key]} ${index+1}`} placeholder={labels.placeholder} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"/>
                    <button type="button" onClick={()=>{const rows=cv[key].split(/\r?\n/);rows.splice(index,1);update(key,rows.join("\n"));}} aria-label={isBn?"এন্ট্রি মুছুন":"Remove entry"} className="min-h-11 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={()=>update(key,[cv[key].trim(),""].filter(Boolean).join("\n") + (cv[key].trim()?"\n":""))} className="mt-3 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50">+ {isBn?"নতুন যোগ করুন":"Add entry"}</button>
              <p className="mt-2 text-xs text-slate-500">{isBn?"প্রতিটি তথ্য আলাদা এন্ট্রি হিসেবে যোগ করুন।":"Add each item as a separate entry."}</p>
            </div>
          ))}
          <p className="mt-3 text-xs leading-5 text-slate-500">{labels.tip}</p>
          <div className="mt-4 flex flex-wrap gap-3"><button onClick={persist} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white">{labels.save}</button>{saved&&<span role="status" className="self-center text-sm font-bold text-emerald-800">{labels.saved}</span>}</div>
        </div>
        <CVInsights cv={cv} language={language} />
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
        <article id="cv-preview" className="cv-paper mx-auto min-h-[1123px] w-full max-w-[794px] overflow-visible bg-white shadow-lg ring-1 ring-black/5" style={{fontFamily: isBn ? "Arial, sans-serif" : "Arial, sans-serif"}}>
          <header className="p-7 text-white sm:p-9" style={{background:selected.accent}}>
            <div className="flex items-start gap-4">
              {/^https?:\/\//i.test(cv.photoUrl.trim())&&<img src={cv.photoUrl.trim()} alt="" className="h-20 w-20 rounded-xl border-2 border-white/60 object-cover" />}
              <div className="min-w-0"><h2 className="break-words text-2xl font-black sm:text-3xl">{cv.fullName || (isBn?"আপনার নাম":"Your Name")}</h2><p className="mt-2 text-sm font-semibold opacity-90">{cv.headline || (isBn?"পেশাগত পরিচিতি":"Professional headline")}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90">{[cv.phone,cv.email,cv.address].filter(Boolean).map(v=><span key={v} className="break-words">{v}</span>)}</div></div>
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
        #cv-preview { position: static !important; display: block !important; width: 190mm !important; max-width: none !important; min-height: 0 !important; height: auto !important; margin: 0 auto !important; overflow: visible !important; box-shadow: none !important; }
        #cv-preview > header, #cv-preview > div, #cv-preview > footer { break-inside: auto; }
        #cv-preview section { break-inside: avoid-page; page-break-inside: avoid; }
        #cv-preview h2 { break-after: avoid-page; page-break-after: avoid; }
        #cv-preview p, #cv-preview span { overflow-wrap: anywhere; }
        .cv-paper { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  </main>;
}

function CVSection({ title, values, accent }: { title:string; values:string[]; accent:string }) {
  return <section className="break-inside-avoid"><h2 className="border-b pb-2 text-sm font-black uppercase tracking-wide" style={{borderColor:accent,color:accent}}>{title}</h2>{values.length>0?<div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{values.map((v,i)=><p key={i} className="whitespace-pre-wrap break-words">{v}</p>)}</div>:<p className="mt-3 text-sm italic text-slate-300">Add information here</p>}</section>;
}

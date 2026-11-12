"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { plants, type Plant } from "./plants";
import { plantScienceFaqs } from "./faqs";

const catalogTarget = 5000;

const curriculumCategory = (p: Plant) => {
  const g = p.group.toLowerCase();
  if (/cereal|grain|pulse|oilseed|fibre|fiber|sugar crop|field crop|fodder/.test(g)) return "Agronomy & Field Crops";
  if (/vegetable|leafy|root vegetable|tuber|fruit crop|fruit tree|edible herb|vegetable vine/.test(g)) return "Horticulture";
  if (/spice|condiment/.test(g)) return "Spices & Plantation Crops";
  if (/floriculture|flower|ornamental/.test(g)) return "Floriculture & Ornamentals";
  if (/medicinal|aromatic/.test(g)) return "Medicinal & Aromatic Plants";
  if (/weed|field weed|wild crop relative/.test(g)) return "Weed Science";
  if (/wetland|aquatic|marsh|swamp|water plant/.test(g)) return "Aquatic & Wetland Plants";
  if (/forest|timber|agroforestry|shade tree|bamboo|rattan|green manure/.test(g)) return "Forestry & Agroforestry";
  if (/fern|bryophyte|moss|algae|gymnosperm|pteridophyte|taxonomy/.test(g)) return "Plant Taxonomy & Biodiversity";
  if (/economic|dye|industrial|palm|tree|shrub|herb|green manure/.test(g)) return "Forestry, Botany & Economic Plants";
  return "Other Curriculum Plants";
};
const curriculumCategories = ["All","Agronomy & Field Crops","Horticulture","Spices & Plantation Crops","Floriculture & Ornamentals","Medicinal & Aromatic Plants","Weed Science","Aquatic & Wetland Plants","Forestry & Agroforestry","Plant Taxonomy & Biodiversity","Forestry, Botany & Economic Plants","Other Curriculum Plants"];

const modes = [
  {id:"library",label:"গাছের লাইব্রেরি",icon:"🌳"},
  {id:"cards",label:"ফ্ল্যাশকার্ড",icon:"🗂️"},
  {id:"quiz",label:"কুইজ",icon:"🧠"},
] as const;
type Mode = typeof modes[number]["id"];

export default function PlantSciencePage() {
  const [mode,setMode] = useState<Mode>("library");
  const [query,setQuery] = useState("");
  const [group,setGroup] = useState("All");
  const [index,setIndex] = useState(0);
  const [revealed,setRevealed] = useState(false);
  const [quizIndex,setQuizIndex] = useState(0);
  const [choice,setChoice] = useState("");
  const [score,setScore] = useState(0);
  const [answered,setAnswered] = useState(false);
  const [known,setKnown] = useState<string[]>([]);
  const [review,setReview] = useState<string[]>([]);
  const [reviewOnly,setReviewOnly] = useState(false);
  const [ready,setReady] = useState(false);
  const [page,setPage] = useState(1);
  const pageSize = 24;
  useEffect(()=>{try { const raw=localStorage.getItem("agriva-plant-learning-v1"); if(raw){const p=JSON.parse(raw);setKnown(Array.isArray(p.known)?p.known:[]);setReview(Array.isArray(p.review)?p.review:[]);} } catch {} setReady(true);},[]);
  useEffect(()=>{if(ready){try{localStorage.setItem("agriva-plant-learning-v1",JSON.stringify({known,review}));}catch{}}},[known,review,ready]);

  const groups = curriculumCategories;
  const filtered = useMemo(()=>plants.filter(p=>(group==="All"||curriculumCategory(p)===group)&&(!reviewOnly||review.includes(p.scientific))&&[p.bn,p.en,p.scientific,p.family,p.group,p.clue].some(v=>v.toLowerCase().includes(query.toLowerCase().trim()))),[group,query,reviewOnly,review]);
  const pageCount = Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage = Math.min(page,pageCount);
  const pagePlants = filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
  const current = filtered.length ? filtered[index % filtered.length] : plants[0];
  const question = plants[quizIndex % plants.length];
  const options = useMemo(()=> {
    const wrong=plants.filter(p=>p.scientific!==question.scientific).sort((a,b)=>a.scientific.localeCompare(b.scientific)).slice((quizIndex*3)%Math.max(1,plants.length-3),(quizIndex*3)%Math.max(1,plants.length-3)+3);
    return [...wrong,question].sort((a,b)=>a.scientific.localeCompare(b.scientific));
  },[question,quizIndex]);
  const choose = (answer:string) => { if(answered)return;setChoice(answer);setAnswered(true); if(answer===question.scientific){setScore(s=>s+1);setKnown(prev=>prev.includes(question.scientific)?prev:[...prev,question.scientific]);}else{setReview(prev=>prev.includes(question.scientific)?prev:[...prev,question.scientific]);} };
  const nextQuestion = () => {setQuizIndex(i=>i+1);setChoice("");setAnswered(false);};
  const nextCard = (delta:number) => {setIndex(i=>(i+delta+Math.max(filtered.length,1))%Math.max(filtered.length,1));setRevealed(false);};
  return <main className="min-h-screen bg-[#f4f8f1] text-slate-900">
    <header className="bg-gradient-to-br from-[#103f2b] via-[#14532d] to-[#39834a] px-4 py-9 text-white sm:px-6">
      <div className="mx-auto max-w-6xl"><Link href="/learn" className="text-sm font-bold text-emerald-100 hover:underline">← AGRIVA</Link>
        <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-lime-200">PLANT SCIENCE ACADEMY</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">উদ্ভিদ চিনুন, বৈজ্ঞানিক নাম মনে রাখুন</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">বাংলাদেশের ফসল, ফল, শাকসবজি, ঔষধি, বনজ ও স্থানীয় উদ্ভিদ সম্পর্কে বাংলা-ইংরেজি শেখার অনুশীলন টুল।</p>
        <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">{[{v:plants.length,l:"উদ্ভিদের তথ্য"},{v:known.length,l:"জানা হয়েছে"},{v:review.length,l:"আবার দেখুন"}].map(s=><div key={s.l} className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-black">{s.v}</div><div className="mt-1 text-xs text-emerald-100">{s.l}</div></div>)}</div><div className="mt-5 max-w-xl"><div className="flex justify-between text-xs font-bold text-emerald-50"><span>আজকের শেখার লক্ষ্য</span><span>{Math.min(known.length,5)}/৫</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-lime-300 transition-all" style={{width:`${Math.min(known.length,5)*20}%`}}/></div><p className="mt-2 text-xs text-emerald-100">প্রতিদিন ৫টি বৈজ্ঞানিক নাম মনে রাখার চেষ্টা করুন।</p></div><div className="mt-5"><div className="flex justify-between text-xs font-bold text-emerald-50"><span>৫০০০ উদ্ভিদের লক্ষ্য</span><span>{plants.length} / {catalogTarget}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{width:`${Math.min(100,plants.length/catalogTarget*100)}%`}}/></div><p className="mt-2 text-xs text-emerald-100">তথ্য যাচাই করে ধাপে ধাপে ক্যাটালগ বাড়ানো হচ্ছে।</p></div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">{modes.map(m=><button key={m.id} onClick={()=>setMode(m.id)} className={"rounded-xl border p-4 text-left "+(mode===m.id?"border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100":"border-slate-200 bg-white hover:border-emerald-300")}><span className="text-xl">{m.icon}</span><span className="mt-2 block font-extrabold">{m.label}</span></button>)}</div>

      {mode==="library"&&<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="বাংলা, English, Scientific name বা বৈশিষ্ট্য দিয়ে খুঁজুন…" className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-700"/><select value={group} onChange={e=>{setGroup(e.target.value);setPage(1);}} className="min-h-12 rounded-xl border border-slate-200 bg-white px-3">{groups.map(g=><option key={g} value={g}>{g==="All"?"সব বিভাগ":g}</option>)}</select></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{filtered.length}টি গাছ পাওয়া গেছে{reviewOnly?" (পুনরায় শেখার তালিকা)":""}</p><div className="flex flex-wrap gap-2"><button onClick={()=>{setReviewOnly(v=>!v);setPage(1);}} className={"rounded-lg border px-3 py-2 text-sm font-bold "+(reviewOnly?"border-amber-400 bg-amber-50 text-amber-900":"border-slate-200 bg-white text-slate-700")}>{reviewOnly?"সব গাছ দেখুন":"শুধু আবার শিখব ("+review.length+")"}</button><button onClick={()=>{const pool=plants.filter(p=>!known.includes(p.scientific));const pick=pool.length?pool[Math.floor(Math.random()*pool.length)]:plants[Math.floor(Math.random()*plants.length)];setReviewOnly(false);setQuery("");setGroup("All");setIndex(Math.max(0,plants.findIndex(p=>p.scientific===pick.scientific)));setRevealed(false);setMode("cards");}} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">🎲 এলোমেলো গাছ শিখি</button></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pagePlants.map(p=><article key={p.scientific} className="rounded-xl border border-slate-200 p-4"><div className="flex min-w-0 flex-col items-start gap-2"><div className="min-w-0 w-full"><p className="break-words text-lg font-black leading-snug">{p.bn}</p><p className="break-words text-sm text-slate-500">{p.en}</p></div><span className="inline-flex max-w-full whitespace-normal rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold leading-4 text-emerald-800">{curriculumCategory(p)}</span></div><p className="mt-4 break-words font-serif text-lg italic text-emerald-800">{p.scientific}</p><p className="mt-2 text-xs font-bold text-slate-500">Family: {p.family}</p><p className="mt-3 text-sm leading-6 text-slate-600">{p.clue}</p><button onClick={()=>{setIndex(Math.max(0,filtered.findIndex(x=>x.scientific===p.scientific)));setRevealed(false);setMode("cards");}} className="mt-4 text-sm font-extrabold text-emerald-800 hover:underline">এই গাছটি অনুশীলন করুন →</button></article>)}</div>
        {filtered.length===0&&<p className="py-10 text-center text-slate-500">মিল পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন বা বিভাগ পরিবর্তন করুন।</p>}
        {filtered.length>pageSize&&<nav aria-label="উদ্ভিদ তালিকার পৃষ্ঠা" className="mt-6 flex flex-wrap items-center justify-center gap-3"><button type="button" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40">← আগের পৃষ্ঠা</button><span className="text-sm font-semibold text-slate-600" aria-live="polite">পৃষ্ঠা {currentPage} / {pageCount}</span><button type="button" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={currentPage===pageCount} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40">পরের পৃষ্ঠা →</button></nav>}
        <p className="mt-5 text-xs leading-5 text-slate-500">তথ্যসূত্র: <a className="font-semibold text-emerald-800 underline" href="https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bnh/2024/12/b1040d5e646340aea9ef72b88aac4d95.pdf" target="_blank" rel="noreferrer">বাংলাদেশ ন্যাশনাল হারবেরিয়াম — Checklist of Vascular Flora of Lathitila Forest (2023)</a>। <a className="font-semibold text-emerald-800 underline" href="https://eflorabd.natureinfo.com.bd/pteridaceae/" target="_blank" rel="noreferrer">CVPB — Pteridaceae checklist (2024)</a>। <a className="font-semibold text-emerald-800 underline" href="https://eflorabd.natureinfo.com.bd/polypodiaceae/" target="_blank" rel="noreferrer">CVPB — Polypodiaceae checklist (2024)</a>। কিছু স্থানীয় নাম ও বৈশিষ্ট্য সংক্ষিপ্ত শিক্ষামূলক বর্ণনা; মাঠপর্যায়ের সনাক্তকরণের বিকল্প নয়।</p>
      </section>}

      {mode==="cards"&&<section className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500"><span>কার্ড {filtered.length?index%filtered.length+1:0} / {filtered.length}</span><span>কার্ডে চাপ দিয়ে উত্তর দেখুন</span></div>
        <button onClick={()=>setRevealed(v=>!v)} className="min-h-[300px] w-full rounded-3xl border border-emerald-900/10 bg-white p-8 text-center shadow-lg transition hover:shadow-xl">
          <span className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">{revealed?"SCIENTIFIC NAME":"PLANT NAME"}</span>
          {!revealed?<><span className="mt-8 block text-4xl font-black">{current.bn}</span><span className="mt-3 block text-lg text-slate-500">{current.en}</span><span className="mt-8 block text-sm text-slate-400">উত্তর দেখতে চাপ দিন</span></>:<><span className="mt-8 block break-words font-serif text-3xl font-bold italic text-emerald-800">{current.scientific}</span><span className="mt-4 block font-bold text-slate-600">Family: {current.family}</span><span className="mx-auto mt-3 block max-w-lg text-sm leading-6 text-slate-500">{current.clue}</span></>}
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3"><button onClick={()=>nextCard(-1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">← আগেরটি</button><button onClick={()=>{setKnown(p=>p.includes(current.scientific)?p:[...p,current.scientific]);setReview(p=>p.filter(x=>x!==current.scientific));nextCard(1);}} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">জানি ✓</button><button onClick={()=>{setReview(p=>p.includes(current.scientific)?p:[...p,current.scientific]);nextCard(1);}} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-bold text-amber-900">আবার শিখব ↻</button><button onClick={()=>nextCard(1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">পরেরটি →</button></div>
      </section>}

      {mode==="quiz"&&<section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-500">প্রশ্ন {quizIndex+1}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">স্কোর: {score}</span></div><h2 className="mt-5 text-xl font-black sm:text-2xl">“{question.bn}” ({question.en}) গাছের বৈজ্ঞানিক নাম কোনটি?</h2><div className="mt-5 grid gap-3">{options.map(o=><button key={o.scientific} disabled={answered} onClick={()=>choose(o.scientific)} className={"rounded-xl border p-4 text-left font-serif text-base italic "+(answered&&o.scientific===question.scientific?"border-emerald-600 bg-emerald-50 text-emerald-900":answered&&choice===o.scientific?"border-red-300 bg-red-50 text-red-800":"border-slate-200 hover:border-emerald-400 disabled:cursor-default")}>{o.scientific}</button>)}</div>{answered&&<div role="status" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">{choice===question.scientific?<p className="font-bold text-emerald-800">সঠিক উত্তর! ভালো করেছেন।</p>:<p className="font-bold text-amber-800">সঠিক উত্তর: {question.scientific}</p>}<p className="mt-1 text-slate-600">Family: {question.family} · {question.clue}</p></div>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={nextQuestion} disabled={!answered} className="rounded-xl bg-emerald-800 px-5 py-3 font-extrabold text-white disabled:opacity-40">পরের প্রশ্ন →</button><button onClick={()=>{setQuizIndex(0);setScore(0);setChoice("");setAnswered(false);}} className="rounded-xl border border-slate-300 px-5 py-3 font-bold">আবার শুরু</button></div></section>}

      <section aria-labelledby="plant-science-faq" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">সাধারণ জিজ্ঞাসা</p>
        <h2 id="plant-science-faq" className="mt-2 text-2xl font-black text-emerald-950">উদ্ভিদ তালিকা সম্পর্কে প্রশ্নোত্তর</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {plantScienceFaqs.map((item) => <article key={item.question} className="py-4 first:pt-0 last:pb-0">
            <h3 className="font-extrabold text-slate-900">{item.question}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
          </article>)}
        </div>
      </section>
      <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>শেখার টিপস:</strong> প্রতিদিন ৫–১০টি নাম অনুশীলন করুন। বৈজ্ঞানিক নামের genus-এর প্রথম অক্ষর বড়, species ছোট হাতের হয়; দুটো শব্দই সাধারণত italic লেখা হয়। উদ্ভিদের বৈজ্ঞানিক নাম ও পরিবার পরীক্ষার আগে আপনার কোর্সের নির্ধারিত রেফারেন্সের সঙ্গে মিলিয়ে নিন। বিষাক্ত বা ঔষধি উদ্ভিদ নিজে খাওয়া/ব্যবহার করবেন না।</section>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-center"><Link href="/learn/plant-disease" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-900">🩺 Plant Disease Learning Lab →</Link><Link href="/learn" className="text-sm font-bold text-emerald-800 hover:underline">কৃষি শেখার কেন্দ্র →</Link></div>
    </div>
  </main>;
}

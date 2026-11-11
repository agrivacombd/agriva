"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Plant = { bn: string; en: string; scientific: string; family: string; group: string; clue: string };
const plants: Plant[] = [
  {bn:"আম",en:"Mango",scientific:"Mangifera indica",family:"Anacardiaceae",group:"Fruit tree",clue:"চিরসবুজ ফলের গাছ; পাকা ফল সুগন্ধি।"},
  {bn:"কাঁঠাল",en:"Jackfruit",scientific:"Artocarpus heterophyllus",family:"Moraceae",group:"Fruit tree",clue:"বাংলাদেশের জাতীয় ফল; বড় যৌগিক ফল।"},
  {bn:"নিম",en:"Neem",scientific:"Azadirachta indica",family:"Meliaceae",group:"Medicinal tree",clue:"পাতা সাধারণত করাতের দাঁতের মতো খাঁজযুক্ত।"},
  {bn:"নারিকেল",en:"Coconut",scientific:"Cocos nucifera",family:"Arecaceae",group:"Palm",clue:"একক কাণ্ডের পাম; আঁশযুক্ত ফল।"},
  {bn:"পেয়ারা",en:"Guava",scientific:"Psidium guajava",family:"Myrtaceae",group:"Fruit tree",clue:"পাতায় স্পষ্ট শিরা; ফলের ভেতরে অনেক বীজ।"},
  {bn:"সজিনা",en:"Drumstick tree",scientific:"Moringa oleifera",family:"Moringaceae",group:"Food tree",clue:"খাদ্যযোগ্য লম্বা শুঁটি ও যৌগিক পাতা।"},
  {bn:"তেঁতুল",en:"Tamarind",scientific:"Tamarindus indica",family:"Fabaceae",group:"Fruit tree",clue:"টক শাঁসযুক্ত ফল; ছোট ছোট পত্রক থাকে।"},
  {bn:"বট",en:"Banyan",scientific:"Ficus benghalensis",family:"Moraceae",group:"Shade tree",clue:"ডাল থেকে ঝুলে নামা বায়বীয় শিকড় দেখা যায়।"},
  {bn:"পলাশ",en:"Flame of the forest",scientific:"Butea monosperma",family:"Fabaceae",group:"Flowering tree",clue:"কমলা-লাল ফুলের জন্য পরিচিত।"},
  {bn:"শিসু",en:"Indian rosewood",scientific:"Dalbergia sissoo",family:"Fabaceae",group:"Timber tree",clue:"মূল্যবান কাঠের গাছ; যৌগিক পাতা।"},
  {bn:"শাল",en:"Sal",scientific:"Shorea robusta",family:"Dipterocarpaceae",group:"Forest tree",clue:"দক্ষিণ এশিয়ার গুরুত্বপূর্ণ বনজ কাঠ।"},
  {bn:"সেগুন",en:"Teak",scientific:"Tectona grandis",family:"Lamiaceae",group:"Timber tree",clue:"বড় ও রুক্ষ পাতা; মূল্যবান কাঠ।"},
  {bn:"জাম",en:"Java plum",scientific:"Syzygium cumini",family:"Myrtaceae",group:"Fruit tree",clue:"গাঢ় বেগুনি ফল; চিরসবুজ গাছ।"},
  {bn:"লিচু",en:"Lychee",scientific:"Litchi chinensis",family:"Sapindaceae",group:"Fruit tree",clue:"খসখসে লাল খোসার মিষ্টি ফল।"},
  {bn:"কদম",en:"Burflower tree",scientific:"Neolamarckia cadamba",family:"Rubiaceae",group:"Flowering tree",clue:"গোলাকার কমলা-হলুদ ফুলের মঞ্জরি।"},
  {bn:"শিমুল",en:"Red silk-cotton tree",scientific:"Bombax ceiba",family:"Malvaceae",group:"Flowering tree",clue:"বসন্তে লাল ফুল; ফলের ভেতর তুলার মতো আঁশ।"},
  {bn:"কৃষ্ণচূড়া",en:"Royal poinciana",scientific:"Delonix regia",family:"Fabaceae",group:"Flowering tree",clue:"ছাতার মতো মুকুট ও উজ্জ্বল লাল-কমলা ফুল।"},
  {bn:"অর্জুন",en:"Arjun tree",scientific:"Terminalia arjuna",family:"Combretaceae",group:"Medicinal tree",clue:"কাণ্ডের ছাল ধূসর; নদীতীরেও দেখা যায়।"},
  {bn:"বকুল",en:"Spanish cherry",scientific:"Mimusops elengi",family:"Sapotaceae",group:"Shade tree",clue:"ছোট সুগন্ধি ফুল; ঘন পাতার মুকুট।"},
  {bn:"তাল",en:"Palmyra palm",scientific:"Borassus flabellifer",family:"Arecaceae",group:"Palm",clue:"পাখার মতো বড় পাতা ও শক্ত ফল।"},
  {bn:"সুপারি",en:"Areca nut palm",scientific:"Areca catechu",family:"Arecaceae",group:"Palm",clue:"সরু কাণ্ডের পাম; ফল সুপারি হিসেবে পরিচিত।"},
  {bn:"রাধাচূড়া",en:"Peacock flower",scientific:"Caesalpinia pulcherrima",family:"Fabaceae",group:"Flowering tree",clue:"ছোট শোভাবর্ধক গাছ; লাল-কমলা ফুল ও লম্বা পুংকেশর।"},
  {bn:"বেল",en:"Bael",scientific:"Aegle marmelos",family:"Rutaceae",group:"Fruit tree",clue:"কঠিন খোসার ফল; পাতা সাধারণত তিনটি পত্রকবিশিষ্ট।"},
  {bn:"জলপাই",en:"Indian olive",scientific:"Elaeocarpus serratus",family:"Elaeocarpaceae",group:"Fruit tree",clue:"টক ফল; বাংলাদেশের পরিচিত জলপাইয়ের একটি প্রচলিত নাম।"},
  {bn:"কাউ",en:"Cowa",scientific:"Garcinia cowa",family:"Clusiaceae",group:"Fruit tree",clue:"সিলেট অঞ্চলের বনাঞ্চলে নথিভুক্ত টক ফলের গাছ।"},
  {bn:"থানকুনি",en:"Indian pennywort",scientific:"Centella asiatica",family:"Apiaceae",group:"Medicinal herb",clue:"মাটির কাছাকাছি লতানো ভেষজ; গোলাকার কিডনি-আকৃতির পাতা।"},
  {bn:"কুটি থানকুনি",en:"Lawn marshpenny",scientific:"Hydrocotyle sibthorpioides",family:"Araliaceae",group:"Wetland herb",clue:"আর্দ্র জায়গায় জন্মানো ছোট লতানো ভেষজ।"},
  {bn:"পান-তুরসি",en:"Water celery",scientific:"Oenanthe javanica",family:"Apiaceae",group:"Edible herb",clue:"জলাভূমি ও ভেজা জমিতে জন্মানো সুগন্ধি ভেষজ।"},
  {bn:"ছাতিম",en:"Devil tree",scientific:"Alstonia scholaris",family:"Apocynaceae",group:"Forest tree",clue:"ডালে সাধারণত চক্রাকারে পাতা; সাদা দুধের মতো কষ থাকে।"},
  {bn:"কুরচি",en:"Conessi tree",scientific:"Holarrhena pubescens",family:"Apocynaceae",group:"Medicinal tree",clue:"ছোট সাদা ফুল ও জোড়ায় ফলধারী শুঁটির মতো ফল।"},
  {bn:"সাপগন্ধা",en:"Indian snakeroot",scientific:"Rauvolfia tetraphylla",family:"Apocynaceae",group:"Medicinal shrub",clue:"লালচে-কালো ফলসহ ছোট গুল্ম; ঔষধি উদ্ভিদ হিসেবে পরিচিত।"},
  {bn:"টগর",en:"Crape jasmine",scientific:"Tabernaemontana divaricata",family:"Apocynaceae",group:"Flowering shrub",clue:"সাদা ঘূর্ণিত পাপড়ির সুগন্ধি শোভাবর্ধক ফুল।"},
  {bn:"হরিণা শাক",en:"Hooker's aglaonema",scientific:"Aglaonema hookerianum",family:"Araceae",group:"Forest herb",clue:"বনের ছায়াযুক্ত স্থানে জন্মানো কচুজাতীয় পাতার উদ্ভিদ।"},
  {bn:"বন কচু",en:"Alocasia",scientific:"Alocasia acuminata",family:"Araceae",group:"Forest herb",clue:"বড় তীরাকৃতি পাতা; আর্দ্র ছায়াযুক্ত পরিবেশে জন্মে।"},
  {bn:"মানকচু",en:"Giant taro",scientific:"Alocasia macrorrhizos",family:"Araceae",group:"Tuber crop",clue:"বিশাল তীরাকৃতি পাতা ও মোটা কন্দযুক্ত উদ্ভিদ।"},
  {bn:"মুখিকচু",en:"Taro",scientific:"Colocasia esculenta",family:"Araceae",group:"Tuber crop",clue:"বাংলাদেশের পরিচিত কন্দ ও পাতার সবজি; হৃদয়াকৃতি পাতা।"},
  {bn:"কাঁটাকচু",en:"Lasia",scientific:"Lasia spinosa",family:"Araceae",group:"Wetland vegetable",clue:"কাঁটাযুক্ত পত্রবৃন্ত; জলাভূমির পরিচিত কচুজাতীয় উদ্ভিদ।"},
  {bn:"লাল শাক",en:"Red amaranth",scientific:"Amaranthus tricolor",family:"Amaranthaceae",group:"Leafy vegetable",clue:"পাতা সবুজ, লাল বা বেগুনি হতে পারে; দ্রুতবর্ধনশীল শাক।"},
  {bn:"কাঁটানটে",en:"Spiny amaranth",scientific:"Amaranthus spinosus",family:"Amaranthaceae",group:"Field weed",clue:"পাতার গোড়ায় জোড়া কাঁটা থাকে; জমিতে আগাছা হিসেবে দেখা যায়।"},
  {bn:"মোরগফুল",en:"Cockscomb",scientific:"Celosia argentea",family:"Amaranthaceae",group:"Flowering herb",clue:"রঙিন ফুলের মঞ্জরি; শোভাবর্ধক ও কিছু অঞ্চলে শাক হিসেবে ব্যবহৃত।"},
  {bn:"চালতা",en:"Elephant apple",scientific:"Dillenia indica",family:"Dilleniaceae",group:"Fruit tree",clue:"বড় কুঁচকানো টক ফল; রান্নায় ব্যবহৃত হয়।"},
  {bn:"বন চালতা",en:"Jongli elephant apple",scientific:"Dillenia pentagyna",family:"Dilleniaceae",group:"Forest tree",clue:"বনাঞ্চলে জন্মানো মাঝারি আকারের গাছ; ফল হয়।"},
  {bn:"বন আলু",en:"Wild yam",scientific:"Dioscorea glabra",family:"Dioscoreaceae",group:"Wild tuber",clue:"আরোহী লতা; মাটির নিচে কন্দ গঠন করে।"},
  {bn:"মিলটনি আলু",en:"Hamilton's yam",scientific:"Dioscorea hamiltonii",family:"Dioscoreaceae",group:"Wild tuber",clue:"বনজ আরোহী লতা; কন্দজাতীয় উদ্ভিদ।"},
  {bn:"চীনা আলু",en:"Chinese yam",scientific:"Dioscorea oppositifolia",family:"Dioscoreaceae",group:"Tuber crop",clue:"আরোহী লতা; খাদ্যোপযোগী কন্দের জন্য পরিচিত।"},
  {bn:"জুম আলু",en:"Five-leaved yam",scientific:"Dioscorea pentaphylla",family:"Dioscoreaceae",group:"Wild tuber",clue:"সাধারণত পাঁচটি পত্রকবিশিষ্ট পাতা; লতানো কন্দজ উদ্ভিদ।"},
  {bn:"তেলি গর্জন",en:"Garjan",scientific:"Dipterocarpus turbinatus",family:"Dipterocarpaceae",group:"Forest tree",clue:"চট্টগ্রাম ও সিলেটের চিরসবুজ বনে পাওয়া যায়; বড় বৃক্ষ।"},
  {bn:"জলপাই",en:"Indian olive",scientific:"Elaeocarpus floribundus",family:"Elaeocarpaceae",group:"Fruit tree",clue:"টক ফল; স্থানীয়ভাবে আচার ও রান্নায় ব্যবহৃত।"},
  {bn:"মুক্তাঝুরি",en:"Indian copperleaf",scientific:"Acalypha indica",family:"Euphorbiaceae",group:"Field herb",clue:"ছোট আগাছাসদৃশ ভেষজ; সরু ফুলের শীষ দেখা যায়।"},
  {bn:"বনশিয়াল",en:"Bignay",scientific:"Antidesma bunius",family:"Phyllanthaceae",group:"Fruit tree",clue:"ঝুলন্ত থোকায় ছোট লাল থেকে কালচে ফল ধরে।"},
  {bn:"লটকন",en:"Burmese grape",scientific:"Baccaurea ramiflora",family:"Phyllanthaceae",group:"Fruit tree",clue:"কাণ্ড ও মোটা ডাল থেকে থোকায় ফল ধরে; টক-মিষ্টি ফল।"},
  {bn:"আমলকী",en:"Indian gooseberry",scientific:"Phyllanthus emblica",family:"Phyllanthaceae",group:"Fruit tree",clue:"খাঁজযুক্ত গোল ফল; ভিটামিন সি-সমৃদ্ধ ফল হিসেবে পরিচিত।"},
  {bn:"ভুঁই আমলা",en:"Gale of the wind",scientific:"Phyllanthus niruri",family:"Phyllanthaceae",group:"Medicinal herb",clue:"ছোট ভেষজ; পাতার নিচে ক্ষুদ্র ফল সারিবদ্ধভাবে ধরে।"},
  {bn:"তিনশিরা",en:"Sauropus",scientific:"Sauropus trinervis",family:"Phyllanthaceae",group:"Forest shrub",clue:"বনাঞ্চলে নথিভুক্ত ছোট গুল্ম; পাতায় স্পষ্ট শিরা।"},
  {bn:"তেলাকুচা",en:"Ivy gourd",scientific:"Coccinia grandis",family:"Cucurbitaceae",group:"Vegetable vine",clue:"আরোহী লতা; কচি ফল ও পাতা সবজি হিসেবে খাওয়া হয়।"},
  {bn:"বন কাঁকরোল",en:"Sweet gourd",scientific:"Momordica cochinchinensis",family:"Cucurbitaceae",group:"Wild vegetable vine",clue:"আরোহী লতা; কাঁটাযুক্ত কমলা-লাল পাকা ফল।"},
  {bn:"আনারস",en:"Pineapple",scientific:"Ananas comosus",family:"Bromeliaceae",group:"Fruit crop",clue:"মাটির কাছাকাছি পাতার রোজেট; যৌগিক ফলের মাথায় পাতার মুকুট।"},
  {bn:"অশোক",en:"Ashoka tree",scientific:"Saraca asoca",family:"Fabaceae",group:"Flowering tree",clue:"কমলা-লাল গুচ্ছফুল; দক্ষিণ এশিয়ার পরিচিত চিরসবুজ বৃক্ষ।"},
  {bn:"কানাইডিঙ্গি",en:"Indian trumpet flower",scientific:"Oroxylum indicum",family:"Bignoniaceae",group:"Medicinal tree",clue:"বড় যৌগিক পাতা ও লম্বা ঝুলন্ত ফলের শুঁটি।"},
  {bn:"বোhera",en:"Belleric myrobalan",scientific:"Terminalia bellirica",family:"Combretaceae",group:"Forest tree",clue:"বড় বৃক্ষ; ফল ত্রিফলার একটি উপাদান হিসেবে পরিচিত।"},
  {bn:"নাগেশ্বর",en:"Ceylon ironwood",scientific:"Mesua ferrea",family:"Calophyllaceae",group:"Forest tree",clue:"সুগন্ধি সাদা ফুল ও শক্ত কাঠের জন্য পরিচিত।"}

];

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
  useEffect(()=>{try { const raw=localStorage.getItem("agriva-plant-learning-v1"); if(raw){const p=JSON.parse(raw);setKnown(Array.isArray(p.known)?p.known:[]);setReview(Array.isArray(p.review)?p.review:[]);} } catch {} setReady(true);},[]);
  useEffect(()=>{if(ready){try{localStorage.setItem("agriva-plant-learning-v1",JSON.stringify({known,review}));}catch{}}},[known,review,ready]);

  const groups = useMemo(()=>["All",...Array.from(new Set(plants.map(p=>p.group)))],[ ]);
  const filtered = useMemo(()=>plants.filter(p=>(group==="All"||p.group===group)&&(!reviewOnly||review.includes(p.scientific))&&[p.bn,p.en,p.scientific,p.family,p.group].some(v=>v.toLowerCase().includes(query.toLowerCase().trim()))),[group,query,reviewOnly,review]);
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
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">গাছ চিনুন, বৈজ্ঞানিক নাম মনে রাখুন</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">কৃষিবিদ ও কৃষি সম্প্রসারণকর্মীদের জন্য গাছের নাম, উদ্ভিদ পরিবার ও বৈশিষ্ট্য দ্রুত রিভিশনের বাংলা-ইংরেজি অনুশীলন টুল।</p>
        <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">{[{v:plants.length,l:"গাছের তথ্য"},{v:known.length,l:"জানা হয়েছে"},{v:review.length,l:"আবার দেখুন"}].map(s=><div key={s.l} className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-black">{s.v}</div><div className="mt-1 text-xs text-emerald-100">{s.l}</div></div>)}</div><div className="mt-5 max-w-xl"><div className="flex justify-between text-xs font-bold text-emerald-50"><span>আজকের শেখার লক্ষ্য</span><span>{Math.min(known.length,5)}/৫</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-lime-300 transition-all" style={{width:`${Math.min(known.length,5)*20}%`}}/></div><p className="mt-2 text-xs text-emerald-100">প্রতিদিন ৫টি বৈজ্ঞানিক নাম মনে রাখার চেষ্টা করুন।</p></div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">{modes.map(m=><button key={m.id} onClick={()=>setMode(m.id)} className={"rounded-xl border p-4 text-left "+(mode===m.id?"border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100":"border-slate-200 bg-white hover:border-emerald-300")}><span className="text-xl">{m.icon}</span><span className="mt-2 block font-extrabold">{m.label}</span></button>)}</div>

      {mode==="library"&&<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="বাংলা, English বা Scientific name দিয়ে খুঁজুন…" className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-700"/><select value={group} onChange={e=>setGroup(e.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-white px-3">{groups.map(g=><option key={g} value={g}>{g==="All"?"সব বিভাগ":g}</option>)}</select></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{filtered.length}টি গাছ পাওয়া গেছে{reviewOnly?" (পুনরায় শেখার তালিকা)":""}</p><div className="flex flex-wrap gap-2"><button onClick={()=>setReviewOnly(v=>!v)} className={"rounded-lg border px-3 py-2 text-sm font-bold "+(reviewOnly?"border-amber-400 bg-amber-50 text-amber-900":"border-slate-200 bg-white text-slate-700")}>{reviewOnly?"সব গাছ দেখুন":"শুধু আবার শিখব ("+review.length+")"}</button><button onClick={()=>{const pool=plants.filter(p=>!known.includes(p.scientific));const pick=pool.length?pool[Math.floor(Math.random()*pool.length)]:plants[Math.floor(Math.random()*plants.length)];setReviewOnly(false);setQuery("");setGroup("All");setIndex(Math.max(0,plants.findIndex(p=>p.scientific===pick.scientific)));setRevealed(false);setMode("cards");}} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">🎲 এলোমেলো গাছ শিখি</button></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p=><article key={p.scientific} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-lg font-black">{p.bn}</p><p className="text-sm text-slate-500">{p.en}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">{p.group}</span></div><p className="mt-4 break-words font-serif text-lg italic text-emerald-800">{p.scientific}</p><p className="mt-2 text-xs font-bold text-slate-500">Family: {p.family}</p><p className="mt-3 text-sm leading-6 text-slate-600">{p.clue}</p><button onClick={()=>{setIndex(Math.max(0,filtered.findIndex(x=>x.scientific===p.scientific)));setRevealed(false);setMode("cards");}} className="mt-4 text-sm font-extrabold text-emerald-800 hover:underline">এই গাছটি অনুশীলন করুন →</button></article>)}</div>
        {filtered.length===0&&<p className="py-10 text-center text-slate-500">মিল পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন।</p>}
      </section>}

      {mode==="cards"&&<section className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500"><span>কার্ড {filtered.length?index%filtered.length+1:0} / {filtered.length}</span><span>কার্ডে চাপ দিয়ে উত্তর দেখুন</span></div>
        <button onClick={()=>setRevealed(v=>!v)} className="min-h-[300px] w-full rounded-3xl border border-emerald-900/10 bg-white p-8 text-center shadow-lg transition hover:shadow-xl">
          <span className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">{revealed?"SCIENTIFIC NAME":"TREE NAME"}</span>
          {!revealed?<><span className="mt-8 block text-4xl font-black">{current.bn}</span><span className="mt-3 block text-lg text-slate-500">{current.en}</span><span className="mt-8 block text-sm text-slate-400">উত্তর দেখতে চাপ দিন</span></>:<><span className="mt-8 block break-words font-serif text-3xl font-bold italic text-emerald-800">{current.scientific}</span><span className="mt-4 block font-bold text-slate-600">Family: {current.family}</span><span className="mx-auto mt-3 block max-w-lg text-sm leading-6 text-slate-500">{current.clue}</span></>}
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3"><button onClick={()=>nextCard(-1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">← আগেরটি</button><button onClick={()=>{setKnown(p=>p.includes(current.scientific)?p:[...p,current.scientific]);setReview(p=>p.filter(x=>x!==current.scientific));nextCard(1);}} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">জানি ✓</button><button onClick={()=>{setReview(p=>p.includes(current.scientific)?p:[...p,current.scientific]);nextCard(1);}} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-bold text-amber-900">আবার শিখব ↻</button><button onClick={()=>nextCard(1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">পরেরটি →</button></div>
      </section>}

      {mode==="quiz"&&<section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-500">প্রশ্ন {quizIndex+1}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">স্কোর: {score}</span></div><h2 className="mt-5 text-xl font-black sm:text-2xl">“{question.bn}” ({question.en}) গাছের বৈজ্ঞানিক নাম কোনটি?</h2><div className="mt-5 grid gap-3">{options.map(o=><button key={o.scientific} disabled={answered} onClick={()=>choose(o.scientific)} className={"rounded-xl border p-4 text-left font-serif text-base italic "+(answered&&o.scientific===question.scientific?"border-emerald-600 bg-emerald-50 text-emerald-900":answered&&choice===o.scientific?"border-red-300 bg-red-50 text-red-800":"border-slate-200 hover:border-emerald-400 disabled:cursor-default")}>{o.scientific}</button>)}</div>{answered&&<div role="status" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">{choice===question.scientific?<p className="font-bold text-emerald-800">সঠিক উত্তর! ভালো করেছেন।</p>:<p className="font-bold text-amber-800">সঠিক উত্তর: {question.scientific}</p>}<p className="mt-1 text-slate-600">Family: {question.family} · {question.clue}</p></div>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={nextQuestion} disabled={!answered} className="rounded-xl bg-emerald-800 px-5 py-3 font-extrabold text-white disabled:opacity-40">পরের প্রশ্ন →</button><button onClick={()=>{setQuizIndex(0);setScore(0);setChoice("");setAnswered(false);}} className="rounded-xl border border-slate-300 px-5 py-3 font-bold">আবার শুরু</button></div></section>}

      <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>শেখার টিপস:</strong> প্রতিদিন ৫–১০টি নাম অনুশীলন করুন। বৈজ্ঞানিক নামের genus-এর প্রথম অক্ষর বড়, species ছোট হাতের হয়; দুটো শব্দই সাধারণত italic লেখা হয়। উদ্ভিদের বৈজ্ঞানিক নাম ও পরিবার পরীক্ষার আগে আপনার কোর্সের নির্ধারিত রেফারেন্সের সঙ্গে মিলিয়ে নিন।</section>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-center"><Link href="/learn/plant-disease" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-900">🩺 Plant Disease Learning Lab →</Link><Link href="/learn" className="text-sm font-bold text-emerald-800 hover:underline">কৃষি শেখার কেন্দ্র →</Link></div>
    </div>
  </main>;
}

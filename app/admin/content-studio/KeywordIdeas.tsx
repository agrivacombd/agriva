"use client";
import { useState } from "react";
type Trend = { query: string; value: string; intent: string };
type Idea = Trend & { source: string; group: string };
const SEEDS = ["ধান চাষ", "সবজি বীজ", "টমেটো চাষ", "কৃষি বীজ"];
export default function KeywordIdeas() {
 const [ideas,setIdeas]=useState<Idea[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [filter,setFilter]=useState("all");
 async function discover() {
  if(loading)return;
  setLoading(true);setError("");setIdeas([]);
  try {
   const responses=await Promise.all(SEEDS.map(async seed=>{
    const response=await fetch("/api/admin/google-trends?q="+encodeURIComponent(seed)+"&period=today%2012-m",{cache:"no-store"});
    const body=await response.json();
    if(!response.ok||!body.configured)throw new Error(body.error||body.message||"Provider unavailable");
    return {seed,body};
   }));
   const unique=new Map<string,Idea>();
   for(const {seed,body} of responses)for(const group of ["rising","top"])for(const item of (body[group]??[]) as Trend[]){
    const key=item.query.trim().toLocaleLowerCase();
    if(!unique.has(key))unique.set(key,{...item,source:seed,group});
   }
   setIdeas([...unique.values()].slice(0,60));
  }catch(e){setError(e instanceof Error?e.message:"Unable to load keyword ideas");}
  finally{setLoading(false);}
 }
 const visible=ideas.filter(x=>filter==="all"||(filter==="product"?x.intent.startsWith("Product"):x.intent.startsWith("Informational")));
 return <section className="mt-9 rounded-3xl border border-[#dce8d8] bg-white p-6 shadow-sm sm:p-8">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a47a20]">Bangladesh · Agriculture only</p><h2 className="mt-2 text-2xl font-black">Automatic keyword suggestions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#647468]">Discover related and rising queries from four agriculture seed topics. Suggestions are sourced from Google Trends through SearchAPI, not invented. Four API requests per discovery.</p></div><button onClick={discover} disabled={loading} className="rounded-xl bg-[#17351f] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading?"Discovering…":"Discover keyword ideas"}</button></div>
  {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  {ideas.length>0&&<div className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{visible.length} suggestions</p><select aria-label="Keyword intent" value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="all">All keywords</option><option value="informational">Informational</option><option value="product">Product / Commercial</option></select></div><div className="mt-4 grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{visible.map(item=><div key={item.query} className="rounded-xl border border-[#e4e9df] p-4"><p className="font-bold">{item.query}</p><p className="mt-2 text-xs text-[#647468]">{item.intent}</p><p className="mt-1 text-xs text-[#647468]">{item.group==="rising"?"Rising":"Top"} · Seed: {item.source}</p><a className="mt-3 inline-block text-xs font-bold text-[#315d3c] underline" href={"https://trends.google.com/trends/explore?geo=BD&q="+encodeURIComponent(item.query)} target="_blank" rel="noopener noreferrer">Verify on Trends</a></div>)}</div><button className="mt-4 rounded-xl border px-4 py-2 text-sm font-bold" onClick={()=>navigator.clipboard.writeText(visible.map(x=>x.query).join("\n")).catch(()=>setError("Copy failed"))}>Copy keyword list</button></div>}
 </section>;
}

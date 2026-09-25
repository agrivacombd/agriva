"use client";
import { useMemo, useState } from "react";

type CropKey = "rice" | "wheat" | "maize" | "potato" | "vegetables";
const crops: Record<CropKey,{label:string;days:number}> = {
  rice:{label:"Rice",days:120}, wheat:{label:"Wheat",days:120}, maize:{label:"Maize",days:110}, potato:{label:"Potato",days:100}, vegetables:{label:"Vegetables",days:70}
};
export default function HarvestDateCalculator(){
 const [crop,setCrop]=useState<CropKey>("rice"); const [date,setDate]=useState(""); const [days,setDays]=useState(String(crops.rice.days));
 const result=useMemo(()=>{if(!date)return null;const d=new Date(`${date}T00:00:00`);const n=Number(days)||0;if(Number.isNaN(d.getTime()))return null;d.setDate(d.getDate()+n);return d.toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});},[date,days]);
 function choose(k:CropKey){setCrop(k);setDays(String(crops[k].days));}
 return <section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Harvest inputs</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold">Crop<select value={crop} onChange={e=>choose(e.target.value as CropKey)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal">{Object.entries(crops).map(([k,x])=><option key={k} value={k}>{x.label}</option>)}</select></label><label className="block text-sm font-bold">Planting date<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/></label><label className="block text-sm font-bold">Expected growth duration (days)<input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/><span className="mt-1 block text-xs font-normal text-[#78867b]">Adjust this to match your crop variety or trusted local guidance.</span></label></div></div><div className="rounded-3xl bg-[#17351f] p-6 text-white"><p className="text-sm text-white/70">Estimated harvest date</p><p className="mt-3 min-h-16 text-4xl font-black">{result ?? "Select a planting date"}</p><p className="mt-4 text-sm text-white/70">{result ? `${crops[crop].label} · ${days} days after planting` : "Your estimate will appear here."}</p><div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">Treat this as a planning estimate. Actual maturity should be checked in the field and can change with variety, weather and crop conditions.</div></div></section>;
}

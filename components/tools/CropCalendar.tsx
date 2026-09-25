"use client";
import { useMemo, useState } from "react";

type Crop = { name: string; planting: string; growth: string; harvest: string; note: string };
const crops: Crop[] = [
  { name: "Rice", planting: "Jun–Aug", growth: "3–5 months", harvest: "Oct–Dec", note: "Timing varies by variety and season." },
  { name: "Wheat", planting: "Nov–Dec", growth: "4–5 months", harvest: "Mar–Apr", note: "Use local variety-specific guidance." },
  { name: "Maize", planting: "Oct–Dec / Mar–Apr", growth: "3–4 months", harvest: "Jan–Apr / Jun–Jul", note: "Season and hybrid affect maturity." },
  { name: "Potato", planting: "Oct–Nov", growth: "3–4 months", harvest: "Jan–Feb", note: "Check local temperature and variety." },
  { name: "Vegetables", planting: "Season dependent", growth: "Variety dependent", harvest: "Staggered", note: "Choose dates based on crop and local conditions." },
];

export default function CropCalendar() {
  const [selected, setSelected] = useState(0);
  const crop = useMemo(() => crops[selected], [selected]);
  return <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-wrap gap-2">{crops.map((x,i)=><button key={x.name} onClick={()=>setSelected(i)} className={`rounded-full px-4 py-2 text-sm font-bold ${i===selected?"bg-[#17351f] text-white":"bg-[#eef5ed] text-[#17351f]"}`}>{x.name}</button>)}</div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-[#f5f7f2] p-5"><p className="text-sm text-[#647468]">Planting window</p><p className="mt-2 text-2xl font-black">{crop.planting}</p></div><div className="rounded-2xl bg-[#f5f7f2] p-5"><p className="text-sm text-[#647468]">Growth period</p><p className="mt-2 text-2xl font-black">{crop.growth}</p></div><div className="rounded-2xl bg-[#f5f7f2] p-5"><p className="text-sm text-[#647468]">Harvest window</p><p className="mt-2 text-2xl font-black">{crop.harvest}</p></div></div><div className="mt-5 rounded-2xl border border-[#dfe8dd] p-5"><p className="font-bold">Planning note</p><p className="mt-2 text-sm leading-6 text-[#647468]">{crop.note} AGRIVA can later personalize this calendar from your planting date, location and available weather data.</p></div></section>;
}

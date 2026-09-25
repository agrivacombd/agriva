"use client";
import { useMemo, useState } from "react";

type CropKey = "rice" | "maize" | "wheat" | "potato" | "vegetables";
const references: Record<CropKey, { label: string; rateKgPerAcre: number }> = {
  rice: { label: "Rice (reference rate)", rateKgPerAcre: 18 },
  maize: { label: "Maize (reference rate)", rateKgPerAcre: 8 },
  wheat: { label: "Wheat (reference rate)", rateKgPerAcre: 40 },
  potato: { label: "Potato (reference rate)", rateKgPerAcre: 550 },
  vegetables: { label: "Vegetables (reference rate)", rateKgPerAcre: 2 },
};

export default function SeedRateCalculator() {
  const [crop, setCrop] = useState<CropKey>("rice");
  const [area, setArea] = useState("1");
  const [price, setPrice] = useState("100");
  const result = useMemo(() => { const qty = Math.max(0, Number(area) || 0) * references[crop].rateKgPerAcre; const cost = qty * Math.max(0, Number(price) || 0); return { qty, cost }; }, [area, crop, price]);
  return <section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Seed inputs</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold">Crop<select value={crop} onChange={e=>setCrop(e.target.value as CropKey)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal">{Object.entries(references).map(([key,x])=><option key={key} value={key}>{x.label}</option>)}</select></label><label className="block text-sm font-bold">Land area (acre)<input type="number" min="0" step="0.01" value={area} onChange={e=>setArea(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/></label><label className="block text-sm font-bold">Seed price (৳ / kg)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/></label></div></div><div className="rounded-3xl bg-[#17351f] p-6 text-white"><p className="text-sm text-white/70">Estimated seed requirement</p><p className="mt-3 text-5xl font-black">{result.qty.toFixed(1)} kg</p><p className="mt-4 text-lg font-bold">Estimated seed budget: ৳{result.cost.toLocaleString(undefined,{maximumFractionDigits:0})}</p><p className="mt-2 text-sm text-white/60">Reference rate: {references[crop].rateKgPerAcre} kg/acre</p><div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">Reference rates are illustrative planning values. Confirm the rate for your variety and planting method before purchasing seed.</div></div></section>;
}

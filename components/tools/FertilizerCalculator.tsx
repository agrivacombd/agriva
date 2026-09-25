"use client";
import { useMemo, useState } from "react";

type CropKey = "rice" | "maize" | "wheat" | "potato" | "vegetables";
const references: Record<CropKey, { label: string; rateKgPerAcre: number }> = {
  rice: { label: "Rice (reference rate)", rateKgPerAcre: 35 },
  maize: { label: "Maize (reference rate)", rateKgPerAcre: 30 },
  wheat: { label: "Wheat (reference rate)", rateKgPerAcre: 25 },
  potato: { label: "Potato (reference rate)", rateKgPerAcre: 45 },
  vegetables: { label: "Vegetables (reference rate)", rateKgPerAcre: 30 },
};

export default function FertilizerCalculator() {
  const [crop, setCrop] = useState<CropKey>("rice");
  const [area, setArea] = useState("1");
  const [factor, setFactor] = useState("1");
  const result = useMemo(() => Number(area || 0) * references[crop].rateKgPerAcre * Number(factor || 0), [area, crop, factor]);
  return <section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Fertilizer inputs</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold">Crop<select value={crop} onChange={e=>setCrop(e.target.value as CropKey)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal">{Object.entries(references).map(([key,x])=><option key={key} value={key}>{x.label}</option>)}</select></label><label className="block text-sm font-bold">Land area (acre)<input type="number" min="0" step="0.01" value={area} onChange={e=>setArea(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/></label><label className="block text-sm font-bold">Adjustment factor<input type="number" min="0" step="0.1" value={factor} onChange={e=>setFactor(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"/><span className="mt-1 block text-xs font-normal text-[#78867b]">Use 1.0 for the reference calculation. Do not use this to override local agronomic advice.</span></label></div></div><div className="rounded-3xl bg-[#17351f] p-6 text-white"><p className="text-sm text-white/70">Estimated reference quantity</p><p className="mt-3 text-5xl font-black">{result.toFixed(1)} kg</p><p className="mt-3 text-sm text-white/70">Reference rate: {references[crop].rateKgPerAcre} kg/acre</p><div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">For real application, confirm crop stage, soil test results, nutrient requirement and locally approved recommendations first.</div></div></section>;
}

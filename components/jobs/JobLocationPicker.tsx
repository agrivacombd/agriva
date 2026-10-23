"use client";

import { useState } from "react";

export default function JobLocationPicker() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const parsedLat = Number(lat), parsedLon = Number(lon);
  const valid = lat.trim() !== "" && lon.trim() !== "" && Number.isFinite(parsedLat) && Number.isFinite(parsedLon) && parsedLat >= -90 && parsedLat <= 90 && parsedLon >= -180 && parsedLon <= 180;
  const centerLat = valid ? parsedLat : 23.685;
  const centerLon = valid ? parsedLon : 90.3563;
  const delta = 0.025;
  const bbox = [centerLon-delta,centerLat-delta,centerLon+delta,centerLat+delta].join("%2C");
  const embed = "https://www.openstreetmap.org/export/embed.html?bbox="+bbox+"&layer=mapnik"+(valid?"&marker="+centerLat+"%2C"+centerLon:"");
  return <div className="sm:col-span-2">
    <p className="text-sm font-bold">ম্যাপে কাজের স্থান নির্বাচন</p>
    <p className="mt-1 text-xs leading-5 text-slate-500">ম্যাপে জায়গাটি দেখে অক্ষাংশ (Latitude) ও দ্রাঘিমাংশ (Longitude) দিন। সঠিক বাড়ির বদলে কাছের পরিচিত স্থান ব্যবহার করাই নিরাপদ।</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" value={lat} onChange={e=>setLat(e.target.value)} placeholder="যেমন 24.7937" className="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="text-sm font-bold">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" value={lon} onChange={e=>setLon(e.target.value)} placeholder="যেমন 88.9318" className="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal"/></label>
    </div>
    <div className="mt-3 overflow-hidden rounded-xl border bg-slate-100"><iframe title="কাজের এলাকার মানচিত্র" src={embed} loading="lazy" className="h-64 w-full border-0" referrerPolicy="no-referrer" /></div>
    <div className="mt-2 flex flex-wrap gap-3 text-sm"><a target="_blank" rel="noopener noreferrer" href={"https://www.openstreetmap.org/#map=15/"+centerLat+"/"+centerLon} className="font-bold text-emerald-800 underline">OpenStreetMap-এ জায়গা খুঁজুন ↗</a>{valid&&<a target="_blank" rel="noopener noreferrer" href={"https://www.google.com/maps/dir/?api=1&destination="+parsedLat+","+parsedLon} className="font-bold text-emerald-800 underline">Google Maps-এ যাচাই ↗</a>}</div>
  </div>;
}

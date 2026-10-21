"use client";

import { useState } from "react";

const locations = [
  { name: "ঢাকা", lat: 23.8103, lon: 90.4125 },
  { name: "রাজশাহী", lat: 24.3745, lon: 88.6042 },
  { name: "নওগাঁ", lat: 24.7936, lon: 88.9318 },
  { name: "রংপুর", lat: 25.7439, lon: 89.2752 },
  { name: "ময়মনসিংহ", lat: 24.7471, lon: 90.4203 },
  { name: "খুলনা", lat: 22.8456, lon: 89.5403 },
  { name: "বরিশাল", lat: 22.7010, lon: 90.3535 },
  { name: "চট্টগ্রাম", lat: 22.3569, lon: 91.7832 },
  { name: "সিলেট", lat: 24.8949, lon: 91.8687 },
  { name: "কুমিল্লা", lat: 23.4607, lon: 91.1809 },
];

type Forecast = { current?: { temperature_2m: number; relative_humidity_2m: number; precipitation: number; wind_speed_10m: number; weather_code: number }; daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; weather_code: number[] } };

function weatherLabel(code: number) {
  if (code === 0) return "পরিষ্কার আকাশ";
  if ([1, 2, 3].includes(code)) return "আংশিক মেঘলা";
  if ([45, 48].includes(code)) return "কুয়াশা";
  if ([51, 53, 55, 56, 57].includes(code)) return "গুঁড়ি গুঁড়ি বৃষ্টি";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "বৃষ্টির সম্ভাবনা";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "তুষারপাত";
  if ([95, 96, 99].includes(code)) return "বজ্রঝড়ের সম্ভাবনা";
  return "আবহাওয়ার তথ্য";
}

export default function WeatherPanel() {
  const [selected, setSelected] = useState("নওগাঁ");
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadForecast() {
    const place = locations.find((item) => item.name === selected) ?? locations[2];
    setLoading(true); setError("");
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat + "&longitude=" + place.lon + "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FDhaka&forecast_days=5";
      const response = await fetch(url);
      if (!response.ok) throw new Error("আবহাওয়ার তথ্য পাওয়া যায়নি।");
      setForecast(await response.json() as Forecast);
    } catch {
      setError("এখন আবহাওয়ার তথ্য আনা যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <a href="/tools" className="text-sm font-bold text-emerald-800 hover:underline">← কৃষি টুলবক্সে ফিরুন</a>
      <header className="mt-5 rounded-[2rem] bg-gradient-to-br from-sky-950 to-emerald-800 p-7 text-white sm:p-10">
        <p className="text-sm font-bold text-sky-200">আবহাওয়া ও কৃষি পরিকল্পনা</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">আপনার এলাকার আবহাওয়া</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50">এলাকা বেছে নিয়ে বর্তমান আবহাওয়া ও আগামী ৫ দিনের পূর্বাভাস দেখুন। তথ্য Open-Meteo থেকে আসে।</p>
      </header>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <label className="block text-sm font-bold text-slate-700">জেলা/এলাকা নির্বাচন করুন
          <select value={selected} onChange={(e) => { setSelected(e.target.value); setForecast(null); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:max-w-sm">{locations.map((place) => <option key={place.name} value={place.name}>{place.name}</option>)}</select>
        </label>
        <button onClick={loadForecast} disabled={loading} className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{loading ? "তথ্য আনা হচ্ছে..." : "আবহাওয়া দেখুন"}</button>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {forecast?.current && <div className="mt-6">
          <div className="rounded-2xl bg-emerald-50 p-5"><p className="font-bold text-emerald-900">{selected} · বর্তমান অবস্থা</p><p className="mt-2 text-4xl font-black text-emerald-950">{Math.round(forecast.current.temperature_2m)}°C</p><p className="mt-1 text-sm text-emerald-900">{weatherLabel(forecast.current.weather_code)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="আর্দ্রতা" value={forecast.current.relative_humidity_2m + "%"} /><Metric label="বৃষ্টিপাত" value={forecast.current.precipitation + " মিমি"} /><Metric label="বাতাসের গতি" value={forecast.current.wind_speed_10m + " কিমি/ঘণ্টা"} /></div>
          </div>
          {forecast.daily && <><h2 className="mt-7 text-xl font-black">আগামী ৫ দিন</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{forecast.daily.time.map((date, i) => <article key={date} className="rounded-xl border border-slate-200 p-4"><p className="font-extrabold">{new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", weekday: "short", timeZone: "Asia/Dhaka" }).format(new Date(date + "T12:00:00"))}</p><p className="mt-2 text-sm text-slate-600">{weatherLabel(forecast.daily!.weather_code[i])}</p><p className="mt-2 text-lg font-black">{Math.round(forecast.daily!.temperature_2m_min[i])}° – {Math.round(forecast.daily!.temperature_2m_max[i])}°C</p><p className="mt-1 text-sm text-sky-800">বৃষ্টির সম্ভাবনা: {forecast.daily!.precipitation_probability_max[i]}%</p></article>)}</div></>}
        </div>}
      </section>
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-extrabold text-amber-950">কৃষকের জন্য সতর্কতা</h2><p className="mt-2 text-sm leading-6 text-amber-900">পূর্বাভাস সম্ভাবনাভিত্তিক; স্থানীয় বৃষ্টি ও মাঠের অবস্থা আলাদা হতে পারে। কীটনাশক প্রয়োগ, সেচ বা ফসল কাটার সিদ্ধান্তের আগে সরকারি আবহাওয়া বুলেটিন এবং স্থানীয় কৃষি কর্মকর্তার পরামর্শ যাচাই করুন.</p><a className="mt-3 inline-block text-sm font-bold text-amber-950 underline" href="https://www.bmd.gov.bd/" target="_blank" rel="noreferrer">বাংলাদেশ আবহাওয়া অধিদপ্তর ↗</a></section>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-extrabold text-slate-900">{value}</p></div>;
}

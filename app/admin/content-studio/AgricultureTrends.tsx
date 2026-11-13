"use client";
import { useState, type FormEvent } from "react";
type Trend = { query: string; value: string; intent: string };
type Result = { configured?: boolean; message?: string; error?: string; keyword?: string; period?: string; top?: Trend[]; rising?: Trend[]; fetchedAt?: string };
export default function AgricultureTrends() {
  const [keyword, setKeyword] = useState("ধান চাষ");
  const [period, setPeriod] = useState("today 12-m");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setResult(null);
    try {
      const response = await fetch(`/api/admin/google-trends?q=${encodeURIComponent(keyword.trim())}&period=${encodeURIComponent(period)}`, { cache: "no-store" });
      const data = await response.json();
      setResult(response.ok ? data : { error: data.error ?? "Unable to load Trends." });
    } catch { setResult({ error: "Network error. Try again." }); } finally { setLoading(false); }
  }
  const googleUrl = `https://www.google.com/search?gl=bd&q=${encodeURIComponent(keyword)}`;
  return <section className="mt-9 rounded-3xl border border-[#e4e9df] bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a47a20]">Bangladesh · Search intelligence</p><h2 className="mt-2 text-2xl font-black">Agriculture Google Search Insights</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#647468]">Bangladesh-only agriculture keywords: informational crop guides and product/commercial searches. Unrelated queries are filtered out. Intent labels are estimates, not Google-provided data; Serper does not provide Google Trends growth metrics or exact search volume.</p></div><a href={googleUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-2 text-sm font-bold">Search on Google ↗</a></div><form onSubmit={load} className="mt-6 flex flex-wrap items-end gap-3"><label className="min-w-[220px] flex-1 text-sm font-semibold">Agriculture keyword<input value={keyword} onChange={e=>setKeyword(e.target.value)} maxLength={100} required className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="ধান চাষ"/></label><label className="text-sm font-semibold">Period<select value={period} onChange={e=>setPeriod(e.target.value)} className="mt-2 block rounded-xl border px-4 py-3"><option value="today 3-m">3 months</option><option value="today 12-m">12 months</option><option value="today 5-y">5 years</option></select></label><button disabled={loading || !keyword.trim()} className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? "Loading…" : "Fetch trends"}</button></form>{result?.message && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{result.message}</p>}{result?.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900">{result.error}</p>}{result?.configured && <div className="mt-7 grid gap-6 lg:grid-cols-2">{(["top","rising"] as const).map(type=><div key={type}><h3 className="text-lg font-bold">{type === "top" ? "Related searches" : "People also ask"}</h3><div className="mt-3 overflow-hidden rounded-xl border">{(result[type] ?? []).length ? result[type]!.map((item,index)=><div key={index} className="flex flex-wrap justify-between gap-2 border-b p-3 text-sm last:border-b-0"><div><p className="font-semibold">{item.query}</p><p className="mt-1 text-xs text-[#647468]">{item.intent}</p></div><span className="font-bold">{item.value}</span></div>) : <p className="p-4 text-sm text-[#647468]">No matching related queries returned for this term.</p>}</div></div>)}</div>}{result?.fetchedAt && <p className="mt-4 text-xs text-[#647468]">Source: Serper.dev Google Search · Retrieved {new Date(result.fetchedAt).toLocaleString("en-BD")}</p>}</section>;
}

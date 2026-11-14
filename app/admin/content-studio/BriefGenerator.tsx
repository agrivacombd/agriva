"use client";
import { useState, type FormEvent } from "react";

type Brief = { title?: string; outline?: string[]; faq?: string[]; seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] } };
export default function BriefGenerator() {
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState("Bengali");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!keyword.trim() || loading) return;
    setLoading(true); setError(""); setBrief(null);
    try {
      const response = await fetch("/api/admin/content-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: keyword.trim(), language }) });
      const data = await response.json();
      if (!response.ok || !data?.brief) throw new Error(typeof data?.error === "string" ? data.error : "Could not generate the brief.");
      setBrief(data.brief);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoading(false); }
  }
  return <div className="mt-6"><form onSubmit={generate} className="space-y-4"><label className="block text-sm font-semibold" htmlFor="cms-keyword">Target keyword</label><input id="cms-keyword" maxLength={160} required value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="যেমন: মিষ্টিকুমড়া চাষ পদ্ধতি" className="w-full rounded-xl border border-[#dbe3d8] bg-white px-4 py-3 outline-none focus:border-[#315d3c] focus:ring-2 focus:ring-[#cfe5d0]"/><div className="flex flex-wrap gap-3"><label className="flex-1 text-sm font-semibold" htmlFor="cms-language"><span className="mb-2 block">Brief language</span><select id="cms-language" value={language} onChange={(event)=>setLanguage(event.target.value)} className="w-full rounded-xl border border-[#dbe3d8] bg-white px-4 py-3"><option value="Bengali">বাংলা</option><option value="English">English</option></select></label><button type="submit" disabled={loading || !keyword.trim()} className="self-end rounded-xl bg-[#17351f] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Generating…" : "Generate brief"}</button></div></form>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}{brief && <section aria-label="Generated content brief" className="mt-7 space-y-5 rounded-2xl border border-[#dbe3d8] bg-[#f8faf7] p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-[#44734b]">Draft brief · Not saved</p><h3 className="mt-2 text-xl font-black">{brief.title}</h3></div><div><h4 className="font-bold">Suggested outline</h4><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#53665a]">{(brief.outline ?? []).map((item,index)=><li key={index}>{item}</li>)}</ol></div><div><h4 className="font-bold">FAQ ideas</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#53665a]">{(brief.faq ?? []).map((item,index)=><li key={index}>{item}</li>)}</ul></div><div className="rounded-xl bg-white p-4 text-sm"><h4 className="font-bold">SEO metadata</h4><p className="mt-2"><strong>Title:</strong> {brief.seo?.metaTitle}</p><p className="mt-2"><strong>Description:</strong> {brief.seo?.metaDescription}</p><p className="mt-2"><strong>Keywords:</strong> {(brief.seo?.keywords ?? []).join(", ")}</p></div><button type="button" onClick={()=>navigator.clipboard.writeText(JSON.stringify(brief,null,2)).catch(()=>setError("Copy failed; select and copy the text manually."))} className="rounded-xl border border-[#315d3c] px-4 py-2 text-sm font-bold">Copy brief JSON</button></section>}</div>;
}

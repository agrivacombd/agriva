"use client";
import { useState } from "react";

type Suggestion = { seo_title: string; seo_description: string; focus_keyword: string; seo_keywords: string[]; highlights: string[]; image_alt: string; improved_description: string };
export default function AdminProductAiSeo({ productId, initialSeo }: { productId: string; initialSeo?: Partial<Suggestion> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const current = suggestion || initialSeo;
  const checks = current ? [
    { label: "SEO title (30–60 characters)", ok: (current.seo_title || "").trim().length >= 30 && (current.seo_title || "").trim().length <= 60 },
    { label: "Meta description (120–160 characters)", ok: (current.seo_description || "").trim().length >= 120 && (current.seo_description || "").trim().length <= 160 },
    { label: "Focus keyword", ok: (current.focus_keyword || "").trim().length >= 2 },
    { label: "Related keywords", ok: (current.seo_keywords || []).filter(Boolean).length >= 2 },
    { label: "Verified product highlights", ok: (current.highlights || []).filter(Boolean).length >= 3 },
    { label: "Descriptive image alt text", ok: (current.image_alt || "").trim().length >= 5 },
  ] : [];
  const completed = checks.filter(item => item.ok).length;
  async function save() {
    if (!suggestion) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/admin/products/seo", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, ...suggestion }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  async function generate() {
    setLoading(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/admin/products/ai-seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Generation failed");
      setSuggestion(result.suggestion);
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed"); }
    finally { setLoading(false); }
  }
  return <section className="md:col-span-2 xl:col-span-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-[#17452c]">AI Product SEO Assistant</h3><p className="mt-1 text-xs text-[#637266]">ChatGPT API দিয়ে বর্তমান পণ্যের তথ্য বিশ্লেষণ করুন। AI-এর লেখা যাচাই ছাড়া প্রকাশ করবেন না।</p></div><button type="button" disabled={loading} onClick={generate} className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Analyzing…" : "✨ Generate SEO suggestions"}</button></div>
    {checks.length > 0 && <div className="mt-4 rounded-xl border bg-white p-3"><div className="flex items-center justify-between gap-2 text-sm font-bold"><span>SEO completeness {suggestion ? "(AI suggestion)" : "(saved data)"}</span><span>{completed}/{checks.length} · {Math.round(completed/checks.length*100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-700" style={{width: (completed/checks.length*100)+"%"}}/></div><ul className="mt-3 grid gap-2 sm:grid-cols-2">{checks.map(item=><li key={item.label} className="text-xs"><span className={item.ok ? "text-emerald-700" : "text-amber-700"}>{item.ok ? "✓" : "○"}</span> {item.label}</li>)}</ul><p className="mt-2 text-xs text-slate-500">Completeness is a content checklist, not a Google ranking prediction.</p></div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {suggestion && <div className="mt-4 space-y-3 rounded-xl border bg-white p-4">
      <p className="text-sm font-bold">Review suggestions · These are not saved automatically</p>
      <label className="block text-xs font-bold">SEO Title<input className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" value={suggestion.seo_title} onChange={e=>setSuggestion({...suggestion,seo_title:e.target.value})}/></label>
      <label className="block text-xs font-bold">Meta Description<textarea className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" rows={3} value={suggestion.seo_description} onChange={e=>setSuggestion({...suggestion,seo_description:e.target.value})}/></label>
      <label className="block text-xs font-bold">Focus Keyword<input className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" value={suggestion.focus_keyword} onChange={e=>setSuggestion({...suggestion,focus_keyword:e.target.value})}/></label>
      <label className="block text-xs font-bold">Related Keywords (comma-separated)<input className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" value={suggestion.seo_keywords.join(", ")} onChange={e=>setSuggestion({...suggestion,seo_keywords:e.target.value.split(",").map(x=>x.trim())})}/></label>
      <label className="block text-xs font-bold">Product Highlights (one per line)<textarea className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" rows={3} value={suggestion.highlights.join("\n")} onChange={e=>setSuggestion({...suggestion,highlights:e.target.value.split("\n")})}/></label>
      <label className="block text-xs font-bold">Image Alt Text<input className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" value={suggestion.image_alt} onChange={e=>setSuggestion({...suggestion,image_alt:e.target.value})}/></label>
      <details><summary className="cursor-pointer text-sm font-bold">Suggested product description (HTML preview as text)</summary><textarea className="mt-2 w-full rounded-lg border p-2 font-mono text-xs" rows={9} value={suggestion.improved_description} onChange={e=>setSuggestion({...suggestion,improved_description:e.target.value})}/></details>
      <div className="rounded-lg border p-3"><p className="text-xs font-bold text-slate-500">Google search preview (approximate)</p><p className="mt-1 text-base font-semibold text-blue-700">{suggestion.seo_title}</p><p className="text-sm text-slate-600">{suggestion.seo_description}</p></div>
      <p className="text-xs text-amber-800">শুধু যাচাই করা তথ্য Save করুন। Description preview আলাদা করে মূল Editor-এ প্রয়োগ করতে হবে; এটি SEO Save-এর অংশ নয়।</p>
      <button type="button" onClick={save} disabled={saving || loading} className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save reviewed SEO fields"}</button>
      {saved && <p role="status" className="text-sm font-bold text-emerald-800">SEO fields saved. Publication status unchanged.</p> }
    </div>}
  </section>;
}

"use client";
import { useState } from "react";

type Suggestion = { seo_title: string; seo_description: string; focus_keyword: string; seo_keywords: string[]; highlights: string[]; image_alt: string; improved_description: string };
export default function AdminProductAiSeo({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  async function generate() {
    setLoading(true); setError("");
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
      <p className="text-xs text-amber-800">Preview only: SEO fields are not persisted by the current Admin save RPC. A dedicated, authorized save flow is required before enabling Apply.</p>
    </div>}
  </section>;
}

"use client";

import { useState } from "react";

type ContentBrief = {
  title: string;
  language: string;
  audience: string;
  outline: string[];
  faq: string[];
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
};

export default function ContentStudioPage() {
  const [keyword, setKeyword] = useState("");
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword || loading) return;

    setLoading(true);
    setError("");
    setBrief(null);

    try {
      const response = await fetch("/api/admin/content-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: trimmedKeyword, language: "English" }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "Brief তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      if (!data?.brief || !Array.isArray(data.brief.outline) || !Array.isArray(data.brief.faq)) {
        setError("Brief-এর response সঠিক নয়। আবার চেষ্টা করুন।");
        return;
      }

      setBrief(data.brief as ContentBrief);
    } catch {
      setError("নেটওয়ার্ক সমস্যা হয়েছে। সংযোগ যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]">
      <div className="mx-auto max-w-5xl">
        <p className="font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Content Studio</p>
        <h1 className="mt-2 text-4xl font-black">Editorial Brief Builder</h1>
        <p className="mt-3 text-[#647468]">
          Create a structured starting brief from a keyword. This endpoint currently uses a deterministic template—not an AI provider—and does not save or publish content.
        </p>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Before publication:</strong> Treat the outline and FAQs as placeholders. Verify agronomic advice against trusted local sources. To create a database-backed draft, use Search Intelligence and the SEO Content Drafts review workflow.
        </section>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void generate();
          }}
        >
          <label className="sr-only" htmlFor="content-keyword">Target keyword</label>
          <input
            id="content-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            maxLength={160}
            required
            className="min-h-14 flex-1 rounded-2xl border bg-white px-5"
            placeholder="e.g. rice leaf disease"
          />
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="rounded-2xl bg-[#17351f] px-7 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Preparing brief…" : "Build template brief"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {brief && (
          <section className="mt-8 space-y-6 rounded-3xl bg-white p-7 shadow-sm" aria-live="polite">
            <div>
              <p className="text-sm font-bold text-[#1f7a45]">TEMPLATE BRIEF · {brief.language}</p>
              <h2 className="mt-1 text-2xl font-black">{brief.title}</h2>
              <p className="mt-2 text-sm text-[#647468]">Audience: {brief.audience}</p>
            </div>
            <div>
              <p className="font-bold">Outline</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[#647468]">
                {brief.outline.map((item, index) => <li key={index}>{item}</li>)}
              </ol>
            </div>
            <div>
              <p className="font-bold">FAQ prompts</p>
              <ul className="mt-3 space-y-2 text-[#647468]">
                {brief.faq.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#eef5ed] p-5">
              <p className="font-bold">SEO metadata suggestions</p>
              <p className="mt-2 text-sm"><strong>Meta title:</strong> {brief.seo.metaTitle}</p>
              <p className="mt-2 text-sm"><strong>Description:</strong> {brief.seo.metaDescription}</p>
              <p className="mt-2 text-sm"><strong>Keywords:</strong> {brief.seo.keywords.join(", ")}</p>
            </div>
            <p className="text-sm text-[#647468]">This brief exists only in this view. It has not been saved as a content draft and cannot be published from this screen.</p>
          </section>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type Brief = {
  title: string;
  language: string;
  audience: string;
  contentType: string;
  searchIntent: string;
  angle: string;
  outline: string[];
  faq: string[];
  researchChecklist: string[];
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
  generatedWith: "template";
};

const audiences = [
  { value: "farmers", label: "কৃষক" },
  { value: "gardeners", label: "বাগানপ্রেমী" },
  { value: "agri-business", label: "কৃষি উদ্যোক্তা ও ব্যবসায়ী" },
  { value: "general", label: "সাধারণ পাঠক" },
];
const contentTypes = [
  { value: "how-to", label: "ব্যবহারিক গাইড" },
  { value: "problem-solving", label: "সমস্যা ও সমাধান" },
  { value: "seasonal", label: "মৌসুমি গাইড" },
  { value: "comparison", label: "তুলনামূলক বিশ্লেষণ" },
  { value: "business", label: "কৃষি ব্যবসা" },
];

export default function ContentStudioPage() {
  const [keyword, setKeyword] = useState(() => typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("keyword") ?? "").slice(0, 160));
  const [language, setLanguage] = useState("Bengali");
  const [audience, setAudience] = useState("farmers");
  const [contentType, setContentType] = useState("how-to");
  const [intent, setIntent] = useState("informational");
  const [researchNotes, setResearchNotes] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [articleBody, setArticleBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<Array<{ id: string; title: string; primary_keyword: string; body_markdown: string | null; meta_title: string | null; meta_description: string | null; outline: string[]; faq: string[]; search_intent: string }>>([]);

  async function loadSavedDrafts() {
    try {
      const response = await fetch("/api/admin/content-drafts");
      const data = await response.json();
      if (response.ok) setSavedDrafts(data.drafts ?? []);
    } catch { /* Draft loading is optional until the admin session is ready. */ }
  }

  useEffect(() => { void loadSavedDrafts(); }, []);


  const markdown = useMemo(() => {
    if (!brief) return "";
    const outline = brief.outline.map((heading) => `## ${heading}\n\n[এখানে যাচাইকৃত তথ্য, ব্যবহারিক নির্দেশনা ও সূত্রসহ লিখুন।]`).join("\n\n");
    const faq = brief.faq.map((question) => `### ${question}\n\n[যাচাইকৃত সংক্ষিপ্ত উত্তর লিখুন।]`).join("\n\n");
    return [
      `# ${brief.title}`,
      articleBody.trim() || outline,
      "## সাধারণ প্রশ্ন",
      faq,
      researchNotes.trim() ? `## Research notes (editor only)\n\n${researchNotes.trim()}` : "",
      "---",
      `Meta title: ${brief.seo.metaTitle}`,
      `Meta description: ${brief.seo.metaDescription}`,
      `Primary keyword: ${keyword}`,
      `Related keywords: ${brief.seo.keywords.join(", ")}`,
    ].filter(Boolean).join("\n\n");
  }, [articleBody, brief, keyword, researchNotes]);

  async function generate() {
    if (!keyword.trim()) {
      setError("প্রথমে একটি মূল বিষয় বা keyword লিখুন।");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/content-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), language, audience, contentType, intent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Brief তৈরি করা যায়নি।");
      setBrief(data.brief ?? null);
      setArticleBody("");
      setNotice(data.generatedWith === "template"
        ? "Structured template তৈরি হয়েছে। AI research বা live keyword data এখনো সংযুক্ত নয়—প্রকাশের আগে তথ্য ও সূত্র যোগ করুন।"
        : "Brief তৈরি হয়েছে। প্রকাশের আগে তথ্য ও সূত্র যাচাই করুন।");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brief তৈরি করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!brief || !keyword.trim()) {
      setError("Draft save করার আগে একটি content brief তৈরি করুন।");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/content-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(draftId ? { id: draftId } : {}),
          title: brief.title,
          primaryKeyword: keyword.trim(),
          searchIntent: intent,
          outline: brief.outline,
          faq: brief.faq,
          bodyMarkdown: articleBody,
          metaTitle: brief.seo.metaTitle,
          metaDescription: brief.seo.metaDescription,
          secondaryKeywords: brief.seo.keywords,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft save করা যায়নি।");
      setDraftId(data.draft.id);
      setNotice("Draft database-এ সংরক্ষিত হয়েছে। এটি publish করা হয়নি।");
      await loadSavedDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft save করা যায়নি।");
    } finally {
      setSaving(false);
    }
  }

  function openSavedDraft(id: string) {
    const draft = savedDrafts.find((item) => item.id === id);
    if (!draft) return;
    setDraftId(draft.id);
    setKeyword(draft.primary_keyword);
    setIntent(draft.search_intent);
    setArticleBody(draft.body_markdown ?? "");
    setBrief({
      title: draft.title,
      language: "Bengali",
      audience: "farmers",
      contentType: "how-to",
      searchIntent: draft.search_intent,
      angle: "",
      outline: draft.outline ?? [],
      faq: draft.faq ?? [],
      researchChecklist: ["প্রকাশের আগে তথ্য ও সূত্র যাচাই করুন।"],
      seo: { metaTitle: draft.meta_title ?? draft.title, metaDescription: draft.meta_description ?? "", keywords: [draft.primary_keyword] },
      generatedWith: "template",
    });
    setNotice("Saved draft খোলা হয়েছে। সম্পাদনার পর আবার Save draft চাপুন।");
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setNotice("Markdown clipboard-এ কপি হয়েছে। এটি এখনো CMS-এ সংরক্ষিত বা প্রকাশিত হয়নি।");
    } catch {
      setError("Clipboard access পাওয়া যায়নি। Markdown নির্বাচন করে কপি করুন।");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Editorial Workspace</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-black sm:text-4xl">Content Intelligence Studio</h1><p className="mt-3 max-w-3xl leading-7 text-[#647468]">এক জায়গায় topic brief, article draft, SEO metadata, research notes এবং review checklist প্রস্তুত করুন।</p></div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Draft workspace · manual review</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <aside className="h-fit rounded-3xl border border-[#e4eadf] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Research brief</h2>
            <label className="mt-4 block text-sm font-bold" htmlFor="saved-drafts">Saved drafts</label>
            <select id="saved-drafts" value={draftId ?? ""} onChange={(event) => openSavedDraft(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-3">
              <option value="">নতুন draft / select saved draft</option>
              {savedDrafts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <p className="mt-2 text-sm leading-6 text-[#647468]">একটি বিষয় দিয়ে শুরু করুন। প্রকৃত Search Console বা keyword metrics সংযুক্ত না থাকলে এখানে সেগুলো অনুমান করে দেখানো হবে না।</p>
            <label className="mt-5 block text-sm font-bold" htmlFor="keyword">মূল বিষয় / primary keyword</label>
            <input id="keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={160} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-4 outline-none focus:border-[#39754b]" placeholder="যেমন: ধানের পাতায় হলুদ দাগ" />
            <label className="mt-4 block text-sm font-bold" htmlFor="language">ভাষা</label>
            <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-3"><option value="Bengali">বাংলা</option><option value="English">English</option></select>
            <label className="mt-4 block text-sm font-bold" htmlFor="audience">পাঠক</label>
            <select id="audience" value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-3">{audiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <label className="mt-4 block text-sm font-bold" htmlFor="content-type">আর্টিকেলের ধরন</label>
            <select id="content-type" value={contentType} onChange={(event) => setContentType(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-3">{contentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <label className="mt-4 block text-sm font-bold" htmlFor="intent">Search intent</label>
            <select id="intent" value={intent} onChange={(event) => setIntent(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce6d7] bg-white px-3"><option value="informational">তথ্য জানতে চায়</option><option value="commercial">তুলনা / কেনার আগে গবেষণা</option><option value="transactional">কেনা বা কাজ সম্পন্ন করা</option><option value="local">স্থানীয় তথ্য বা সেবা</option></select>
            <label className="mt-4 block text-sm font-bold" htmlFor="research-notes">Research notes / source links</label>
            <textarea id="research-notes" value={researchNotes} onChange={(event) => setResearchNotes(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-[#dce6d7] p-3 text-sm leading-6 outline-none focus:border-[#39754b]" placeholder="বিশ্বস্ত সূত্রের URL, গবেষণার ফল, কৃষি বিশেষজ্ঞের নোট…" />
            <button onClick={() => void generate()} disabled={loading} className="mt-5 min-h-12 w-full rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "Brief তৈরি হচ্ছে…" : "Create content brief"}</button>
          </aside>

          <section className="min-w-0 space-y-5">
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-white p-4 text-sm">{notice}</p>}
            {!brief ? <div className="rounded-3xl border border-dashed border-[#cbdcc7] bg-white p-8 sm:p-12"><h2 className="text-2xl font-black">Your article workspace</h2><p className="mt-3 max-w-xl leading-7 text-[#647468]">Brief তৈরি হলে এখানে headline, outline, FAQ, SEO metadata এবং editable article body আসবে। এখনো কোনো live keyword data বা AI model call করা হচ্ছে না।</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{["Search intent & reader need", "Source-backed research", "Editable article body", "SEO review checklist"].map((item) => <div key={item} className="rounded-xl bg-[#f5f7f2] p-4 text-sm font-semibold">{item}</div>)}</div></div> : <>
              <div className="rounded-3xl border border-[#e4eadf] bg-white p-5 shadow-sm sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1f7a45]">Editorial brief · template</p>
                <h2 className="mt-2 text-2xl font-black">{brief.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#eef5ed] px-3 py-2">Audience: {brief.audience}</span><span className="rounded-full bg-[#eef5ed] px-3 py-2">Intent: {brief.searchIntent}</span><span className="rounded-full bg-[#eef5ed] px-3 py-2">Type: {brief.contentType}</span></div>
                <h3 className="mt-6 font-black">Outline</h3><ol className="mt-3 list-decimal space-y-2 pl-5 leading-7 text-[#647468]">{brief.outline.map((item) => <li key={item}>{item}</li>)}</ol>
                <h3 className="mt-6 font-black">Reader questions to answer</h3><ul className="mt-3 space-y-2 leading-7 text-[#647468]">{brief.faq.map((item) => <li key={item}>• {item}</li>)}</ul>
                <h3 className="mt-6 font-black">Research before publishing</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#647468]">{brief.researchChecklist.map((item) => <li key={item}>□ {item}</li>)}</ul>
              </div>

              <div className="rounded-3xl border border-[#e4eadf] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Article editor</h2><p className="mt-1 text-sm text-[#647468]">নিজের যাচাইকৃত লেখা এখানে লিখুন বা সম্পাদনা করুন।</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void saveDraft()} disabled={saving || !brief} className="min-h-10 rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save draft"}</button><button onClick={() => void copyMarkdown()} className="min-h-10 rounded-xl border border-[#dce6d7] px-4 py-2 text-sm font-bold">Copy Markdown</button></div></div>
                <label htmlFor="article-body" className="mt-5 block text-sm font-bold">Article body (Markdown supported)</label>
                <textarea id="article-body" value={articleBody} onChange={(event) => setArticleBody(event.target.value)} rows={22} className="mt-2 w-full rounded-2xl border border-[#dce6d7] p-4 font-mono text-sm leading-7 outline-none focus:border-[#39754b]" placeholder={"## ভূমিকা\n\nপাঠকের মূল প্রশ্নের সরাসরি উত্তর দিয়ে শুরু করুন।\n\n## ধাপে ধাপে করণীয়\n\nবিশ্বস্ত সূত্র দিয়ে প্রতিটি দাবি যাচাই করুন…"} />
                <div className="mt-5 rounded-2xl bg-[#f5f7f2] p-4"><h3 className="font-black">SEO metadata</h3><p className="mt-3 text-sm"><b>Meta title:</b> {brief.seo.metaTitle}</p><p className="mt-2 text-sm leading-6"><b>Meta description:</b> {brief.seo.metaDescription}</p><p className="mt-2 break-words text-sm leading-6"><b>Related keywords:</b> {brief.seo.keywords.join(", ")}</p></div>
                <p className="mt-4 text-xs leading-5 text-[#647468]">Save draft চাপলে লেখা database-এ draft হিসেবে থাকবে। Publish workflow এখনো এই editor থেকে চালু নয়; Save করার পরও মানবীয় review প্রয়োজন।</p>
              </div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}

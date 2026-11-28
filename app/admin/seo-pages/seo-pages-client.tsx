"use client";

import { AdminPage as AdminPageLayout } from "@/components/admin/ui/AdminPrimitives";
import { useCallback, useEffect, useState } from "react";

type Page = {
  id: string; slug: string; title: string; meta_title: string | null;
  meta_description: string | null; canonical_url: string | null; noindex: boolean;
  hero_title: string | null; hero_description: string | null; body_markdown: string;
  faq: { question: string; answer: string }[]; cta_label: string | null;
  cta_url: string | null; status: string;
};
const blank = {
  title: "", slug: "", meta_title: "", meta_description: "", canonical_url: "",
  noindex: false, hero_title: "", hero_description: "", body_markdown: "",
  faq: [] as { question: string; answer: string }[], cta_label: "", cta_url: "",
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function SeoPagesClient() {
  const [pages, setPages] = useState<Page[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/seo-pages", { cache: "no-store" });
      const data = await readResponse(response);
      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load landing pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/seo-pages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing }),
      });
      await readResponse(response);
      setForm({ ...blank }); setEditing(null);
      setNotice("Draft saved successfully.");
      await load(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed. Please try again.");
    } finally { setBusy(false); }
  }

  async function move(id: string, action: string) {
    if (busyAction) return;
    const page = pages.find((item) => item.id === id);
    if (!page) return;
    if (action === "published" && !window.confirm(`Publish “${page.title}” now? It will become publicly visible.`)) return;
    if (action === "review" && page.status === "published" && !window.confirm(`Unpublish “${page.title}” and send it back to review?`)) return;
    setBusyAction(id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/seo-pages/workflow", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await readResponse(response);
      setNotice(action === "published" ? "Page published." : "Workflow updated.");
      await load(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workflow update failed. Please retry.");
    } finally { setBusyAction(null); }
  }

  function edit(page: Page) {
    setEditing(page.id);
    setForm({
      ...page, meta_title: page.meta_title || "", meta_description: page.meta_description || "",
      canonical_url: page.canonical_url || "", hero_title: page.hero_title || "",
      hero_description: page.hero_description || "", cta_label: page.cta_label || "",
      cta_url: page.cta_url || "",
    });
    setNotice("");
  }

  const field = (key: string, label: string, wide = false) => (
    <label className={wide ? "block text-sm font-semibold md:col-span-2" : "block text-sm font-semibold"}>
      {label}
      <input value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        className="mt-1 w-full rounded-xl border p-3 font-normal" />
    </label>
  );

  return (
    <AdminPageLayout className="min-h-screen bg-[#f5f7f2] p-5 text-[#17351f] sm:p-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">AGRIVA CMS / SEO</p>
        <h1 className="mt-2 text-3xl font-black">SEO Landing Pages</h1>
        <p className="mt-2 text-sm text-slate-600">Create helpful crop, input, region and service pages. New content starts as draft and requires review and approval before publication.</p>
        {error && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-lg border border-red-200 px-3 py-1.5 font-bold">Retry loading</button></div>}
        {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">{editing ? "Edit draft page" : "Create landing page"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {field("title", "Page title")}{field("slug", "URL slug")}{field("meta_title", "Meta title")}
            {field("meta_description", "Meta description", true)}{field("canonical_url", "Canonical URL", true)}
            {field("hero_title", "Hero heading")}{field("hero_description", "Hero description", true)}
            {field("cta_label", "CTA label")}{field("cta_url", "CTA URL")}
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!form.noindex} onChange={(event) => setForm({ ...form, noindex: event.target.checked })} />Noindex</label>
            <label className="block text-sm font-semibold md:col-span-2">Page content (Markdown)
              <textarea rows={12} value={form.body_markdown || ""} onChange={(event) => setForm({ ...form, body_markdown: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-mono text-sm font-normal" />
            </label>
            <div className="md:col-span-2"><p className="text-sm font-bold">FAQ schema entries</p>
              {(form.faq || []).map((item: any, index: number) => <div key={index} className="mt-2 grid gap-2 md:grid-cols-2">
                <input aria-label="FAQ question" value={item.question} onChange={(event) => setForm({ ...form, faq: form.faq.map((entry: any, i: number) => index === i ? { ...entry, question: event.target.value } : entry) })} placeholder="Question" className="rounded-xl border p-3" />
                <input aria-label="FAQ answer" value={item.answer} onChange={(event) => setForm({ ...form, faq: form.faq.map((entry: any, i: number) => index === i ? { ...entry, answer: event.target.value } : entry) })} placeholder="Answer" className="rounded-xl border p-3" />
              </div>)}
              <button type="button" onClick={() => setForm({ ...form, faq: [...(form.faq || []), { question: "", answer: "" }] })} className="mt-2 rounded-lg border px-3 py-2 text-sm font-bold">Add FAQ</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => void save()} className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button>
            <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm({ ...blank }); setNotice(""); }} className="rounded-xl border px-4 py-3 font-bold disabled:opacity-50">Clear</button>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Existing pages ({pages.length})</h2><button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">{loading ? "Refreshing…" : "Refresh list"}</button></div>
          {loading ? <div role="status" className="mt-3 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">Loading SEO landing pages…</div>
            : pages.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed bg-white p-8 text-center"><p className="font-bold">No landing pages yet</p><p className="mt-1 text-sm text-slate-600">Create your first draft using the form above.</p></div>
            : <div className="mt-3 grid gap-3 md:grid-cols-2">{pages.map((page) => <article key={page.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex justify-between gap-2"><h3 className="font-black">{page.title}</h3><span className="text-xs font-bold uppercase">{page.status}</span></div>
              <p className="mt-1 text-sm text-slate-500">/landing/{page.slug}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.status === "draft" && <><button disabled={!!busyAction} onClick={() => edit(page)} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">Edit</button><button disabled={!!busyAction} onClick={() => void move(page.id, "review")} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">Send to review</button></>}
                {page.status === "review" && <><button disabled={!!busyAction} onClick={() => void move(page.id, "approved")} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Approve</button><button disabled={!!busyAction} onClick={() => void move(page.id, "draft")} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">Return to draft</button></>}
                {page.status === "approved" && <><button disabled={!!busyAction} onClick={() => void move(page.id, "published")} className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{busyAction === page.id ? "Publishing…" : "Publish"}</button><button disabled={!!busyAction} onClick={() => void move(page.id, "review")} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">Return to review</button></>}
                {page.status === "published" && <><a href={`/landing/${page.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-bold">View page</a><button disabled={!!busyAction} onClick={() => void move(page.id, "review")} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50">{busyAction === page.id ? "Unpublishing…" : "Unpublish"}</button></>}
              </div>
            </article>)}</div>}
        </section>
      </div>
    </AdminPageLayout>
  );
}

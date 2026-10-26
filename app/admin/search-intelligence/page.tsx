"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Opportunity = {
  id: string;
  keyword: string;
  intent: string | null;
  opportunity_type: string | null;
  search_count: number | null;
  result_count: number | null;
  status: string;
  title: string | null;
  slug: string | null;
  created_at: string;
};

const filters = ["all", "open", "draft", "review", "approved", "published", "rejected"] as const;
type Filter = (typeof filters)[number];
type SearchConsoleStatus = {
  configured: boolean;
  connectionState: string;
  metricsAvailable: boolean;
  missing: Array<{ key: string; label: string }>;
  message: string;
};

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    open: "Open",
    draft: "Draft",
    review: "Needs review",
    approved: "Approved",
    published: "Published",
    rejected: "Rejected",
  };
  return labels[status] ?? status;
}

export default function SearchIntelligencePage() {
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchConsole, setSearchConsole] = useState<SearchConsoleStatus | null>(null);
  const [searchConsoleError, setSearchConsoleError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/content-opportunities?status=${filter}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load content opportunities.");
      setRows(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load content opportunities.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/search-console/status", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check Search Console setup.");
        if (active) setSearchConsole(data as SearchConsoleStatus);
      })
      .catch((err) => {
        if (active) setSearchConsoleError(err instanceof Error ? err.message : "Could not check Search Console setup.");
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => ({
    total: rows.length,
    drafts: rows.filter((row) => row.status === "draft").length,
    review: rows.filter((row) => row.status === "review").length,
  }), [rows]);

  async function updateStatus(opportunity: Opportunity, status: string) {
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/content-opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opportunity.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status update failed.");
      setNotice(`Opportunity moved to ${labelStatus(status)}. This does not publish an article.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/admin" className="text-sm font-bold text-[#17613c] underline underline-offset-4">← Admin dashboard</Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Intelligence</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Search & Content Opportunities</h1>
            <p className="mt-3 max-w-3xl leading-7 text-[#647468]">Review saved opportunities and turn approved ideas into researched article briefs. Counts below come from the AGRIVA opportunities table, not Google search volume.</p>
          </div>
          <Link href="/admin/content-studio" className="inline-flex min-h-11 items-center rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white">Open article editor</Link>
        </header>

        <section className="mt-6 rounded-3xl border border-[#e4eadf] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="gsc-status-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#b58b28]">External data connection</p>
              <h2 id="gsc-status-title" className="mt-2 text-xl font-black">Google Search Console</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#647468]">
                {searchConsoleError || searchConsole?.message || "Checking server-side OAuth configuration…"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-2 text-xs font-bold ${searchConsole?.connectionState === "connected" ? "bg-emerald-50 text-emerald-900" : searchConsole?.configured ? "bg-amber-50 text-amber-900" : "bg-[#f5f7f2] text-[#647468]"}`}>
                {searchConsole?.connectionState === "connected" ? "Google account connected" : searchConsole?.configured ? "Ready to connect" : "Not connected"}
              </span>
              {searchConsole?.configured && searchConsole.connectionState !== "connected" && (
                <a href="/api/admin/search-console/connect" className="inline-flex min-h-10 items-center rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">
                  Connect Google account
                </a>
              )}
            </div>
          </div>
          {searchConsole && !searchConsole.configured && searchConsole.missing.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">Missing server environment variables</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {searchConsole.missing.map((item) => <li key={item.key} className="rounded-lg border border-[#e4eadf] px-3 py-2 font-mono text-xs">{item.key}</li>)}
              </ul>
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-[#647468]">The connection stores the refresh token encrypted on the server. Property verification and live metrics sync are not implemented yet, so this page will not display Google analytics until those steps are completed. This status check never returns secrets or fabricated analytics.</p>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Loaded opportunities" value={loading ? "…" : counts.total.toString()} />
          <Stat label="Draft opportunities" value={loading ? "…" : counts.drafts.toString()} />
          <Stat label="Needs review" value={loading ? "…" : counts.review.toString()} />
        </div>

        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-white p-4 text-sm">{notice}</p>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"><b>Data unavailable:</b> {error}<button onClick={() => void load()} className="ml-3 font-bold underline">Retry</button></div>}

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Filter opportunities">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${filter === item ? "bg-[#17351f] text-white" : "border border-[#dce6d7] bg-white text-[#17351f]"}`}>{item === "all" ? "All statuses" : labelStatus(item)}</button>)}
          <button onClick={() => void load()} className="ml-auto rounded-xl border border-[#dce6d7] bg-white px-4 py-2 text-sm font-bold">Refresh</button>
        </div>

        <section className="mt-4 overflow-hidden rounded-3xl border border-[#e4eadf] bg-white shadow-sm" aria-label="Content opportunities">
          <div className="hidden grid-cols-6 gap-3 border-b p-5 text-xs font-bold uppercase tracking-wide text-[#647468] md:grid">
            <span className="col-span-2">Keyword / topic</span><span>Intent</span><span>Type</span><span>Internal count</span><span>Status</span>
          </div>
          {loading ? <p className="p-8 text-sm text-[#647468]">Loading saved opportunities…</p> : rows.length === 0 ? (
            <div className="p-8 sm:p-12"><h2 className="text-xl font-black">No saved opportunities in this view</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#647468]">This list intentionally does not invent sample keywords or search metrics. Add opportunities from a connected data source or change the status filter.</p></div>
          ) : rows.map((row) => (
            <button key={row.id} onClick={() => setSelected(row)} className="grid w-full gap-2 border-b border-[#edf1e9] p-5 text-left last:border-b-0 hover:bg-[#f8faf6] md:grid-cols-6 md:items-center md:gap-3">
              <div className="md:col-span-2"><b>{row.title || row.keyword}</b><p className="mt-1 text-sm text-[#647468]">{row.title ? row.keyword : "Saved topic"}</p></div>
              <div className="text-sm capitalize">{row.intent || "Not classified"}</div>
              <div className="text-sm capitalize">{row.opportunity_type || "Not classified"}</div>
              <div className="text-sm"><b>{row.search_count ?? "—"}</b><p className="text-xs text-[#647468]">internal count only</p></div>
              <div><span className="inline-flex rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold">{labelStatus(row.status)}</span></div>
            </button>
          ))}
        </section>

        <div className="mt-6 rounded-2xl border border-dashed border-[#cbdcc7] p-5 text-sm leading-6 text-[#647468]">
          <b className="text-[#17351f]">Data integrity:</b> Google Search Console metrics, third-party keyword volumes, AI estimates and AGRIVA internal search counts must remain separate data sources. A connected account and a successful sync are required before showing real external metrics.
        </div>
      </section>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="opportunity-title" className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#b58b28]">Saved opportunity</p><h2 id="opportunity-title" className="mt-2 text-2xl font-black">{selected.title || selected.keyword}</h2></div><button aria-label="Close details" onClick={() => setSelected(null)} className="rounded-lg px-3 py-1 text-xl">×</button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Detail label="Keyword" value={selected.keyword} />
            <Detail label="Search intent" value={selected.intent || "Not classified"} />
            <Detail label="Opportunity type" value={selected.opportunity_type || "Not classified"} />
          </div>
          <p className="mt-4 rounded-2xl bg-[#f5f7f2] p-4 text-sm leading-6">Next step: open the editor to create a research brief for this topic. The brief should use real sources, and any missing search data must be marked unavailable rather than guessed.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {selected.status === "review" && <button disabled={saving} onClick={() => void updateStatus(selected, "rejected")} className="rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">Reject</button>}
            {(selected.status === "open" || selected.status === "draft") && <button disabled={saving} onClick={() => void updateStatus(selected, "review")} className="rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">Send to review</button>}
            <Link href={`/admin/content-studio?keyword=${encodeURIComponent(selected.keyword)}`} className="rounded-xl bg-[#17351f] px-4 py-3 text-sm font-bold text-white">Create research brief</Link>
          </div>
        </section>
      </div>}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-[#e4eadf] bg-white p-5 shadow-sm"><p className="text-sm text-[#647468]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f5f7f2] p-4 text-sm"><b>{label}</b><p className="mt-2 break-words text-[#647468]">{value}</p></div>;
}

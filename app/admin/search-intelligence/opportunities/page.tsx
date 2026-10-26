"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  id: string;
  keyword: string;
  intent: string;
  opportunity_type: string;
  search_count: number;
  result_count: number;
  status: string;
  title: string | null;
  slug: string | null;
  created_at: string;
};

const filters = ["all", "open", "draft", "review", "approved", "published", "rejected"];

export default function Page() {
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/content-opportunities?status=${encodeURIComponent(filter)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setRows([]);
        setError(result.error || "Unable to load content opportunities.");
      } else {
        setRows(Array.isArray(result.opportunities) ? result.opportunities : []);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filter]);

  async function setStatus(id: string, status: string) {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/content-opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Unable to update opportunity.");
        return;
      }
      await load();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Intelligence</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Live Content Opportunities</h1>
        <p className="mt-3 max-w-3xl text-[#647468]">
          Live view of search-driven article, product and tool opportunities. Approval is required before publication.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter opportunities by status">
          {filters.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
              className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${filter === status ? "bg-[#17351f] text-white" : "bg-white"}`}
            >
              {status}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="mt-8 text-sm text-[#647468]" role="status">Loading opportunities…</p>
        ) : (
          <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
            {rows.length === 0 ? (
              <p className="p-8 text-sm text-[#647468]">No opportunities found for this filter.</p>
            ) : rows.map((row) => (
              <article key={row.id} className="border-b p-4 last:border-0 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b58b28]">{row.opportunity_type}</p>
                    <h2 className="mt-1 break-words text-lg font-black sm:text-xl">{row.title || row.keyword}</h2>
                    <p className="mt-1 break-words text-sm text-[#647468]">
                      Keyword: {row.keyword} · Intent: {row.intent} · Searches: {row.search_count} · Results: {row.result_count}
                    </p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold capitalize">{row.status}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(row.status === "open" || row.status === "draft") && (
                    <button type="button" disabled={updatingId === row.id} onClick={() => void setStatus(row.id, "review")} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                      {updatingId === row.id ? "Updating…" : "Send to review"}
                    </button>
                  )}
                  {row.status === "review" && (
                    <>
                      <button type="button" disabled={updatingId === row.id} onClick={() => void setStatus(row.id, "approved")} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                        {updatingId === row.id ? "Updating…" : "Approve"}
                      </button>
                      <button type="button" disabled={updatingId === row.id} onClick={() => void setStatus(row.id, "rejected")} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">
                        Reject
                      </button>
                    </>
                  )}
                  {row.status === "approved" && (
                    <button type="button" disabled={updatingId === row.id} onClick={() => void setStatus(row.id, "published")} className="rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                      {updatingId === row.id ? "Updating…" : "Mark published"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="mt-6 rounded-2xl border border-dashed p-5 text-sm leading-6 text-[#647468]">
          Opportunity workflow only. Publishing content itself must use the separate authenticated publishing action.
        </div>
      </section>
    </main>
  );
}

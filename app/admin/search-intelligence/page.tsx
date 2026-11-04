"use client";

import { useEffect, useMemo, useState } from "react";

type OpportunityStatus = "open" | "draft" | "review" | "approved" | "published" | "rejected";
type Opportunity = {
  id: string;
  keyword: string;
  intent: string;
  opportunity_type: "article" | "product" | "tool" | "both";
  search_count: number;
  result_count: number;
  status: OpportunityStatus;
  title: string | null;
  slug: string | null;
  created_at: string;
};

const FILTERS: Array<"all" | OpportunityStatus> = [
  "all", "open", "draft", "review", "approved", "published", "rejected",
];

export default function SearchIntelligencePage() {
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOpportunities() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/content-opportunities?status=all", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Could not load search opportunities.");
        }
        if (active) setRows(Array.isArray(payload?.opportunities) ? payload.opportunities : []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load search opportunities.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOpportunities();
    return () => { active = false; };
  }, []);

  const visible = useMemo(
    () => rows.filter((row) => filter === "all" || row.status === filter),
    [filter, rows],
  );

  async function updateStatus(row: Opportunity, status: "review" | "approved" | "rejected") {
    setBusyId(row.id);
    setError("");
    try {
      const response = await fetch("/api/admin/content-opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: row.id, status }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not update this opportunity.");
      }

      setRows((current) => current.map((item) =>
        item.id === row.id ? { ...item, status: payload.opportunity.status } : item,
      ));
      setSelected(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update this opportunity.");
    } finally {
      setBusyId(null);
    }
  }

  const count = (status: OpportunityStatus) => rows.filter((row) => row.status === status).length;

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Intelligence</p>
        <h1 className="mt-3 text-4xl font-black">Search Intelligence</h1>
        <p className="mt-3 max-w-3xl text-[#647468]">
          Review persisted search-demand opportunities. Search counts come from recorded site-search aggregates;
          no estimated scores or demo opportunities are shown.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Opportunity records" value={rows.length} />
          <Stat label="Draft / open" value={count("draft") + count("open")} />
          <Stat label="Needs review" value={count("review")} />
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${filter === item ? "bg-[#17351f] text-white" : "bg-white"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="hidden grid-cols-6 gap-3 border-b p-5 text-xs font-bold uppercase tracking-wide text-[#647468] md:grid">
            <span>Keyword</span><span>Searches</span><span>Results</span><span>Intent</span><span>Type</span><span>Status</span>
          </div>

          {loading ? (
            <p className="p-8 text-sm text-[#647468]" role="status">Loading saved opportunities…</p>
          ) : visible.length === 0 ? (
            <div className="p-8">
              <p className="font-bold">No saved opportunities found.</p>
              <p className="mt-2 text-sm leading-6 text-[#647468]">
                This list is connected to AGRIVA’s saved opportunity records. Search tracking and opportunity
                generation are separate; recorded searches do not automatically create an opportunity.
              </p>
            </div>
          ) : visible.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelected(row)}
              className="grid w-full gap-2 border-b p-5 text-left hover:bg-[#f8faf6] md:grid-cols-6 md:items-center md:gap-3"
            >
              <div>
                <b>{row.title || row.keyword}</b>
                {row.title && <p className="text-xs text-[#647468]">{row.keyword}</p>}
              </div>
              <div>{row.search_count.toLocaleString()}</div>
              <div>{row.result_count.toLocaleString()}</div>
              <div className="capitalize">{row.intent}</div>
              <div className="capitalize">{row.opportunity_type}</div>
              <div><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold capitalize">{row.status}</span></div>
            </button>
          ))}
        </section>

        <div className="mt-6 rounded-2xl border border-dashed p-5 text-sm leading-6 text-[#647468]">
          Privacy rule: editorial analysis uses aggregated search demand, not individual behavioral profiles.
          Approving an opportunity does not publish an article; article publishing remains in the separate Content Drafts workflow.
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="presentation">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="opportunity-title"
              className="w-full max-w-2xl rounded-3xl bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b58b28]">Saved opportunity</p>
                  <h2 id="opportunity-title" className="mt-1 text-2xl font-black">{selected.title || selected.keyword}</h2>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="text-xl">×</button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Detail label="Keyword" value={selected.keyword} />
                <Detail label="Intent" value={selected.intent} />
                <Detail label="Searches" value={selected.search_count.toLocaleString()} />
                <Detail label="Results" value={selected.result_count.toLocaleString()} />
                <Detail label="Opportunity type" value={selected.opportunity_type} />
                <Detail label="Status" value={selected.status} />
              </div>
              <p className="mt-4 rounded-2xl bg-[#f5f7f2] p-4 text-sm leading-6 text-[#647468]">
                Status changes are saved to the database and recorded with the reviewing Admin. They do not publish content.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-5 py-3 font-bold">
                  Close
                </button>
                {(selected.status === "open" || selected.status === "draft") && (
                  <button
                    type="button"
                    disabled={busyId === selected.id}
                    onClick={() => void updateStatus(selected, "review")}
                    className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {busyId === selected.id ? "Saving…" : "Send to review"}
                  </button>
                )}
                {selected.status === "review" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => void updateStatus(selected, "rejected")}
                      className="rounded-xl border px-5 py-3 font-bold disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => void updateStatus(selected, "approved")}
                      className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50"
                    >
                      {busyId === selected.id ? "Saving…" : "Approve opportunity"}
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-[#647468]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value.toLocaleString()}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="rounded-xl bg-[#f5f7f2] p-4 text-sm">
      <b>{label}</b><br />{value}
    </p>
  );
}

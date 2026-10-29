import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

const statuses = ["open", "draft", "review", "approved", "published", "rejected"] as const;
type OpportunityStatus = typeof statuses[number];

async function requireAdmin(permission: "content.review" | "content.draft" = "content.review") {
  const auth = await authorizePermission(permission);
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=%2Fadmin%2Fsearch-intelligence");
    redirect("/dashboard");
  }
  return { supabase: auth.supabase, user: auth.user };
}

async function updateOpportunityStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("opportunityId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as OpportunityStatus;
  if (!id || !statuses.includes(status) || !["approved", "rejected", "review"].includes(status)) {
    redirect("/admin/search-intelligence?notice=invalid_action");
  }
  const { supabase, user } = await requireAdmin();
  const { data: current, error: readError } = await supabase.from("content_opportunities").select("id,status").eq("id", id).maybeSingle();
  if (readError || !current) redirect("/admin/search-intelligence?notice=update_error");
  const transitions: Record<string, string[]> = {
    open: ["review"],
    draft: ["review"],
    review: ["approved", "rejected"],
    approved: ["published"],
  };
  if (!transitions[current.status]?.includes(status)) redirect("/admin/search-intelligence?notice=invalid_transition");
  const { data: updated, error } = await supabase.from("content_opportunities").update({
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq("id", id).eq("status", current.status).select("id").maybeSingle();
  revalidatePath("/admin");
  revalidatePath("/admin/search-intelligence");
  revalidatePath("/admin/opportunities");
  redirect(error || !updated ? "/admin/search-intelligence?notice=update_error" : "/admin/search-intelligence?notice=updated");
}

async function createDraft(formData: FormData) {
  "use server";
  const id = String(formData.get("opportunityId") ?? "").trim();
  if (!id) redirect("/admin/search-intelligence?notice=invalid_action");
  const { supabase } = await requireAdmin("content.draft");
  const { error } = await supabase.rpc("create_content_draft_from_opportunity", { p_opportunity_id: id });
  revalidatePath("/admin");
  revalidatePath("/admin/search-intelligence");
  revalidatePath("/admin/content-drafts");
  revalidatePath("/admin/opportunities");
  redirect(error ? "/admin/search-intelligence?notice=create_error" : "/admin/search-intelligence?notice=draft_created");
}

const noticeText: Record<string, string> = {
  updated: "Opportunity status saved to the database.",
  update_error: "Status was not saved. Check the opportunity and admin database permissions.",
  draft_created: "Draft created and saved. Open Content Drafts to review it.",
  create_error: "Draft could not be created. It may already have a draft or its status may not allow conversion.",
  invalid_action: "Invalid request. Reload the page and try again.",
  invalid_transition: "That status transition is not allowed. Reload and follow the review workflow.",
};

export default async function SearchIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const q = (params?.q ?? "").trim().slice(0, 120);
  const status = statuses.includes(params?.status as OpportunityStatus) ? params?.status as OpportunityStatus : "all";
  const { supabase } = await requireAdmin();

  let query = supabase.from("content_opportunities")
    .select("id,keyword,intent,opportunity_type,search_count,result_count,status,title,slug,competitor_notes,created_at,last_seen_at")
    .order("search_count", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("keyword", `%${q.replace(/[%_,()]/g, " ")}%`);
  if (status !== "all") query = query.eq("status", status);
  const [{ data: opportunities, error }, { count: totalCount }, { count: reviewCount }] = await Promise.all([
    query,
    supabase.from("content_opportunities").select("id", { count: "exact", head: true }),
    supabase.from("content_opportunities").select("id", { count: "exact", head: true }).in("status", ["review", "approved"]),
  ]);

  const rows = opportunities ?? [];
  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]">
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Intelligence</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Search Intelligence</h1>
            <p className="mt-3 max-w-3xl text-[#647468]">Live database-backed search opportunities. Status changes are saved, and converting an opportunity creates a persisted draft; nothing is published automatically.</p>
          </div>
          <Link href="/admin/content-drafts" className="rounded-xl bg-[#17351f] px-4 py-3 text-sm font-bold text-white">Open Content Drafts ↗</Link>
        </div>

        {params?.notice && <p role="status" className={`mt-5 rounded-xl border p-4 text-sm font-semibold ${params.notice.endsWith("_error") || params.notice.startsWith("invalid") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{noticeText[params.notice] ?? "Operation completed."}</p>}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Total opportunities" value={totalCount ?? 0} />
          <Stat label="Needs review / approval" value={reviewCount ?? 0} />
          <Stat label="Showing results" value={rows.length} />
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]" method="get">
          <label className="text-xs font-bold text-[#647468]">Search keyword
            <input name="q" defaultValue={q} maxLength={120} placeholder="e.g. rice fertilizer" className="mt-2 w-full rounded-xl border px-3 py-3 text-sm font-normal text-[#17351f]" />
          </label>
          <label className="text-xs font-bold text-[#647468]">Workflow status
            <select name="status" defaultValue={status} className="mt-2 w-full rounded-xl border bg-white px-3 py-3 text-sm font-normal capitalize text-[#17351f]">
              <option value="all">All statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button className="self-end rounded-xl border border-[#d8e3d4] px-5 py-3 text-sm font-bold">Apply filters</button>
        </form>

        {error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Opportunity data could not be loaded. Verify the canonical content_opportunities table and admin read policy.</p> : (
          <section className="mt-6 space-y-3">
            {rows.map(item => (
              <article key={item.id} className="rounded-2xl border border-[#e0e8dc] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-black">{item.title || item.keyword}</h2>
                    <p className="mt-1 text-sm text-[#647468]">Keyword: {item.keyword} · Intent: {item.intent || "unknown"} · Type: {item.opportunity_type}</p>
                    <p className="mt-1 text-xs text-[#7b887c]">{item.search_count} recorded searches · {item.result_count} results · Last seen {new Date(item.last_seen_at).toLocaleDateString("en-GB")}</p>
                    {item.slug && <p className="mt-1 break-all text-xs text-[#7b887c]">/{item.slug}</p>}
                  </div>
                  <span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold capitalize">{item.status}</span>
                </div>
                {item.competitor_notes && <p className="mt-3 rounded-xl bg-[#f7f9f5] p-3 text-sm text-[#647468]">Research notes: {item.competitor_notes}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {["open", "draft"].includes(item.status) && <form action={updateOpportunityStatus}><input type="hidden" name="opportunityId" value={item.id}/><input type="hidden" name="status" value="review"/><button className="rounded-lg bg-[#17351f] px-4 py-2 text-xs font-bold text-white">Send to review</button></form>}
                  {item.status === "review" && <><form action={updateOpportunityStatus}><input type="hidden" name="opportunityId" value={item.id}/><input type="hidden" name="status" value="approved"/><button className="rounded-lg bg-[#17351f] px-4 py-2 text-xs font-bold text-white">Approve opportunity</button></form><form action={updateOpportunityStatus}><input type="hidden" name="opportunityId" value={item.id}/><input type="hidden" name="status" value="rejected"/><button className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-800">Reject</button></form></>}
                  {item.status === "approved" && <form action={createDraft}><input type="hidden" name="opportunityId" value={item.id}/><button className="rounded-lg border border-[#d8e3d4] px-4 py-2 text-xs font-bold">Create saved draft</button></form>}
                </div>
              </article>
            ))}
            {!rows.length && <div className="rounded-2xl border border-dashed border-[#cddbc8] bg-white p-8 text-center"><h2 className="font-bold">No matching opportunities</h2><p className="mt-2 text-sm text-[#647468]">No seed/demo rows are shown. Search activity must be aggregated into the canonical opportunities table before it appears here.</p></div>}
            <p className="text-xs text-[#7b887c]">Showing up to 100 records ordered by recorded search count. All changes are subject to server-side admin checks and database policies.</p>
          </section>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-[#e0e8dc] bg-white p-5"><p className="text-sm text-[#647468]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
import { reviewModuleApplication } from "@/lib/admin/application-review";
import { AdminPage } from "@/components/admin/ui/AdminPrimitives";

type Scope = "identity" | "seller";
type StatusFilter = "pending" | "approved" | "rejected" | "all";
type Props = { scope: Scope; status?: string; q?: string };

const STATUS_FILTERS: StatusFilter[] = ["pending", "approved", "rejected", "all"];
const STATUS_LABELS: Record<StatusFilter, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  all: "All applications",
};
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  under_review: "bg-sky-50 text-sky-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  withdrawn: "bg-slate-100 text-slate-700",
};
const MODULE_LABELS: Record<string, string> = {
  plant_market: "Plant Market",
  marketplace: "Marketplace",
  employer: "Employer",
  transport: "Transport",
  sell_harvest: "Harvest",
  farm_management: "Farm management",
};

function textValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function ApplicationManagement({ scope, status, q = "" }: Props) {
  const { supabase } = await requireAdminPage("identity.review");
  const activeStatus: StatusFilter = STATUS_FILTERS.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "pending";
  const isSeller = scope === "seller";
  const moduleKey = isSeller ? "marketplace" : null;
  const basePath = isSeller ? "/admin/seller-applications" : "/admin/identity-verification";
  const title = isSeller ? "Seller applications" : "Identity verification";
  const description = isSeller
    ? "Marketplace business seller applications. Approved and rejected decisions remain available in the history."
    : "Review private identity evidence and module-access requests. Approval grants the requested module permissions.";

  let query = supabase.from("module_access_applications")
    .select("id,user_id,module,applicant_type,organization_id,status,applicant_data,review_note,reviewed_by,reviewed_at,created_at,updated_at")
    .order("created_at", { ascending: false }).limit(500);
  if (moduleKey) query = query.eq("module", moduleKey);
  if (activeStatus === "pending") query = query.in("status", ["pending", "under_review"]);
  if (activeStatus === "approved" || activeStatus === "rejected") query = query.eq("status", activeStatus);

  const { data, error } = await query;
  const applications = data || [];
  const ids = applications.map((item) => item.id);
  const userIds = [...new Set(applications.map((item) => item.user_id))];

  const [pendingCount, approvedCount, rejectedCount, allCount, profilesResult, eventsResult] = await Promise.all([
    supabase.from("module_access_applications").select("id", { count: "exact", head: true })
      .in("status", ["pending", "under_review"]).match(moduleKey ? { module: moduleKey } : {}),
    supabase.from("module_access_applications").select("id", { count: "exact", head: true })
      .eq("status", "approved").match(moduleKey ? { module: moduleKey } : {}),
    supabase.from("module_access_applications").select("id", { count: "exact", head: true })
      .eq("status", "rejected").match(moduleKey ? { module: moduleKey } : {}),
    supabase.from("module_access_applications").select("id", { count: "exact", head: true })
      .match(moduleKey ? { module: moduleKey } : {}),
    userIds.length ? supabase.from("profiles").select("id,full_name").in("id", userIds) : Promise.resolve({ data: [], error: null }),
    ids.length ? supabase.from("module_access_application_events")
      .select("id,application_id,actor_id,event_type,note,created_at")
      .in("application_id", ids).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileNames = new Map((profilesResult.data || []).map((profile) => [profile.id, profile.full_name]));
  const eventsByApplication = new Map<string, typeof eventsResult.data>();
  for (const event of eventsResult.data || []) {
    const current = eventsByApplication.get(event.application_id) || [];
    current.push(event);
    eventsByApplication.set(event.application_id, current);
  }

  const items = await Promise.all(applications.map(async (app) => {
    const details = (app.applicant_data || {}) as Record<string, unknown>;
    const paths = Array.isArray(details.evidence_paths)
      ? details.evidence_paths.filter((path): path is string =>
          typeof path === "string" && path.startsWith(app.user_id + "/")).slice(0, 5)
      : [];
    const signed = await Promise.all(paths.map(async (path) => {
      const { data: object } = await supabase.storage.from("identity-verification").createSignedUrl(path, 300);
      return object?.signedUrl || null;
    }));
    return {
      ...app,
      details,
      applicantName: String(details.organization_name || profileNames.get(app.user_id) || app.applicant_type),
      evidence: signed.filter((url): url is string => Boolean(url)),
      events: eventsByApplication.get(app.id) || [],
    };
  }));

  const needle = q.trim().toLocaleLowerCase();
  const filteredItems = needle ? items.filter((app) => [
    app.id, app.user_id, app.applicantName, app.module, app.applicant_type,
    textValue(app.details.district), textValue(app.details.business_address),
  ].join(" ").toLocaleLowerCase().includes(needle)) : items;

  const counts: Record<StatusFilter, number | null> = {
    pending: pendingCount.error ? null : pendingCount.count,
    approved: approvedCount.error ? null : approvedCount.count,
    rejected: rejectedCount.error ? null : rejectedCount.count,
    all: allCount.error ? null : allCount.count,
  };
  const hasCountErrors = Object.values(counts).some((count) => count === null);

  return (
    <AdminPage className="!max-w-7xl !p-4 text-[#173b2d] sm:!p-6">
      <header className="relative isolate overflow-hidden rounded-[26px] border border-[#e2ebe0] bg-gradient-to-br from-white via-[#fbfdf9] to-[#eef6e9] p-5 shadow-[0_8px_28px_rgba(23,59,45,0.045)] sm:rounded-[28px] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-[#d9ead3]/55" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#779080]">AGRIVA / Admin workspace</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#173b2d] sm:text-[30px]">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#637568]">{description}</p>
          </div>
          <Link href="/admin/audit" className="inline-flex min-h-10 items-center rounded-xl border border-[#dce7dc] bg-white/90 px-4 text-xs font-extrabold text-[#126b4f] shadow-sm transition hover:border-[#9ab99a] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">View admin audit log ↗</Link>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATUS_FILTERS.map((key) => (
          <Link key={key} href={`${basePath}?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={activeStatus === key ? "page" : undefined}
            className={`group rounded-2xl border p-4 shadow-[0_2px_12px_rgba(23,59,45,0.025)] transition duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${activeStatus === key ? "border-[#126b4f] bg-[#eaf4eb] ring-1 ring-[#126b4f]" : "border-[#e1e9df] bg-white hover:border-[#9bb8a3]"}`}>
            <span className="text-xs font-bold text-[#637568]">{STATUS_LABELS[key]}</span>
            <span className="mt-1 block text-2xl font-black tabular-nums">{counts[key] === null ? "—" : counts[key]!.toLocaleString("en-BD")}</span>
          </Link>
        ))}
      </section>

      {hasCountErrors && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">এক বা একাধিক status count লোড করা যায়নি। “—” মানে unavailable; এটিকে শূন্য হিসেবে গণ্য করবেন না।</p>}

      <form method="get" className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#e1e9df] bg-white p-3 shadow-[0_2px_12px_rgba(23,59,45,0.025)] sm:flex-row">
        <input type="hidden" name="status" value={activeStatus}/>
        <input name="q" defaultValue={q} aria-label="Search applications" placeholder="Search applicant, business, user ID or application ID…"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#16835f] focus:ring-2 focus:ring-emerald-100"/>
        <button className="min-h-11 rounded-xl bg-[#126b4f] px-5 text-sm font-bold text-white">Search</button>
        {q && <Link href={`${basePath}?status=${activeStatus}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold">Clear</Link>}
      </form>

      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Application list could not be loaded. Check the identity workflow migration and admin database access.</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-black">{STATUS_LABELS[activeStatus]} <span className="font-medium text-[#829084]">({filteredItems.length} shown)</span></h2>
        <p className="text-xs text-[#829084]">Newest first · up to 500 records per view</p>
      </div>

      <div className="mt-3 space-y-4">
        {filteredItems.map((app) => {
          const canReview = app.status === "pending" || app.status === "under_review";
          return (
            <article key={app.id} className="rounded-2xl border border-[#e3ebe0] bg-white p-4 shadow-[0_3px_16px_rgba(23,59,45,0.035)] transition-shadow hover:shadow-[0_8px_24px_rgba(23,59,45,0.06)] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eaf4eb] px-3 py-1 text-xs font-bold">{MODULE_LABELS[app.module] || app.module}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700"}`}>{app.status.replaceAll("_", " ")}</span>
                  </div>
                  <h3 className="mt-3 break-words text-lg font-black">{app.applicantName}</h3>
                  <p className="mt-1 break-all text-xs text-[#788579]">Applicant: {app.user_id} · Submitted {new Date(app.created_at).toLocaleString("en-GB")}</p>
                  <p className="mt-1 break-all text-[11px] text-[#9aa49b]">Application ID: {app.id}</p>
                </div>
                {app.reviewed_at && <div className="rounded-xl bg-[#f5f8f3] px-3 py-2 text-right text-xs">
                  <p className="font-bold text-[#41634d]">{app.status === "approved" ? "Approved" : "Rejected"}</p>
                  <p className="mt-1 text-[#718174]">{new Date(app.reviewed_at).toLocaleString("en-GB")}</p>
                  <p className="mt-1 break-all text-[#718174]">By: {app.reviewed_by || "Admin"}</p>
                </div>}
              </div>

              <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(app.details).filter(([key]) => key !== "evidence_paths").map(([key, value]) => (
                  <div key={key} className="min-w-0 rounded-xl bg-[#f8faf6] p-3">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-[#718174]">{key.replaceAll("_", " ")}</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{textValue(value)}</dd>
                  </div>
                ))}
              </dl>

              {app.evidence.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
                {app.evidence.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-[#dce7d9] px-3 py-2 text-xs font-bold text-[#126b4f]">Private evidence {index + 1} ↗</a>)}
              </div>}

              {app.review_note && <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
                <p className="text-xs font-bold text-rose-800">Review note / rejection reason</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-rose-900">{app.review_note}</p>
              </div>}

              {app.events.length > 0 && <details className="mt-4 rounded-xl border border-[#edf1ea] p-3">
                <summary className="cursor-pointer text-xs font-bold text-[#496653]">Application history ({app.events.length} events)</summary>
                <ol className="mt-3 space-y-2">
                  {app.events.map((event) => <li key={event.id} className="border-l-2 border-[#cbdccf] pl-3 text-xs">
                    <p className="font-bold">{event.event_type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-[#788579]">{new Date(event.created_at).toLocaleString("en-GB")} · Actor: {event.actor_id || "System"}</p>
                    {event.note && <p className="mt-1 whitespace-pre-wrap">{event.note}</p>}
                  </li>)}
                </ol>
              </details>}

              {canReview && <form action={reviewModuleApplication} className="mt-5 grid gap-3 border-t border-[#edf1ea] pt-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <input type="hidden" name="applicationId" value={app.id}/>
                <input name="reviewNote" maxLength={1000} placeholder="Review note (required when rejecting)" aria-label="Review note"
                  className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"/>
                <button name="decision" value="rejected" formNoValidate className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Reject</button>
                <button name="decision" value="approved" className="min-h-11 rounded-xl bg-[#126b4f] px-4 text-sm font-bold text-white hover:bg-[#0f5942]">Approve & grant access</button>
              </form>}
            </article>
          );
        })}
      </div>
      {!filteredItems.length && !error && <p className="mt-6 rounded-2xl border border-[#e1e9df] bg-white p-8 text-center text-sm text-[#6a7b6e]">No applications found for this filter.</p>}
    </AdminPage>
  );
}

import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/authz";

export const metadata: Metadata = {
  title: "SEO Engine | AGRIVA Admin",
  robots: { index: false, follow: false },
};

export default async function SeoEnginePage() {
  const { supabase } = await requireAdminPage("content.read");
  const [jobs, usage] = await Promise.all([
    supabase.from("seo_engine_jobs").select("id,job_type,status,attempt_count,created_at")
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("seo_engine_usage").select("estimated_cost_usd")
      .order("created_at", { ascending: false }).limit(1000),
  ]);
  const migrationMissing = jobs.error?.code === "42P01" || usage.error?.code === "42P01";
  const failed = Boolean(jobs.error || usage.error);
  const total = failed ? null : (usage.data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0
  );
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-emerald-700">AGRIVA · SEO ENGINE</p>
        <h1 className="mt-2 text-3xl font-bold">SEO Automation Overview</h1>
        <p className="mt-2 text-sm text-slate-600">Read-only foundation dashboard. No automatic publishing is enabled.</p>
      </div>
      {failed && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          {migrationMissing
            ? "SEO Engine migration has not been applied yet."
            : "SEO Engine data is unavailable. Check database permissions and migration status."}
        </div>
      )}
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Recent jobs" value={failed ? "—" : String(jobs.data?.length ?? 0)} />
        <Metric label="Queued jobs" value={failed ? "—" : String(jobs.data?.filter(j => j.status === "queued").length ?? 0)} />
        <Metric label="Recorded API cost (latest 1,000 records)" value={total === null ? "—" : "$" + total.toFixed(4)} />
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Latest jobs</h2>
        <div className="mt-4 space-y-3">
          {!failed && !jobs.data?.length && <p className="text-sm text-slate-500">No jobs yet.</p>}
          {!failed && jobs.data?.map(job => (
            <div key={job.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
              <span>{job.job_type}</span><span>{job.status}</span>
              <time dateTime={job.created_at}>{new Date(job.created_at).toLocaleString("en-BD")}</time>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-white p-5">
    <p className="text-sm text-slate-600">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>;
}

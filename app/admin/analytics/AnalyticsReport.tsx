"use client";
import { useEffect, useState } from "react";

type Report = {
  generatedAt?: string;
  period?: { startDate: string; endDate: string; description: string };
  setup?: Record<string, boolean>;
  ga4?: unknown;
  searchConsole?: unknown;
  errors?: string[];
  message?: string;
  error?: string;
};

export default function AnalyticsReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/analytics-report", { cache: "no-store" })
      .then(async response => {
        const data = await response.json() as Report;
        if (!response.ok) throw new Error(data.error || "Report request failed");
        if (active) setReport(data);
      })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Live reporting data</h2><p className="mt-1 text-sm text-slate-600">Google APIs থেকে পাওয়া প্রকৃত রিপোর্ট; API access না থাকলে এখানে স্পষ্ট error দেখাবে।</p></div><button type="button" onClick={() => { setLoading(true); setFailed(false); fetch("/api/analytics-report", { cache: "no-store" }).then(async r => { const d = await r.json() as Report; if (!r.ok) throw new Error(); setReport(d); }).catch(() => setFailed(true)).finally(() => setLoading(false)); }} className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white">Refresh</button></div>
    {loading && <p className="mt-4 text-sm text-slate-500">রিপোর্ট লোড হচ্ছে…</p>}
    {failed && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">রিপোর্ট পাওয়া যায়নি। Admin session, service account permission এবং environment variables যাচাই করুন।</p>}
    {report && <><p className="mt-4 text-xs text-slate-500">{report.period?.description}: {report.period?.startDate} – {report.period?.endDate}</p>{report.message && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{report.message}</p>}{report.errors?.map(e=><p key={e} className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{e}</p>)}<div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="min-w-0"><h3 className="font-black">Google Analytics 4</h3><pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(report.ga4 ?? {status: report.setup?.ga4ReportingConfigured ? "No data returned" : "Not configured"}, null, 2)}</pre></div><div className="min-w-0"><h3 className="font-black">Search Console</h3><pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(report.searchConsole ?? {status: report.setup?.searchConsoleReportingConfigured ? "No data returned" : "Not configured"}, null, 2)}</pre></div></div><p className="mt-3 text-xs text-slate-500">Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"}</p></>}
  </section>;
}

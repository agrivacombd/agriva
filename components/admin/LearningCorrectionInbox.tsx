"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Report = {
  id: string;
  content_title: string;
  content_slug: string;
  issue_type: string;
  reported_text: string;
  suggested_correction: string | null;
  source_url: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  status: "pending" | "approved" | "rejected" | "needs_info";
  admin_note: string | null;
  created_at: string;
};

export default function LearningCorrectionInbox() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportsResult, pendingResult] = await Promise.all([
        supabase.from("learning_correction_reports")
          .select("id,content_title,content_slug,issue_type,reported_text,suggested_correction,source_url,reporter_name,reporter_email,status,admin_note,created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("learning_correction_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      if (reportsResult.error) throw reportsResult.error;
      if (pendingResult.error) throw pendingResult.error;
      const rows = (reportsResult.data ?? []) as Report[];
      setReports(rows);
      setPendingCount(pendingResult.count ?? rows.filter(row => row.status === "pending").length);
    } catch {
      setError("Correction inbox লোড হয়নি। Admin access এবং Supabase policy যাচাই করুন।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(report: Report, status: Report["status"]) {
    if (status === "approved" && !report.suggested_correction?.trim()) {
      setError("Approve করার আগে প্রস্তাবিত সংশোধন থাকতে হবে।");
      return;
    }
    setBusyId(report.id);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Not signed in");
      const { error: updateError } = await supabase.from("learning_correction_reports").update({
        status,
        admin_note: notes[report.id]?.trim().slice(0, 2000) || null,
        reviewed_by: authData.user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", report.id).eq("status", "pending");
      if (updateError) throw updateError;
      await load();
    } catch {
      setError("রিভিউ স্ট্যাটাস আপডেট হয়নি। আপনার admin role এবং database policy যাচাই করুন।");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
        <div><h2 className="text-xl font-black">Learning Content Correction Inbox</h2><p className="mt-1 text-sm text-[#748074]">শেখার কনটেন্টে পাঠানো সংশোধন রিপোর্ট যাচাই করুন।</p></div>
        <span className="rounded-full bg-amber-200 px-3 py-1.5 text-sm font-black text-amber-950">{pendingCount} pending</span>
      </div>
      {error && <p role="alert" className="p-4 text-sm text-amber-950">{error}</p>}
      {loading ? <p className="p-5 text-sm text-slate-600">রিপোর্ট লোড হচ্ছে…</p> : reports.length === 0 ? <p className="p-5 text-sm text-slate-600">এখনো কোনো correction report নেই।</p> : <div className="divide-y divide-[#edf1ea]">
        {reports.map(report => <article key={report.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{report.content_title}</h3><p className="mt-1 text-xs text-[#748074]">{report.issue_type} · {new Date(report.created_at).toLocaleString("bn-BD")} · {report.reporter_name || "নাম দেননি"}{report.reporter_email ? " · " + report.reporter_email : ""}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{report.status}</span></div>
          <div className="mt-3 rounded-xl bg-[#f7faf5] p-3"><p className="text-xs font-bold text-[#657467]">রিপোর্ট করা তথ্য</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{report.reported_text}</p></div>
          {report.suggested_correction && <div className="mt-2 rounded-xl border border-emerald-100 p-3"><p className="text-xs font-bold text-emerald-800">প্রস্তাবিত সংশোধন</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{report.suggested_correction}</p></div>}
          {report.source_url && <p className="mt-2 break-all text-sm">সূত্র: <a href={report.source_url} target="_blank" rel="noreferrer" className="text-emerald-800 underline">{report.source_url}</a></p>}
          {report.status === "pending" && <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]"><input value={notes[report.id] ?? ""} onChange={e => setNotes(prev => ({ ...prev, [report.id]: e.target.value }))} maxLength={2000} placeholder="Admin note / যাচাইয়ের বিবরণ" className="min-w-0 rounded-xl border border-[#d9e3d5] px-3 py-2 text-sm"/><button disabled={busyId === report.id} onClick={() => void review(report, "approved")} className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Approve</button><button disabled={busyId === report.id} onClick={() => void review(report, "needs_info")} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-bold text-amber-900 disabled:opacity-50">আরও তথ্য</button><button disabled={busyId === report.id} onClick={() => void review(report, "rejected")} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-800 disabled:opacity-50">Reject</button></div>}
        </article>)}
      </div>}
      <p className="border-t border-[#edf1ea] px-5 py-3 text-xs leading-5 text-[#748074]">Approve করার আগে মূল বাক্যটি হুবহু মিলিয়ে এবং সূত্র যাচাই করে নিন। শুধু যাচাইকৃত সংশোধন অনুমোদন করুন।</p>
    </section>
  );
}

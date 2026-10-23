"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = { contentSlug: string; contentTitle: string };

export default function ReportCorrectionForm({ contentSlug, contentTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("fact");
  const [reportedText, setReportedText] = useState("");
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const { error } = await supabase.from("learning_correction_reports").insert({
      content_slug: contentSlug,
      content_title: contentTitle,
      issue_type: issueType,
      reported_text: reportedText.trim(),
      suggested_correction: suggestedCorrection.trim() || null,
      source_url: sourceUrl.trim() || null,
      reporter_name: reporterName.trim() || null,
      reporter_email: reporterEmail.trim() || null,
      status: "pending",
    });
    setSending(false);
    if (error) {
      setMessage(error.code === "42P01" || error.code === "PGRST205"
        ? "সংশোধন ফর্ম চালু করতে database migration প্রয়োগ করা প্রয়োজন।"
        : "অনুরোধ জমা হয়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
      return;
    }
    setMessage("ধন্যবাদ! অ্যাডমিন যাচাই না করা পর্যন্ত কিছু বদলাবে না। অনুমোদিত হলে মিল থাকা বাক্যটি প্রতিস্থাপিত হবে।");
    setReportedText("");
    setSuggestedCorrection("");
    setSourceUrl("");
    setReporterName("");
    setReporterEmail("");
    setOpen(false);
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-amber-950">তথ্যে ভুল পেয়েছেন?</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">ভুল তথ্য, পুরোনো নির্দেশনা বা ভুল সূত্র রিপোর্ট করুন। যে বাক্যটি বদলাতে চান সেটি হুবহু দিন; অ্যাডমিন যাচাই করে অনুমোদন করলে সেই বাক্যটি শেখার কেসে প্রতিস্থাপিত হবে।</p>
        </div>
        <button type="button" onClick={() => setOpen(v => !v)} className="rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-white">{open ? "ফর্ম বন্ধ করুন" : "সংশোধন জানান"}</button>
      </div>
      {message && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-800">{message}</p>}
      {open && <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">সমস্যার ধরন
          <select value={issueType} onChange={e => setIssueType(e.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5">
            <option value="fact">তথ্য/বৈজ্ঞানিক ভুল</option><option value="source">সূত্র নির্ভরযোগ্য নয়</option><option value="spelling">বানান/অনুবাদ</option><option value="outdated">পুরোনো তথ্য</option><option value="safety">নিরাপত্তা ঝুঁকি</option><option value="other">অন্যান্য</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">কোন তথ্যটি ভুল? *
          <textarea required minLength={5} maxLength={5000} value={reportedText} onChange={e => setReportedText(e.target.value)} className="min-h-24 rounded-lg border border-amber-200 bg-white px-3 py-2.5 font-normal" placeholder="পেজে থাকা বাক্যটি হুবহু কপি করুন—এটিই পরে প্রতিস্থাপিত হবে" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">আপনার প্রস্তাবিত সংশোধন
          <textarea maxLength={5000} value={suggestedCorrection} onChange={e => setSuggestedCorrection(e.target.value)} className="min-h-20 rounded-lg border border-amber-200 bg-white px-3 py-2.5 font-normal" placeholder="সঠিক তথ্য কী হওয়া উচিত বলে মনে করেন?" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">প্রমাণ/বিশ্বস্ত সূত্রের লিংক
          <input type="url" maxLength={1000} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 font-normal" placeholder="https://..." />
        </label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold text-slate-800">নাম (ঐচ্ছিক)<input maxLength={120} value={reporterName} onChange={e => setReporterName(e.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 font-normal" /></label><label className="grid gap-1 text-sm font-semibold text-slate-800">ইমেইল (ঐচ্ছিক)<input type="email" maxLength={254} value={reporterEmail} onChange={e => setReporterEmail(e.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 font-normal" /></label></div>
        <button disabled={sending} className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{sending ? "জমা হচ্ছে..." : "অ্যাডমিনের কাছে জমা দিন"}</button>
      </form>}
    </section>
  );
}

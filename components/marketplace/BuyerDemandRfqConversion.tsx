"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type Props = {
  demandId: string;
  cropName: string;
  quantity: number;
  unit: string;
  district: string;
  upazila: string | null;
  needMode: string;
  needDate: string | null;
};

function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function defaultDeadline() {
  return toLocalDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}

export default function BuyerDemandRfqConversion(props: Props) {
  const [open, setOpen] = useState(false);
  const [buyerType, setBuyerType] = useState<"individual" | "business">("individual");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const deadlineMin = useMemo(() => toLocalDateTime(new Date(Date.now() + 60_000)), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!confirmed) {
      setError("RFQ-তে কোন তথ্য যাবে তা পড়ে সম্মতি দিন।");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/buyer-demands/convert-to-rfq", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          demandId: props.demandId,
          buyerType,
          visibility,
          quoteDeadline: new Date(deadline).toISOString(),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.requestId) {
        setError(result?.error || "RFQ তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        return;
      }
      setRequestId(result.requestId);
    } catch {
      setError("নেটওয়ার্ক সমস্যার কারণে RFQ তৈরি করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  if (requestId) {
    return (
      <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-bold text-emerald-900">আপনার RFQ review queue-তে পাঠানো হয়েছে।</p>
        <p className="mt-1 text-xs text-emerald-800">এটি এখনো প্রকাশিত নয়; অনুমোদনের পর দৃশ্যমান হবে।</p>
        <Link href="/account/custom-orders" className="mt-3 inline-flex rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white">RFQ দেখুন</Link>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50">
          এই চাহিদা থেকে Wholesaler RFQ তৈরি করুন
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">RFQ তৈরির আগে যাচাই করুন</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">আপনার Buyer Demand থেকে আলাদা wholesaler quotation request তৈরি হবে। মূল চাহিদা সক্রিয়ই থাকবে।</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-slate-500">বন্ধ</button>
          </div>

          <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
            <p><strong>পণ্য:</strong> {props.cropName}</p>
            <p><strong>পরিমাণ:</strong> {props.quantity} {props.unit}</p>
            <p><strong>এলাকা:</strong> {props.upazila ? props.upazila + ", " : ""}{props.district}</p>
            <p><strong>চাহিদার তারিখ:</strong> {props.needMode === "specific_date" && props.needDate ? props.needDate : "নির্ধারিত তারিখ কপি হবে না; RFQ-তে আলাদা করে উল্লেখ করতে হবে"}</p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">ক্রেতার ধরন
              <select value={buyerType} onChange={e => setBuyerType(e.target.value as "individual" | "business")} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="individual">ব্যক্তিগত ক্রেতা</option>
                <option value="business">ব্যবসায়িক ক্রেতা</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">RFQ দৃশ্যমানতা
              <select value={visibility} onChange={e => setVisibility(e.target.value as "private" | "public")} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="private">Private — শুধু আমন্ত্রিত wholesaler</option>
                <option value="public">Public — অনুমোদনের পর প্রকাশ্য</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">Quotation জমা দেওয়ার শেষ সময়
              <input type="datetime-local" required min={deadlineMin} value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
              <span className="mt-1 block font-normal text-slate-500">আজ থেকে সর্বোচ্চ ৯০ দিনের মধ্যে হতে হবে।</span>
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            <strong>গোপনীয়তা:</strong> ফোন নম্বর, ব্যক্তিগত নোট, target price ও কৃষকদের আগ্রহ/প্রস্তাব RFQ-তে কপি হবে না। RFQ প্রথমে pending review থাকবে; কোনো wholesaler-কে এখনই আমন্ত্রণ বা notification পাঠানো হবে না।
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700">
            <input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
            <span>আমি পণ্যের তথ্য, buyer type, visibility ও deadline যাচাই করেছি এবং আলাদা RFQ তৈরিতে সম্মতি দিচ্ছি।</span>
          </label>
          {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={busy || !confirmed} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "তৈরি হচ্ছে..." : "নিশ্চিত করে RFQ তৈরি করুন"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">বাতিল</button>
          </div>
        </form>
      )}
    </div>
  );
}

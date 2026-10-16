"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function AIPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "আসসালামু আলাইকুম! আমি AGRIVA AI। ফসল, মাটি, সার, সেচ বা রোগ-পোকা সম্পর্কে আপনার প্রশ্ন লিখুন।" },
  ]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = question.trim();
    if (!value || busy) return;
    setMessages((current) => [...current, { role: "user", content: value }]);
    setQuestion("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ question: value }),
      });
      const raw = await response.text();
      let data: { answer?: string; source?: string; fallbackReason?: string; error?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(response.ok
          ? "সার্ভার থেকে সঠিক উত্তর আসেনি। পেজটি refresh করে আবার চেষ্টা করুন।"
          : \`সার্ভারে সমস্যা হয়েছে (HTTP \${response.status})। একটু পরে আবার চেষ্টা করুন।\`);
      }
      if (!response.ok) throw new Error(data.error || \`অনুরোধটি সম্পন্ন হয়নি (HTTP \${response.status})।\`);
      if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।");
      setMessages((current) => [...current, { role: "assistant", content: data.answer! }]);
      if (data.source === "openai") {
        setNotice("AGRIVA AI · AI উত্তর");
      } else if (data.fallbackReason === "missing_api_key") {
        setNotice("সাধারণ সহায়ক উত্তর · Vercel-এ OPENAI_API_KEY সেট করা নেই");
      } else if (data.fallbackReason === "provider_error") {
        setNotice("সাধারণ সহায়ক উত্তর · AI provider-এ সংযোগ ব্যর্থ; Vercel Runtime Logs পরীক্ষা করুন");
      } else {
        setNotice("সাধারণ সহায়ক উত্তর · AI provider থেকে উত্তর পাওয়া যায়নি");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-8 text-[#17351f] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-black tracking-wide text-emerald-800">AGRIVA</Link>
          <Link href="/search" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">Smart Search</Link>
        </div>
        <header className="py-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b58b28]">AGRIVA AI</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">কৃষির প্রশ্ন, সহজ উত্তর</h1>
          <p className="mt-3 leading-7 text-[#657467]">ফসল, মাটি, সেচ, সার এবং রোগ-পোকা নিয়ে প্রশ্ন করুন।</p>
        </header>
        <section aria-label="AGRIVA AI conversation" className="space-y-4 rounded-3xl border border-[#e0e8dc] bg-white p-4 shadow-sm sm:p-6">
          <div className="space-y-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "ml-6 rounded-2xl bg-[#17351f] p-4 text-white sm:ml-16" : "mr-6 rounded-2xl bg-[#edf4e9] p-4 text-[#17351f] sm:mr-16"}>
                <p className="mb-1 text-xs font-bold opacity-70">{message.role === "user" ? "আপনি" : "AGRIVA AI"}</p>
                <p className="whitespace-pre-wrap leading-7">{message.content}</p>
              </div>
            ))}
            {busy && <p className="text-sm text-[#657467]" role="status">AGRIVA AI উত্তর তৈরি করছে...</p>}
          </div>
          <form onSubmit={submit} className="border-t border-[#e0e8dc] pt-4">
            <label htmlFor="question" className="mb-2 block text-sm font-semibold">আপনার প্রশ্ন</label>
            <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} rows={3} required placeholder="যেমন: ধানের পাতায় বাদামী দাগ দেখা যাচ্ছে, কী করব?" className="w-full resize-y rounded-2xl border border-[#d5dfd1] px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#657467]">রোগ নির্ণয়ের জন্য প্রয়োজনে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।</p>
              <button type="submit" disabled={busy || !question.trim()} className="rounded-xl bg-[#17351f] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "অপেক্ষা করুন..." : "প্রশ্ন পাঠান"}</button>
            </div>
            {notice && <p className="mt-3 text-sm text-[#657467]" role="status">{notice}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeBangladeshPhone } from "@/components/auth/PhoneOtpAuth";

export default function PhonePasswordAuth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) { setError("সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন। যেমন: 017XXXXXXXX"); return; }
    if (!password) { setError("পাসওয়ার্ড লিখুন।"); return; }
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ phone: normalized, password });
      if (authError) {
        setError("লগইন করা যায়নি। মোবাইল নম্বর ও পাসওয়ার্ড যাচাই করুন। পাসওয়ার্ড ভুলে গেলে Forgot Password ব্যবহার করুন।");
        return;
      }
      onAuthenticated();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-bold text-slate-700">বাংলাদেশি মোবাইল নম্বর
      <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={phone} onChange={e => setPhone(e.target.value)} placeholder="017XXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-emerald-700"/>
    </label>
    <label className="block text-sm font-bold text-slate-700">পাসওয়ার্ড
      <span className="relative mt-2 block">
        <input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="আপনার পাসওয়ার্ড" className="w-full rounded-xl border border-slate-200 px-4 py-3.5 pr-16 outline-none focus:border-emerald-700"/>
        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-3 text-xs font-bold text-emerald-800">{showPassword ? "লুকান" : "দেখান"}</button>
      </span>
    </label>
    <div className="flex justify-end"><Link href="/forgot-password/phone" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">পাসওয়ার্ড ভুলে গেছেন?</Link></div>
    <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "লগইন হচ্ছে…" : "মোবাইল ও পাসওয়ার্ড দিয়ে লগইন"}</button>
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
  </form>;
}

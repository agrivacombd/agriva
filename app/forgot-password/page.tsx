"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const bn = language === "bn";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const redirectTo = new URL("/auth/callback?next=/reset-password", window.location.origin).toString();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setBusy(false);
    if (resetError) {
      setError(true);
      setMessage(bn ? "রিকভারি ইমেইল পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "We couldn't send a recovery email. Please try again shortly.");
    } else {
      setError(false);
      setMessage(bn ? "যদি এই ইমেইলে অ্যাকাউন্ট থাকে, পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হয়েছে।" : "If an account exists for this email, password reset instructions have been sent.");
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-5 py-12 text-[#17351f]">
    <section className="w-full max-w-md rounded-[1.75rem] border border-[#e3e9e0] bg-white p-7 shadow-[0_18px_60px_rgba(26,65,39,0.07)] sm:p-9">
      <div className="flex items-center justify-between"><BrandLogo href="/" imageClassName="h-9 w-36 sm:w-44" /><button type="button" onClick={() => setLanguage(bn ? "en" : "bn")} className="rounded-full border border-[#d8e1d6] px-3 py-2 text-xs font-semibold">{bn ? "English" : "বাংলা"}</button></div>
      <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6eb] text-[#26723f]"><Mail size={23}/></div>
      <h1 className="mt-5 text-3xl font-black">{bn ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password"}</h1>
      <p className="mt-2 text-sm leading-6 text-[#66776a]">{bn ? "আপনার অ্যাকাউন্টের ইমেইল দিন। রিসেট করার নির্দেশনা পাঠিয়ে দেব।" : "Enter the email for your account and we'll send password reset instructions."}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">{bn ? "ইমেইল ঠিকানা" : "Email address"}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required/></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white transition hover:bg-[#164f2d] disabled:opacity-60">{busy ? (bn ? "পাঠানো হচ্ছে…" : "Sending…") : (bn ? "রিসেট লিংক পাঠান" : "Send reset link")}</button>
        {message && <p role="status" aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-700" : "bg-[#eef7ec] text-[#245d36]"}`}>{message}</p>}
      </form>
      <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1d6939] hover:underline"><ArrowLeft size={16}/>{bn ? "লগইনে ফিরে যান" : "Back to sign in"}</Link>
    </section>
  </main>;
}

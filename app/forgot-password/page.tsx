"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeBangladeshPhone } from "@/components/auth/PhoneOtpAuth";

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const bn = language === "bn";

  async function requestEmailReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const redirectTo = new URL("/auth/callback?next=/reset-password", window.location.origin).toString();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setBusy(false);
    setError(Boolean(resetError));
    setMessage(resetError
      ? (bn ? "রিকভারি ইমেইল পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "We couldn't send a recovery email. Please try again shortly.")
      : (bn ? "যদি এই ইমেইলে অ্যাকাউন্ট থাকে, পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হয়েছে।" : "If an account exists for this email, password reset instructions have been sent."));
  }

  async function requestPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) { setError(true); setMessage(bn ? "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।" : "Enter a valid Bangladesh mobile number."); return; }
    setBusy(true); setMessage("");
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: false },
      });
      // Keep the response generic to avoid revealing whether a phone is registered.
      if (sendError) throw sendError;
      setVerifiedPhone(normalized);
      setOtp("");
      setError(false);
      setMessage(bn ? "যদি নম্বরটি AGRIVA অ্যাকাউন্টে যুক্ত থাকে, OTP পাঠানো হয়েছে।" : "If this number is linked to an AGRIVA account, an OTP has been sent.");
    } catch {
      setError(true);
      setMessage(bn ? "OTP পাঠানো যায়নি। নম্বর যাচাই করে কিছুক্ষণ পর আবার চেষ্টা করুন।" : "We couldn't send an OTP. Check the number and try again shortly.");
    } finally { setBusy(false); }
  }

  async function verifyPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) { setError(true); setMessage(bn ? "৬ সংখ্যার OTP লিখুন।" : "Enter the 6-digit OTP."); return; }
    setBusy(true); setMessage("");
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: verifiedPhone,
        token: otp.trim(),
        type: "sms",
      });
      if (verifyError || !data.user || !data.session) throw verifyError || new Error("OTP verification failed");
      // A verified phone OTP establishes the authenticated recovery session.
      router.replace("/reset-password?method=phone");
      router.refresh();
    } catch {
      setError(true);
      setMessage(bn ? "OTP সঠিক নয় বা মেয়াদ শেষ হয়েছে। আবার চেষ্টা করুন।" : "The OTP is invalid or expired. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-5 py-12 text-[#17351f]">
    <section className="w-full max-w-md rounded-[1.75rem] border border-[#e3e9e0] bg-white p-7 shadow-[0_18px_60px_rgba(26,65,39,0.07)] sm:p-9">
      <div className="flex items-center justify-between"><BrandLogo href="/" imageClassName="h-9 w-36 sm:w-44" /><button type="button" onClick={() => setLanguage(bn ? "en" : "bn")} className="rounded-full border border-[#d8e1d6] px-3 py-2 text-xs font-semibold">{bn ? "English" : "বাংলা"}</button></div>
      <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6eb] text-[#26723f]">{method === "email" ? <Mail size={23}/> : <Smartphone size={23}/>}</div>
      <h1 className="mt-5 text-3xl font-black">{bn ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password"}</h1>
      <p className="mt-2 text-sm leading-6 text-[#66776a]">{bn ? "ইমেইল অথবা নিবন্ধিত মোবাইল নম্বর দিয়ে পরিচয় যাচাই করুন।" : "Verify your identity using your email or registered mobile number."}</p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => {setMethod("email");setMessage("");setError(false);}} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${method==="email"?"bg-white text-emerald-900 shadow-sm":"text-slate-600"}`}>{bn ? "ইমেইল" : "Email"}</button>
        <button type="button" onClick={() => {setMethod("phone");setMessage("");setError(false);}} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${method==="phone"?"bg-white text-emerald-900 shadow-sm":"text-slate-600"}`}>{bn ? "মোবাইল OTP" : "Phone OTP"}</button>
      </div>
      {method === "email" ? <form onSubmit={requestEmailReset} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">{bn ? "ইমেইল ঠিকানা" : "Email address"}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required/></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white transition hover:bg-[#164f2d] disabled:opacity-60">{busy ? (bn ? "পাঠানো হচ্ছে…" : "Sending…") : (bn ? "রিসেট লিংক পাঠান" : "Send reset link")}</button>
      </form> : <div className="mt-6 space-y-4">
        {!verifiedPhone ? <form onSubmit={requestPhoneOtp} className="space-y-4">
          <label className="block text-sm font-semibold">{bn ? "নিবন্ধিত মোবাইল নম্বর" : "Registered mobile number"}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="tel" autoComplete="tel" inputMode="tel" placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required/></label>
          <button disabled={busy} className="w-full rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white disabled:opacity-60">{busy ? (bn ? "OTP পাঠানো হচ্ছে…" : "Sending OTP…") : (bn ? "OTP পাঠান" : "Send OTP")}</button>
        </form> : <form onSubmit={verifyPhoneOtp} className="space-y-4">
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{bn ? "OTP পাঠানো হয়েছে:" : "OTP sent to:"} <strong>{verifiedPhone}</strong></p>
          <label className="block text-sm font-semibold">SMS OTP<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal tracking-[0.3em] outline-none focus:border-[#438253]" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/[^0-9]/g,""))} required/></label>
          <button disabled={busy} className="w-full rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white disabled:opacity-60">{busy ? (bn ? "যাচাই হচ্ছে…" : "Verifying…") : (bn ? "OTP যাচাই করুন" : "Verify OTP")}</button>
          <button type="button" onClick={()=>{setVerifiedPhone("");setOtp("");setMessage("");setError(false);}} className="text-sm font-semibold text-emerald-800 underline">{bn ? "নম্বর পরিবর্তন করুন" : "Change phone number"}</button>
        </form>}
      </div>}
      {message && <p role="status" aria-live="polite" className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-700" : "bg-[#eef7ec] text-[#245d36]"}`}>{message}</p>}
      <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1d6939] hover:underline"><ArrowLeft size={16}/>{bn ? "লগইনে ফিরে যান" : "Back to sign in"}</Link>
    </section>
  </main>;
}

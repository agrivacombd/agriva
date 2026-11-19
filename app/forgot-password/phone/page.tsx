"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeBangladeshPhone } from "@/components/auth/PhoneOtpAuth";
import BrandLogo from "@/components/BrandLogo";

export default function PhonePasswordResetPage() {
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) { setIsError(true); setMessage("সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।"); return; }
    setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: false } });
      if (error) throw error;
      setVerifiedPhone(normalized);
      setStep("otp");
      setIsError(false);
      setMessage("আপনার মোবাইলে পাঠানো ৬ সংখ্যার OTP লিখুন।");
    } catch {
      setIsError(true);
      setMessage("এই নম্বরে OTP পাঠানো যায়নি। নম্বরটি আগে AGRIVA অ্যাকাউন্টে যুক্ত ও যাচাইকৃত কি না দেখুন, তারপর আবার চেষ্টা করুন।");
    } finally { setBusy(false); }
  }

  async function verifyAndUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setIsError(true); setMessage("৬ সংখ্যার OTP লিখুন।"); return; }
    if (password.length < 8) { setIsError(true); setMessage("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"); return; }
    if (password !== confirmPassword) { setIsError(true); setMessage("দুটি পাসওয়ার্ড মিলছে না।"); return; }
    setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: verifiedPhone, token: otp, type: "sms" });
      if (verifyError) throw verifyError;
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setIsError(false);
      setMessage("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।");
      setStep("phone");
      setPhone("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setIsError(true);
      setMessage("OTP যাচাই বা পাসওয়ার্ড পরিবর্তন করা যায়নি। OTP-এর মেয়াদ শেষ হলে নতুন OTP নিন।");
    } finally { setBusy(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f5f8f2] px-5 py-12 text-[#173b2d]">
    <section className="w-full max-w-md rounded-[1.75rem] border border-[#e1e9df] bg-white p-7 shadow-xl sm:p-9">
      <BrandLogo href="/" imageClassName="h-9 w-36 sm:w-44"/>
      <h1 className="mt-8 text-3xl font-black">মোবাইল পাসওয়ার্ড রিসেট</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">অ্যাকাউন্টে যুক্ত মোবাইল নম্বরে OTP নিয়ে নতুন পাসওয়ার্ড সেট করুন।</p>
      {step === "phone" ? <form onSubmit={requestOtp} className="mt-7 space-y-4">
        <label className="block text-sm font-bold">মোবাইল নম্বর<input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="017XXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-emerald-700"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-800 px-4 py-4 font-bold text-white disabled:opacity-50">{busy ? "OTP পাঠানো হচ্ছে…" : "OTP পাঠান"}</button>
      </form> : <form onSubmit={verifyAndUpdate} className="mt-7 space-y-4">
        <p className="rounded-xl bg-emerald-50 p-3 text-sm">OTP পাঠানো হয়েছে: <strong>{verifiedPhone}</strong></p>
        <label className="block text-sm font-bold">৬ সংখ্যার OTP<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ""))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5"/></label>
        <label className="block text-sm font-bold">নতুন পাসওয়ার্ড<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5"/></label>
        <label className="block text-sm font-bold">নতুন পাসওয়ার্ড নিশ্চিত করুন<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-800 px-4 py-4 font-bold text-white disabled:opacity-50">{busy ? "যাচাই হচ্ছে…" : "OTP যাচাই করে পাসওয়ার্ড পরিবর্তন"}</button>
      </form>}
      {message && <p role="status" className={`mt-4 rounded-xl p-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{message}</p>}
      <Link href="/login" className="mt-6 inline-block text-sm font-bold text-emerald-800 underline">লগইনে ফিরে যান</Link>
    </section>
  </main>;
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type PhoneAuthMode = "login" | "signup";

export function normalizeBangladeshPhone(input: string): string | null {
  const digits = input.trim().replace(/[০-৯]/g, digit => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/[\s()-]/g, "");
  const local = digits.startsWith("+880") ? "0" + digits.slice(4)
    : digits.startsWith("880") ? "0" + digits.slice(3)
      : digits;
  return /^01[3-9]\d{8}$/.test(local) ? "+88" + local : null;
}

export default function PhoneOtpAuth({
  mode, onAuthenticated, onSwitchMode,
}: {
  mode: PhoneAuthMode;
  onAuthenticated: () => void;
  onSwitchMode?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signupSuggested, setSignupSuggested] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastSentAt, setLastSentAt] = useState(0);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSignupSuggested(false);
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) { setError("সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন। যেমন: 017XXXXXXXX"); return; }
    if (mode === "signup" && (!acceptedTerms || fullName.trim().length < 2)) {
      setError("নাম লিখুন এবং শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন।");
      return;
    }
    if (Date.now() - lastSentAt < 60000) {
      setError("নিরাপত্তার জন্য একই নম্বরে আবার OTP পাঠানোর আগে কিছুক্ষণ অপেক্ষা করুন।");
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: {
          shouldCreateUser: mode === "signup",
          ...(mode === "signup" ? { data: { full_name: fullName.trim(), selected_roles: ["buyer"] } } : {}),
        },
      });
      if (sendError) {
        const code = sendError.code || "";
        const detail = sendError.message || "";
        // With shouldCreateUser=false, GoTrue returns otp_disabled for an
        // unknown phone even when the SMS provider itself is healthy.
        const unregisteredPhone = mode === "login" &&
          (code === "otp_disabled" || /signups not allowed for otp/i.test(detail));
        setSignupSuggested(unregisteredPhone);
        if (unregisteredPhone) {
          setError("এই নম্বর দিয়ে OTP লগইন করা যাচ্ছে না। আগে ইমেইল বা Google দিয়ে অ্যাকাউন্ট খুলে থাকলে সেই মাধ্যম ব্যবহার করুন। নতুন হলে অ্যাকাউন্ট তৈরি করুন।");
        } else if (
          code === "phone_provider_disabled" || code === "signup_disabled" ||
          /unsupported phone provider|phone signups are disabled|sms provider/i.test(detail)
        ) {
          setError("মোবাইল OTP সেবা বর্তমানে কনফিগার করা নেই। Supabase Phone Auth ও SMS provider সক্রিয় করতে হবে। আপাতত ইমেইল বা Google দিয়ে লগইন করুন।");
        } else if (code === "over_sms_send_rate_limit" || code === "over_request_rate_limit") {
          setError("OTP অনুরোধের সীমা পূর্ণ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        } else {
          setError(detail || "OTP পাঠানো যায়নি। আবার চেষ্টা করুন।");
        }
        return;
      }
      setVerifiedPhone(normalized);
      setLastSentAt(Date.now());
      setOtp("");
      setNotice("আপনার মোবাইলে পাঠানো ৬ সংখ্যার OTP লিখুন।");
    } catch {
      setError("OTP পাঠানো যায়নি। সংযোগ যাচাই করে চেষ্টা করুন।");
    } finally { setBusy(false); }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(otp.trim())) { setError("৬ সংখ্যার OTP লিখুন।"); return; }
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: verifiedPhone,
        token: otp.trim(),
        type: "sms",
      });
      if (verifyError || !data.session || !data.user) {
        setError(verifyError?.message || "OTP যাচাই হয়নি। আবার চেষ্টা করুন।");
        return;
      }
      onAuthenticated();
    } catch {
      setError("OTP যাচাই করা যায়নি। আবার চেষ্টা করুন।");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {mode === "signup" && <p className="text-sm leading-6 text-slate-600">ইমেইল ছাড়াই মোবাইল নম্বর ও OTP দিয়ে AGRIVA অ্যাকাউন্ট তৈরি করুন।</p>}
      {verifiedPhone ? (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950">{notice} <strong>{verifiedPhone}</strong></p>
          <label className="block text-sm font-bold text-slate-700">SMS OTP
            <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={otp} onChange={event => setOtp(event.target.value.replace(/[^0-9]/g, ""))}
              required placeholder="৬ সংখ্যার কোড" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700" />
          </label>
          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy ? "যাচাই হচ্ছে…" : "OTP যাচাই করে চালিয়ে যান"}
          </button>
          <button type="button" onClick={() => { setVerifiedPhone(""); setOtp(""); setError(""); }} className="text-xs font-bold text-emerald-900 underline underline-offset-2">নম্বর পরিবর্তন / নতুন OTP</button>
        </form>
      ) : (
        <form onSubmit={requestOtp} className="space-y-4">
          {mode === "signup" && <label className="block text-sm font-bold text-slate-700">পূর্ণ নাম
            <input required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)}
              placeholder="আপনার নাম" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700" />
          </label>}
          <label className="block text-sm font-bold text-slate-700">বাংলাদেশি মোবাইল নম্বর
            <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={phone} onChange={event => setPhone(event.target.value)}
              placeholder="017XXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700" />
          </label>
          {mode === "signup" && <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input type="checkbox" required checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} className="mt-1 accent-emerald-700" />
            <span>আমি AGRIVA-র <Link href="/terms-of-service" className="underline">শর্তাবলি</Link> ও <Link href="/privacy-policy" className="underline">গোপনীয়তা নীতি</Link>-তে সম্মত।</span>
          </label>}
          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy ? "OTP পাঠানো হচ্ছে…" : "মোবাইলে OTP পাঠান"}
          </button>
        </form>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
      {signupSuggested && !onSwitchMode && (
        <Link href="/signup" className="inline-block text-sm font-bold text-emerald-800 underline underline-offset-2">
          নতুন অ্যাকাউন্ট তৈরি করুন (মোবাইল নম্বর নির্বাচন করুন)
        </Link>
      )}
      {onSwitchMode && <button type="button" onClick={onSwitchMode} className="text-sm font-bold text-emerald-800 underline underline-offset-2">
        {mode === "login" ? "অ্যাকাউন্ট নেই? মোবাইল নম্বর দিয়ে তৈরি করুন" : "আগে অ্যাকাউন্ট আছে? লগইন করুন"}
      </button>}
      <p className="text-xs leading-5 text-slate-500">OTP সেবার জন্য Supabase Phone Auth ও SMS delivery provider সক্রিয় থাকতে হবে। SMS চার্জ প্রযোজ্য হতে পারে।</p>
    </div>
  );
}

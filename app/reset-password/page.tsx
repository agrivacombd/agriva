"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const bn = language === "bn";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8 || password !== confirm) {
      setError(true);
      setMessage(password !== confirm ? (bn ? "দুটি পাসওয়ার্ড মিলছে না।" : "The passwords do not match.") : (bn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" : "Password must be at least 8 characters."));
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(true);
      setMessage(bn ? "পাসওয়ার্ড আপডেট করা যায়নি। রিসেট লিংকটি মেয়াদোত্তীর্ণ হতে পারে।" : "Could not update password. The reset link may have expired.");
      return;
    }
    setError(false);
    setMessage(bn ? "পাসওয়ার্ড আপডেট হয়েছে। ড্যাশবোর্ডে নেওয়া হচ্ছে…" : "Password updated. Redirecting to your dashboard…");
    window.setTimeout(() => router.push("/dashboard"), 900);
  }

  return <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-5 py-12 text-[#17351f]"><section className="w-full max-w-md rounded-[1.75rem] border border-[#e3e9e0] bg-white p-7 shadow-[0_18px_60px_rgba(26,65,39,0.07)] sm:p-9">
    <div className="flex items-center justify-between"><BrandLogo href="/" imageClassName="h-9 w-36 sm:w-44" /><button type="button" onClick={() => setLanguage(bn ? "en" : "bn")} className="rounded-full border border-[#d8e1d6] px-3 py-2 text-xs font-semibold">{bn ? "English" : "বাংলা"}</button></div>
    <h1 className="mt-8 text-3xl font-black">{bn ? "নতুন পাসওয়ার্ড দিন" : "Choose a new password"}</h1><p className="mt-2 text-sm leading-6 text-[#66776a]">{bn ? "আপনার অ্যাকাউন্টের জন্য নতুন, শক্তিশালী পাসওয়ার্ড তৈরি করুন।" : "Create a new, strong password for your account."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold">{bn ? "নতুন পাসওয়ার্ড" : "New password"}<span className="relative mt-2 block"><input className="w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 pr-12 font-normal outline-none focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type={show ? "text" : "password"} minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required/><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-[#718274]">{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></span></label>
    <label className="block text-sm font-semibold">{bn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm password"}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required/></label>
    <button disabled={busy} className="w-full rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white transition hover:bg-[#164f2d] disabled:opacity-60">{busy ? (bn ? "আপডেট হচ্ছে…" : "Updating…") : (bn ? "পাসওয়ার্ড আপডেট করুন" : "Update password")}</button>
    {message && <p role="status" aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-700" : "bg-[#eef7ec] text-[#245d36]"}`}>{message}</p>}</form>
  </section></main>;
}

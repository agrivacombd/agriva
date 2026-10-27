"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, ShieldCheck, Sprout } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function LoginForm() {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const bn = language === "bn";
  const t = {
    eyebrow: bn ? "আপনার AGRIVA অ্যাকাউন্টে ফিরে আসুন" : "Welcome back to AGRIVA",
    title: bn ? "আবার দেখা হয়ে ভালো লাগছে" : "Good to have you back",
    subtitle: bn ? "আপনার কৃষি, ব্যবসা ও শেখার জগৎ অপেক্ষা করছে।" : "Your agriculture, business and learning workspace is waiting.",
    email: bn ? "ইমেইল ঠিকানা" : "Email address",
    password: bn ? "পাসওয়ার্ড" : "Password",
    forgot: bn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?",
    submit: bn ? "নিরাপদে লগইন করুন" : "Sign in securely",
    noAccount: bn ? "AGRIVA-তে নতুন?" : "New to AGRIVA?",
    signup: bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create an account",
    safe: bn ? "নিরাপদ সাইন-ইন" : "Secure sign-in",
  };

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage(bn ? "লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড পরীক্ষা করে আবার চেষ্টা করুন।" : "Couldn't sign in. Check your email and password, then try again.");
      return;
    }
    const nextPath = searchParams.get("next");
    router.push(nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="AGRIVA home"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173f2b] text-white"><Sprout size={23} /></span><span className="text-2xl font-black tracking-tight">AGRIVA<span className="text-[#c49a3e]">.</span></span></Link>
        <button type="button" onClick={() => setLanguage(bn ? "en" : "bn")} className="rounded-full border border-[#d8e1d6] bg-white px-3.5 py-2 text-sm font-semibold hover:border-[#8aaa91]">{bn ? "English" : "বাংলা"}</button>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 pt-2 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-14 lg:pb-20 lg:pt-10">
        <section className="relative hidden min-h-[560px] overflow-hidden rounded-[2rem] bg-[#173f2b] p-10 text-white shadow-xl lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -right-8 -top-4 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#d7e8d5]"><Leaf size={14} /> AGRIVA · Agriculture for everyone</span><h1 className="mt-9 max-w-lg text-5xl font-black leading-tight">{bn ? "আপনার কাজ। আপনার কমিউনিটি। আপনার AGRIVA।" : "Your work. Your community. Your AGRIVA."}</h1><p className="mt-5 max-w-md text-base leading-7 text-[#d1dfd1]">{t.subtitle}</p></div>
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.07] p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#c9a64a] text-[#173f2b]"><LockKeyhole size={21} /></span><div><p className="font-bold">{t.safe}</p><p className="mt-1 text-sm text-[#d1dfd1]">{bn ? "আপনার অ্যাকাউন্টে নিরাপদে প্রবেশ করুন।" : "Access your workspace with confidence."}</p></div></div></div>
        </section>
        <section className="mx-auto w-full max-w-lg rounded-[1.75rem] border border-[#e3e9e0] bg-white p-6 shadow-[0_18px_60px_rgba(26,65,39,0.07)] sm:p-9 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b702b]">{t.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-[2.15rem]">{t.title}</h2><p className="mt-2 text-sm leading-6 text-[#66776a]">{t.subtitle}</p>
          <form onSubmit={signIn} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold">{t.email}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-sm font-semibold">{t.password}<span className="relative mt-2 block"><input className="w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 pr-12 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={bn ? "আপনার পাসওয়ার্ড লিখুন" : "Enter your password"} value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 grid place-items-center text-[#718274] hover:text-[#173f2b]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
            <div className="text-right text-sm"><Link href="/forgot-password" className="font-semibold text-[#1d6939] hover:underline">{t.forgot}</Link></div>
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white shadow-lg shadow-[#1c6338]/15 transition hover:bg-[#164f2d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e7745]/20 disabled:cursor-not-allowed disabled:opacity-60">{busy ? (bn ? "লগইন হচ্ছে…" : "Signing in…") : t.submit}<ArrowRight size={18} /></button>
            {message && <p role="status" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p>}
            {searchParams.get("error") && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">{bn ? "ইমেইল নিশ্চিতকরণ সম্পন্ন হয়নি। লিংকটি আবার খুলুন অথবা নতুন করে চেষ্টা করুন।" : "Email confirmation could not be completed. Reopen the link or try again."}</p>}
          </form>
          <div className="mt-7 border-t border-[#edf0eb] pt-5 text-center text-sm text-[#6b7a6d]">{t.noAccount} <Link href="/signup" className="font-bold text-[#1d6939] underline-offset-4 hover:underline">{t.signup}</Link></div>
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[#819083]"><ShieldCheck size={15} />{bn ? "আপনার অ্যাকাউন্টের নিরাপত্তা গুরুত্বপূর্ণ" : "Your account security matters"}</div>
        </section>
      </div>
      <footer className="pb-6 text-center text-xs text-[#829083]">© {new Date().getFullYear()} AGRIVA · {bn ? "কৃষির ভবিষ্যৎ একসাথে গড়ি" : "Growing agriculture together"}</footer>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f6f8f3] text-sm text-[#66776a]">Loading AGRIVA…</main>}><LoginForm /></Suspense>;
}

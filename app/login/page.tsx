"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Globe2, LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import BrandLogo from "@/components/BrandLogo";

type Language = "bn" | "en";

const copy = {
  bn: {
    eyebrow: "আবার স্বাগতম",
    title: "আপনার AGRIVA অ্যাকাউন্টে লগইন করুন",
    subtitle: "আপনার কৃষি, বাজার ও শেখার জগতে ফিরে আসুন।",
    email: "ইমেইল ঠিকানা",
    emailPlaceholder: "you@example.com",
    password: "পাসওয়ার্ড",
    passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
    submit: "লগইন করুন",
    busy: "লগইন হচ্ছে…",
    noAccount: "AGRIVA-তে নতুন?",
    signup: "অ্যাকাউন্ট তৈরি করুন",
    home: "হোমপেজ",
    forgot: "পাসওয়ার্ড ভুলে গেছেন?",
    error: "লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করে আবার চেষ্টা করুন।",
    failed: "সংযোগে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    show: "পাসওয়ার্ড দেখান",
    hide: "পাসওয়ার্ড লুকান",
    featureTitle: "আপনার কৃষি-জগৎ, এক জায়গায়",
    featureText: "কৃষি সহায়তা, মার্কেটপ্লেস, জ্ঞান ও কাজের সুযোগ—সব এক অ্যাকাউন্টে।",
  },
  en: {
    eyebrow: "Welcome back",
    title: "Sign in to your AGRIVA account",
    subtitle: "Return to your world of agriculture, markets, and learning.",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    submit: "Sign in",
    busy: "Signing in…",
    noAccount: "New to AGRIVA?",
    signup: "Create an account",
    home: "Home",
    forgot: "Forgot password?",
    error: "Sign-in failed. Check your email and password, then try again.",
    failed: "A connection issue occurred. Please try again shortly.",
    show: "Show password",
    hide: "Hide password",
    featureTitle: "Your agriculture world, connected",
    featureText: "Farm support, marketplace, learning, and jobs—all in one account.",
  },
};

function LoginForm() {
  const [language, setLanguage] = useState<Language>("bn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = copy[language];
  const requestedNextPath = searchParams.get("next");

  useEffect(() => {
    let active = true;
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!active || !user) return;
        const target = requestedNextPath && requestedNextPath.startsWith("/") && !requestedNextPath.startsWith("//")
          ? requestedNextPath
          : "/dashboard";
        router.replace(target);
        router.refresh();
      }).catch(() => {});
    } catch {
      // Login remains available if auth configuration is temporarily unavailable.
    }
    return () => { active = false; };
  }, [requestedNextPath, router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message || t.error);
        return;
      }
      router.push(requestedNextPath && requestedNextPath.startsWith("/") && !requestedNextPath.startsWith("//") ? requestedNextPath : "/dashboard");
      router.refresh();
    } catch {
      setMessage(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f2] text-[#173b2d]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo href="/" imageClassName="h-10 w-40 sm:w-48" priority />
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-semibold text-slate-600 hover:text-[#126b4f] sm:block">{t.home}</Link>
          <button type="button" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="inline-flex items-center gap-2 rounded-full border border-[#d9e3d8] bg-white px-3 py-2 text-sm font-semibold hover:border-[#126b4f]"><Globe2 size={16} />{language === "bn" ? "English" : "বাংলা"}</button>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 pt-3 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:pb-16 lg:pt-8">
        <aside className="relative hidden min-h-[560px] overflow-hidden rounded-[2rem] bg-[#123f30] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border-[36px] border-white/5" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c7dfca]">AGRIVA • {t.eyebrow}</p>
            <h2 className="mt-6 max-w-sm text-4xl font-black leading-tight">{t.featureTitle}</h2>
            <p className="mt-4 max-w-sm leading-7 text-[#d2e2d5]">{t.featureText}</p>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c59c3b] text-[#173b2d]"><LockKeyhole size={25} /></span>
            <p className="mt-4 text-lg font-bold">{language === "bn" ? "আপনার অ্যাকাউন্ট, আপনার নিয়ন্ত্রণে" : "Your account, in your control"}</p>
            <p className="mt-2 text-sm leading-6 text-[#c7dfca]">{language === "bn" ? "নিরাপদে লগইন করুন এবং আপনার প্রয়োজন অনুযায়ী AGRIVA ব্যবহার করুন।" : "Sign in securely and use AGRIVA around your needs."}</p>
          </div>
        </aside>
        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-[#e1e9df] bg-white p-6 shadow-[0_24px_80px_-48px_rgba(23,59,45,0.35)] sm:p-10">
            <p className="text-sm font-bold text-[#167453]">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{t.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.subtitle}</p>
            <form onSubmit={signIn} className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                {t.email}
                <input className="w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[#167453] focus:ring-4 focus:ring-[#167453]/10" type="email" autoComplete="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                {t.password}
                <span className="relative block">
                  <input className="w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3.5 pr-12 outline-none transition placeholder:text-slate-400 focus:border-[#167453] focus:ring-4 focus:ring-[#167453]/10" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t.hide : t.show} className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-[#126b4f]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
              <div className="-mt-2 flex justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-[#167453] underline underline-offset-4">{t.forgot}</Link></div>
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-4 font-bold text-white shadow-lg shadow-[#126b4f]/15 transition hover:bg-[#0c573f] focus:outline-none focus:ring-4 focus:ring-[#126b4f]/20 disabled:cursor-not-allowed disabled:opacity-60">{busy ? t.busy : t.submit} {!busy && <ArrowRight size={18} />}</button>
              {message && <p role="status" aria-live="polite" className="break-words rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</p>}
            </form>
            <p className="mt-7 text-center text-sm text-slate-600">{t.noAccount}{" "}<Link className="font-bold text-[#167453] underline underline-offset-4" href="/signup">{t.signup}</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f5f8f2] px-6"><p className="text-sm text-slate-600">Loading sign-in…</p></main>}><LoginForm /></Suspense>;
}

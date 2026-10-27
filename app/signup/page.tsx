"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Role = "farmer" | "buyer" | "seller" | "transport_provider" | "student" | "agronomist" | "gardener" | "reseller";
type Language = "bn" | "en";

const roles: { id: Role; icon: string; bn: string; en: string; detailBn: string; detailEn: string }[] = [
  { id: "farmer", icon: "🌾", bn: "কৃষক", en: "Farmer", detailBn: "জমি, ফসল ও কৃষি পরামর্শ", detailEn: "Farms, crops & advice" },
  { id: "buyer", icon: "🛒", bn: "ক্রেতা", en: "Buyer", detailBn: "কৃষিপণ্য খুঁজুন ও কিনুন", detailEn: "Discover & buy products" },
  { id: "seller", icon: "🏪", bn: "বিক্রেতা", en: "Seller", detailBn: "পণ্য, স্টক ও অর্ডার", detailEn: "Products, stock & orders" },
  { id: "transport_provider", icon: "🚚", bn: "পরিবহন সেবা", en: "Transport provider", detailBn: "বুকিং ও ডেলিভারি পরিচালনা", detailEn: "Manage bookings & delivery" },
  { id: "student", icon: "🎓", bn: "শিক্ষার্থী", en: "Student", detailBn: "কৃষি শিখুন ও দক্ষতা বাড়ান", detailEn: "Learn agriculture skills" },
  { id: "agronomist", icon: "🧑‍🌾", bn: "কৃষিবিদ", en: "Agronomist", detailBn: "বিশেষজ্ঞ হিসেবে আবেদন করুন", detailEn: "Apply as an agriculture expert" },
  { id: "gardener", icon: "🪴", bn: "শখের বাগানপ্রেমী", en: "Home gardener", detailBn: "গাছের যত্ন ও বাগান কমিউনিটি", detailEn: "Plant care & garden community" },
  { id: "reseller", icon: "🤝", bn: "রিসেলার", en: "Reseller", detailBn: "রেফারেল ও কমিশন", detailEn: "Referrals & commissions" },
];

export default function SignupPage() {
  const [language, setLanguage] = useState<Language>("bn");
  const [role, setRole] = useState<Role>("farmer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const bn = language === "bn";
  const t = {
    eyebrow: bn ? "বাংলাদেশের কৃষি কমিউনিটিতে যোগ দিন" : "Join Bangladesh's agriculture community",
    title: bn ? "আপনার AGRIVA যাত্রা শুরু হোক" : "Your AGRIVA journey starts here",
    subtitle: bn ? "আপনার পরিচয় অনুযায়ী সাজানো কৃষি সেবা, বাজার ও শেখার অভিজ্ঞতা পান।" : "Get agriculture, marketplace and learning tools tailored to your needs.",
    role: bn ? "আপনি কীভাবে AGRIVA ব্যবহার করবেন?" : "How will you use AGRIVA?",
    name: bn ? "আপনার পুরো নাম" : "Full name",
    phone: bn ? "মোবাইল নম্বর" : "Mobile number",
    email: bn ? "ইমেইল ঠিকানা" : "Email address",
    password: bn ? "পাসওয়ার্ড তৈরি করুন" : "Create a password",
    passwordHint: bn ? "কমপক্ষে ৮ অক্ষর ব্যবহার করুন" : "Use at least 8 characters",
    terms: bn ? "আমি শর্তাবলি ও গোপনীয়তা নীতি মেনে নিচ্ছি।" : "I agree to the Terms and Privacy Policy.",
    submit: bn ? "ফ্রি অ্যাকাউন্ট তৈরি করুন" : "Create free account",
    existing: bn ? "আগেই অ্যাকাউন্ট আছে?" : "Already have an account?",
    signin: bn ? "লগইন করুন" : "Sign in",
    secure: bn ? "আপনার তথ্য সুরক্ষিত রাখা আমাদের অগ্রাধিকার" : "Your information is treated with care",
    roleNote: bn ? "বিশেষজ্ঞ হিসেবে আবেদন করলে যাচাই শেষে বিশেষজ্ঞ সুবিধা চালু হবে।" : "Agronomist tools are enabled after verification.",
  };

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError(false);
    if (password.length < 8) {
      setError(true);
      setMessage(bn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" : "Password must be at least 8 characters.");
      return;
    }
    if (!accepted) {
      setError(true);
      setMessage(bn ? "চালিয়ে যেতে শর্তাবলি মেনে নিন।" : "Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setBusy(true);
    try {
      const emailRedirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo, data: { role, full_name: fullName.trim(), phone: phone.trim() } },
      });
      if (signupError) {
        setError(true);
        setMessage(signupError.message);
      } else {
        setMessage(bn ? "অ্যাকাউন্টের অনুরোধ তৈরি হয়েছে। ইমেইলে পাঠানো লিংক খুলে অ্যাকাউন্ট নিশ্চিত করুন।" : "Account request created. Open the confirmation link sent to your email to activate your account.");
      }
    } catch {
      setError(true);
      setMessage(bn ? "এখন অ্যাকাউন্ট তৈরি করা যাচ্ছে না। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।" : "We couldn't create your account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="AGRIVA home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173f2b] text-white"><Sprout size={23} /></span>
          <span className="text-2xl font-black tracking-tight">AGRIVA<span className="text-[#c49a3e]">.</span></span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={() => setLanguage(bn ? "en" : "bn")} className="rounded-full border border-[#d8e1d6] bg-white px-3.5 py-2 font-semibold hover:border-[#8aaa91]">{bn ? "English" : "বাংলা"}</button>
          <Link href="/login" className="hidden rounded-full px-3 py-2 font-semibold text-[#315c40] hover:bg-white sm:inline">{bn ? "লগইন" : "Sign in"}</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-2 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12 lg:pb-16 lg:pt-7">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-[#173f2b] p-9 text-white shadow-xl lg:block xl:p-11">
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-4 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#d7e8d5]"><Leaf size={14} /> {bn ? "কৃষির জন্য এক প্ল্যাটফর্ম" : "One platform for agriculture"}</span>
            <h1 className="mt-8 max-w-md text-4xl font-black leading-tight xl:text-5xl">{bn ? "কৃষি, ব্যবসা আর শেখা—সব একসাথে।" : "Grow your farm, business and knowledge."}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#d1dfd1]">{t.subtitle}</p>
            <div className="mt-9 space-y-4">
              {[bn ? "আপনার প্রয়োজন অনুযায়ী টুলস" : "Tools tailored to your role", bn ? "কৃষিপণ্য ও সেবার সহজ সংযোগ" : "Easier access to products and services", bn ? "এক অ্যাকাউন্টে নিজের AGRIVA" : "Your AGRIVA, in one account"].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-medium text-[#e5eee4]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#c9a64a] text-[#173f2b]"><Check size={14} /></span>{item}</div>)}
            </div>
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.07] p-5">
              <p className="text-sm font-semibold text-[#e0c578]">{bn ? "একটি অ্যাকাউন্ট। অনেক সম্ভাবনা।" : "One account. More possibilities."}</p>
              <p className="mt-2 text-sm leading-6 text-[#d1dfd1]">{bn ? "শুরুতে একটি পরিচয় বেছে নিন। পরে আপনার প্রয়োজন অনুযায়ী আরও সেবা যোগ করতে পারবেন।" : "Choose your main role now. Add more capabilities as your needs grow."}</p>
            </div>
          </div>
        </aside>

        <section className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-[#e3e9e0] bg-white p-5 shadow-[0_18px_60px_rgba(26,65,39,0.07)] sm:p-8 lg:p-9">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b702b]">{t.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-[2.15rem]">{t.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#66776a]">{t.subtitle}</p>
          </div>

          <form onSubmit={signUp} className="space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm font-bold">{t.role}</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {roles.map((item) => {
                  const selected = role === item.id;
                  return <button key={item.id} type="button" onClick={() => setRole(item.id)} aria-pressed={selected} className={`group relative rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33794a] sm:p-3.5 ${selected ? "border-[#2e7745] bg-[#eff7ed] ring-1 ring-[#2e7745]" : "border-[#e5eae3] bg-white hover:border-[#a8c5a9] hover:bg-[#fbfdf9]"}`}>
                    {selected && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#2e7745] text-white"><Check size={12} /></span>}
                    <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                    <span className="mt-2 block text-sm font-bold">{bn ? item.bn : item.en}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-[#6d7d70]">{bn ? item.detailBn : item.detailEn}</span>
                  </button>;
                })}
              </div>
              {role === "agronomist" && <p className="mt-2 rounded-xl bg-[#fff8e7] px-3 py-2 text-xs leading-5 text-[#795e1e]">{t.roleNote}</p>}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">{t.name}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" autoComplete="name" placeholder={bn ? "যেমন: মোঃ করিম উদ্দিন" : "e.g. Karim Uddin"} value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
              <label className="block text-sm font-semibold">{t.phone}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
            </div>
            <label className="block text-sm font-semibold">{t.email}<input className="mt-2 w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-sm font-semibold">{t.password}
              <span className="relative mt-2 block"><input className="w-full rounded-xl border border-[#dce5da] bg-[#fcfdfb] px-4 py-3.5 pr-12 font-normal outline-none transition placeholder:text-[#9aa79c] focus:border-[#438253] focus:ring-4 focus:ring-[#438253]/10" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder={t.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" aria-label={showPassword ? (bn ? "পাসওয়ার্ড লুকান" : "Hide password") : (bn ? "পাসওয়ার্ড দেখান" : "Show password")} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 grid place-items-center text-[#718274] hover:text-[#173f2b]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#607164]"><input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#b7c6b8] accent-[#287342]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>{t.terms}</span></label>
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1c6338] px-5 py-4 font-bold text-white shadow-lg shadow-[#1c6338]/15 transition hover:bg-[#164f2d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e7745]/20 disabled:cursor-not-allowed disabled:opacity-60">{busy ? (bn ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "Creating account…") : t.submit}<ArrowRight size={18} /></button>
            {message && <p role="status" aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-700" : "bg-[#eef7ec] text-[#245d36]"}`}>{message}</p>}
          </form>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#edf0eb] pt-5 text-sm sm:flex-row">
            <p className="text-[#6b7a6d]">{t.existing} <Link href="/login" className="font-bold text-[#1d6939] underline-offset-4 hover:underline">{t.signin}</Link></p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#819083]"><ShieldCheck size={15} />{t.secure}</span>
          </div>
        </section>
      </div>
      <footer className="pb-6 text-center text-xs text-[#829083]">© {new Date().getFullYear()} AGRIVA · {bn ? "কৃষির ভবিষ্যৎ একসাথে গড়ি" : "Growing agriculture together"}</footer>
    </main>
  );
}

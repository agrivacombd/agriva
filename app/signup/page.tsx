"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, Globe2, Leaf, Sprout, ShoppingCart, Store, Truck, BriefcaseBusiness, GraduationCap, BookOpen, Flower2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RoleId = "farmer" | "buyer" | "seller" | "transport" | "job_seeker" | "employer" | "student" | "agriculturist" | "rooftop_gardener";
type Language = "bn" | "en";

const roles: { id: RoleId; icon: typeof Sprout; bn: string; en: string; bnDesc: string; enDesc: string }[] = [
  { id: "farmer", icon: Sprout, bn: "কৃষক", en: "Farmer", bnDesc: "ফসল ও খামার পরিচালনা", enDesc: "Crops and farm management" },
  { id: "buyer", icon: ShoppingCart, bn: "ক্রেতা", en: "Buyer", bnDesc: "কৃষিপণ্য খুঁজুন ও কিনুন", enDesc: "Discover and buy produce" },
  { id: "seller", icon: Store, bn: "বিক্রেতা / ডিলার", en: "Seller / Dealer", bnDesc: "পণ্য ও সেবা বিক্রি", enDesc: "Sell products and services" },
  { id: "transport", icon: Truck, bn: "পরিবহন সেবাদাতা", en: "Transport provider", bnDesc: "কৃষিপণ্য পরিবহন", enDesc: "Transport agricultural goods" },
  { id: "job_seeker", icon: BriefcaseBusiness, bn: "চাকরিপ্রার্থী", en: "Job seeker", bnDesc: "কৃষি খাতে চাকরি খুঁজুন", enDesc: "Find agriculture jobs" },
  { id: "employer", icon: BriefcaseBusiness, bn: "নিয়োগদাতা", en: "Employer", bnDesc: "চাকরি প্রকাশ ও কর্মী খোঁজা", enDesc: "Post jobs and find talent" },
  { id: "student", icon: GraduationCap, bn: "কৃষি শিক্ষার্থী", en: "Agriculture student", bnDesc: "শিখুন, অনুশীলন করুন", enDesc: "Learn and build skills" },
  { id: "agriculturist", icon: BookOpen, bn: "কৃষিবিদ / বিশেষজ্ঞ", en: "Agriculture expert", bnDesc: "জ্ঞান ও পরামর্শ শেয়ার", enDesc: "Share expertise and guidance" },
  { id: "rooftop_gardener", icon: Flower2, bn: "ছাদবাগানকারী", en: "Rooftop gardener", bnDesc: "নিজের বাগান পরিচর্যা", enDesc: "Manage your home garden" },
];

const copy = {
  bn: {
    eyebrow: "বাংলাদেশের কৃষির ডিজিটাল সঙ্গী",
    title: "AGRIVA-তে আপনার যাত্রা শুরু করুন",
    subtitle: "একটি অ্যাকাউন্টেই আপনার সব কৃষি-সম্পর্কিত কাজ।",
    name: "আপনার নাম",
    namePlaceholder: "পূর্ণ নাম লিখুন",
    email: "ইমেইল",
    emailPlaceholder: "you@example.com",
    password: "পাসওয়ার্ড",
    passwordPlaceholder: "কমপক্ষে ৮ অক্ষর",
    rolesTitle: "আপনি কোন কোন ভূমিকায় যুক্ত?",
    rolesHint: "একাধিক নির্বাচন করতে পারবেন। পরে Profile Settings থেকে পরিবর্তন করা যাবে।",
    selected: "নির্বাচিত",
    terms: "আমি AGRIVA-র শর্তাবলি ও গোপনীয়তা নীতিতে সম্মত।",
    submit: "অ্যাকাউন্ট তৈরি করুন",
    busy: "অ্যাকাউন্ট তৈরি হচ্ছে…",
    haveAccount: "আগে থেকেই অ্যাকাউন্ট আছে?",
    signIn: "লগইন করুন",
    home: "হোমপেজ",
    benefitTitle: "একটি অ্যাকাউন্ট। আরও বেশি সম্ভাবনা।",
    benefitText: "কৃষি, বাজার, শেখা ও কাজ—আপনার প্রয়োজন অনুযায়ী AGRIVA সাজিয়ে নিন।",
    privacy: "আপনার নির্বাচিত ভূমিকা আপনার অভিজ্ঞতা সাজাতে ব্যবহার হবে; এগুলো নিজে থেকে বিশেষ অনুমতি বা verified status দেয় না।",
    noRole: "কমপক্ষে একটি ভূমিকা নির্বাচন করুন।",
    agree: "চালিয়ে যেতে শর্তাবলিতে সম্মতি দিন।",
    success: "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইলে পাঠানো confirmation link খুলে অ্যাকাউন্ট সক্রিয় করুন।",
    error: "অ্যাকাউন্ট তৈরি করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।",
  },
  en: {
    eyebrow: "Your digital companion for agriculture",
    title: "Start your AGRIVA journey",
    subtitle: "One account for all your agriculture-related needs.",
    name: "Your name",
    namePlaceholder: "Enter your full name",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    rolesTitle: "Which roles describe you?",
    rolesHint: "Choose more than one. You can update these later in Profile Settings.",
    selected: "selected",
    terms: "I agree to AGRIVA's Terms of Service and Privacy Policy.",
    submit: "Create account",
    busy: "Creating account…",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    home: "Home",
    benefitTitle: "One account. More possibilities.",
    benefitText: "Make AGRIVA work for you across agriculture, markets, learning, and jobs.",
    privacy: "Your selected roles personalize your experience; they do not automatically grant special permissions or verified status.",
    noRole: "Choose at least one role to continue.",
    agree: "Please accept the terms to continue.",
    success: "Account created. Open the confirmation link sent to your email to activate your account.",
    error: "We couldn't create your account. Check your details and try again.",
  },
};

export default function SignupPage() {
  const [language, setLanguage] = useState<Language>("bn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>(["farmer"]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = copy[language];

  function toggleRole(role: RoleId) {
    setSelectedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
    setMessage("");
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (selectedRoles.length === 0) {
      setIsError(true);
      setMessage(t.noRole);
      return;
    }
    if (!acceptedTerms) {
      setIsError(true);
      setMessage(t.agree);
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: { full_name: fullName.trim(), selected_roles: selectedRoles },
        },
      });
      setIsError(Boolean(error));
      setMessage(error ? error.message : t.success);
    } catch {
      setIsError(true);
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f2] text-[#173b2d]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="AGRIVA home" className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#126b4f] text-white"><Leaf size={22} /></span>
          AGRIVA<span className="text-[#c59c3b]">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-semibold text-slate-600 hover:text-[#126b4f] sm:block">{t.home}</Link>
          <button type="button" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} className="inline-flex items-center gap-2 rounded-full border border-[#d9e3d8] bg-white px-3 py-2 text-sm font-semibold hover:border-[#126b4f]">
            <Globe2 size={16} /> {language === "bn" ? "English" : "বাংলা"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-3 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:pb-16 lg:pt-8">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-[#123f30] p-10 text-white lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[36px] border-white/5" />
          <div className="absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-[#c59c3b]/15 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c7dfca]">{t.eyebrow}</p>
            <h2 className="mt-5 max-w-md text-4xl font-black leading-tight">{t.benefitTitle}</h2>
            <p className="mt-4 max-w-sm leading-7 text-[#d2e2d5]">{t.benefitText}</p>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c59c3b] text-[#173b2d]"><Sprout size={26} /></span>
              <div><p className="font-bold">AGRIVA</p><p className="mt-1 text-sm text-[#c7dfca]">{language === "bn" ? "কৃষি • বাজার • জ্ঞান • কাজ" : "Agriculture • Markets • Learning • Jobs"}</p></div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#d2e2d5]">
              <div className="rounded-xl bg-white/5 p-3">{language === "bn" ? "কৃষি সহায়তা" : "Farm support"}</div>
              <div className="rounded-xl bg-white/5 p-3">{language === "bn" ? "মার্কেটপ্লেস" : "Marketplace"}</div>
              <div className="rounded-xl bg-white/5 p-3">{language === "bn" ? "শেখা ও কাজ" : "Learn & work"}</div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-[#e1e9df] bg-white p-5 shadow-[0_24px_80px_-48px_rgba(23,59,45,0.35)] sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold text-[#167453]">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{t.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{t.subtitle}</p>
          </div>

          <form onSubmit={signUp} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                {t.name}
                <input className="w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[#167453] focus:ring-4 focus:ring-[#167453]/10" autoComplete="name" placeholder={t.namePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                {t.email}
                <input className="w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[#167453] focus:ring-4 focus:ring-[#167453]/10" type="email" autoComplete="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              {t.password}
              <input className="w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[#167453] focus:ring-4 focus:ring-[#167453]/10" type="password" autoComplete="new-password" minLength={8} placeholder={t.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <fieldset>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <legend className="text-base font-bold text-[#173b2d]">{t.rolesTitle}</legend>
                <span className="rounded-full bg-[#eaf4eb] px-3 py-1 text-xs font-bold text-[#167453]">{selectedRoles.length} {t.selected}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t.rolesHint}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRoles.includes(role.id);
                  return (
                    <button key={role.id} type="button" aria-pressed={selected} onClick={() => toggleRole(role.id)} className={`group flex min-h-[112px] items-start gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#167453]/15 ${selected ? "border-[#167453] bg-[#eef7ef] ring-1 ring-[#167453]/20" : "border-slate-200 bg-white hover:border-[#9bc6a8] hover:bg-[#fbfdf9]"}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[#167453] text-white" : "bg-[#f1f5ef] text-[#426b50]"}`}><Icon size={20} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-5 text-slate-800">{language === "bn" ? role.bn : role.en}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{language === "bn" ? role.bnDesc : role.enDesc}</span>
                      </span>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-[#167453] bg-[#167453] text-white" : "border-slate-300 bg-white text-transparent"}`}><Check size={13} strokeWidth={3} /></span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#167453]" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span>{language === "bn" ? <>আমি AGRIVA-র <Link className="font-semibold text-[#167453] underline underline-offset-2" href="/terms">শর্তাবলি</Link> ও <Link className="font-semibold text-[#167453] underline underline-offset-2" href="/privacy">গোপনীয়তা নীতি</Link>-তে সম্মত।</> : <>I agree to AGRIVA's <Link className="font-semibold text-[#167453] underline underline-offset-2" href="/terms">Terms</Link> and <Link className="font-semibold text-[#167453] underline underline-offset-2" href="/privacy">Privacy Policy</Link>.</>}</span>
            </label>
            <p className="text-xs leading-5 text-slate-500">{t.privacy}</p>

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#126b4f] px-5 py-4 font-bold text-white shadow-lg shadow-[#126b4f]/15 transition hover:bg-[#0c573f] focus:outline-none focus:ring-4 focus:ring-[#126b4f]/20 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? t.busy : t.submit} {!busy && <ArrowRight size={18} />}
            </button>
            {message && <p role="status" aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p>}
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">{t.haveAccount}{" "}<Link className="font-bold text-[#167453] underline underline-offset-4" href="/login">{t.signIn}</Link></p>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Building2, CheckCircle2, ClipboardCheck, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const categories = [
  { id: "seeds", label: "বীজ" },
  { id: "fertilizers", label: "সার" },
  { id: "crop-protection", label: "ফসল সুরক্ষা" },
  { id: "machinery", label: "কৃষি যন্ত্রপাতি" },
  { id: "other", label: "অন্যান্য কৃষি উপকরণ" },
];

export default function SeedCompanyApplyPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<string[]>(["seeds"]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const payload = {
      company_name: String(form.get("company_name") || ""),
      legal_name: String(form.get("legal_name") || ""),
      registration_number: String(form.get("registration_number") || ""),
      contact_phone: String(form.get("contact_phone") || ""),
      business_email: String(form.get("business_email") || ""),
      district: String(form.get("district") || ""),
      website: String(form.get("website") || ""),
      notes: String(form.get("notes") || ""),
      product_categories: selected,
    };
    try {
      const response = await fetch("/api/company/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(response.status === 401
          ? "আবেদন জমা দিতে আগে লগইন করুন। লগইনের পর এই পেজে ফিরে আসুন।"
          : typeof result?.error === "string" ? result.error : "আবেদন জমা হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।");
        return;
      }
      setSuccess(true);
      setMessage("আপনার আবেদন জমা হয়েছে। AGRIVA যাচাই না করা পর্যন্ত কোম্পানির পণ্য প্রকাশিত হবে না।");
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#f5f8f2] text-[#173b2d]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <BrandLogo href="/" imageClassName="h-10 w-40 sm:w-48" priority />
      <Link href="/dashboard" className="text-sm font-bold text-emerald-800 hover:underline">ড্যাশবোর্ড</Link>
    </header>
    <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 pt-4 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
      <aside className="rounded-3xl bg-[#123f30] p-7 text-white sm:p-9">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Building2 size={25} /></span>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-200">AGRIVA Company Network</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">আপনার বীজ কোম্পানিকে AGRIVA-তে যুক্ত করুন</h1>
        <p className="mt-4 text-sm leading-7 text-emerald-50/90">নিজস্ব কোম্পানি প্রোফাইল তৈরি করুন। যাচাই সম্পন্ন হলে কোম্পানির পণ্য ও ব্যবসায়িক তথ্য পরিচালনার সুযোগ পাবেন।</p>
        <div className="mt-8 space-y-4">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-lime-300" size={21} /><div><p className="font-bold">পরিচয় যাচাই</p><p className="mt-1 text-sm leading-6 text-emerald-50/80">কোম্পানির পরিচয় ও প্রয়োজনীয় কাগজপত্র যাচাইয়ের পর অনুমোদন।</p></div></div>
          <div className="flex gap-3"><ClipboardCheck className="mt-0.5 shrink-0 text-lime-300" size={21} /><div><p className="font-bold">নিয়ন্ত্রিত পণ্য প্রকাশ</p><p className="mt-1 text-sm leading-6 text-emerald-50/80">অনুমোদন ছাড়া কোম্পানির নামে পণ্য প্রকাশ করা যাবে না।</p></div></div>
          <div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-lime-300" size={21} /><div><p className="font-bold">কোম্পানির পরিচয় আলাদা</p><p className="mt-1 text-sm leading-6 text-emerald-50/80">Marketplace-এ কোম্পানির পণ্য AGRIVA Official হিসেবে নয়, কোম্পানির নিজের নামে থাকবে।</p></div></div>
        </div>
      </aside>

      <section className="rounded-3xl border border-[#e1e9df] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-emerald-700">Company onboarding</p>
        <h2 className="mt-2 text-2xl font-black">কোম্পানির আবেদন ফর্ম</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">আবেদন করতে আগে লগইন থাকতে হবে। প্রয়োজনীয় তথ্য সঠিকভাবে দিন; প্রয়োজনে AGRIVA অতিরিক্ত নথি চাইতে পারে।</p>
        {success ? <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-extrabold text-emerald-900">আবেদন জমা হয়েছে</p><p className="mt-2 text-sm leading-6 text-emerald-800">{message}</p><Link href="/company/dashboard" className="mt-4 inline-flex rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white">আবেদনের অবস্থা দেখুন</Link></div> :
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">কোম্পানি / ব্র্যান্ডের নাম *
              <input name="company_name" required minLength={2} maxLength={180} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: ABC Seed Company" />
            </label>
            <label className="text-sm font-bold">আইনগত প্রতিষ্ঠানের নাম
              <input name="legal_name" maxLength={220} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="নিবন্ধিত নাম (যদি থাকে)" />
            </label>
            <label className="text-sm font-bold">নিবন্ধন / বীজ লাইসেন্স নম্বর *
              <input name="registration_number" required minLength={2} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="কোম্পানি নিবন্ধন বা বীজ লাইসেন্স নম্বর" />
            </label>
            <label className="text-sm font-bold">যোগাযোগের ফোন *
              <input name="contact_phone" type="tel" required minLength={6} maxLength={40} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="+880..." />
            </label>
            <label className="text-sm font-bold">ব্যবসায়িক ইমেইল *
              <input name="business_email" type="email" required maxLength={254} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="business@example.com" />
            </label>
            <label className="text-sm font-bold">জেলা *
              <input name="district" required minLength={2} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="যেমন: ঢাকা" />
            </label>
          </div>
          <label className="block text-sm font-bold">ওয়েবসাইট
            <input name="website" type="url" maxLength={500} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="https://example.com" />
          </label>
          <fieldset>
            <legend className="text-sm font-bold">কোন ধরনের পণ্য সরবরাহ করেন? *</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={selected.includes(category.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, category.id] : current.filter((item) => item !== category.id))} />{category.label}</label>)}
            </div>
            {selected.length === 0 && <p className="mt-2 text-xs text-rose-700">কমপক্ষে একটি পণ্যের ধরন নির্বাচন করুন।</p>}
          </fieldset>
          <label className="block text-sm font-bold">অতিরিক্ত তথ্য
            <textarea name="notes" maxLength={2000} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" placeholder="ব্র্যান্ড, ব্যবসার ধরন, সম্ভাব্য পণ্য বা ডিলার নেটওয়ার্ক সম্পর্কে লিখুন" />
          </label>
          {message && <p role="alert" className={`rounded-xl p-3 text-sm leading-6 ${success ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{message}</p>}
          <button disabled={busy || selected.length === 0} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "আবেদন জমা হচ্ছে…" : "যাচাইয়ের জন্য আবেদন জমা দিন"}</button>
          <p className="text-xs leading-5 text-slate-500">আবেদন জমা দিলে কোম্পানি স্বয়ংক্রিয়ভাবে verified হবে না। Super Admin যাচাই ও অনুমোদন দেওয়ার পরই কোম্পানি অ্যাকাউন্ট সক্রিয় হবে।</p>
        </form>}
        {!success && <p className="mt-5 text-sm text-slate-600">লগইন করা নেই? <Link className="font-bold text-emerald-800 underline" href="/login?next=/company/apply">লগইন করুন</Link> অথবা <Link className="font-bold text-emerald-800 underline" href="/signup">অ্যাকাউন্ট তৈরি করুন</Link>।</p>}
      </section>
    </div>
  </main>;
}

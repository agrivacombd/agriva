import type { Metadata } from "next";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { redirect } from "next/navigation";
import GardenClient from "./GardenClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "আমার Garden | গাছের যত্ন ও Care Planner – AGRIVA",
  description: "নিজের গাছের তালিকা তৈরি করুন, যত্নের কাজ ও তারিখ পরিকল্পনা করুন এবং AGRIVA Personal Garden-এ গাছের পরিচর্যার রেকর্ড রাখুন।",
  alternates: { canonical: "/garden" },
  robots: { index: false, follow: true },
};

export default async function GardenPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=%2Fgarden");

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="AGRIVA হোম" className="inline-flex items-center gap-2 text-xl font-black sm:text-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><Sprout aria-hidden="true" size={23} strokeWidth={2.5} /></span><span>AGRIVA<span className="text-amber-600">.</span></span></Link>
          <nav aria-label="Garden navigation" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-bold">
            <Link href="/dashboard" className="text-emerald-900 hover:underline">Dashboard</Link>
            <Link href="/green-living" className="text-emerald-900 hover:underline">Green Living</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:underline">AGRIVA</Link><span aria-hidden="true">/</span>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link><span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-emerald-900">Personal Garden</span>
        </nav>
        <div className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700 px-5 py-8 text-white sm:px-8 sm:py-10">
          <p className="text-xs font-extrabold tracking-[.18em] text-emerald-200">YOUR PERSONAL GREEN SPACE</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">আপনার গাছ, আপনার যত্নের পরিকল্পনা</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">গাছের নাম, অবস্থান ও যত্নের কাজ এক জায়গায় রাখুন। নির্ধারিত তারিখকে মনে করিয়ে দেওয়ার পরিকল্পনা হিসেবে ব্যবহার করুন—গাছের মাটি, আলো ও প্রকৃত অবস্থা দেখে যত্নের সিদ্ধান্ত নিন।</p>
        </div>
        <GardenClient />
      </section>
    </main>
  );
}

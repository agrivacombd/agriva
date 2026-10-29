import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ArrowDownRight, ArrowRight, BookOpen, Bot, CalendarDays, CheckCircle2,
  ChevronRight, CloudSun, Leaf, Search,
  ShoppingBasket, Sprout, Store, Tractor, TrendingUp, Wheat, Zap,
  Users, GraduationCap, Stethoscope, PackageCheck, ShoppingCart, Truck,
  Briefcase, FileText,
} from "lucide-react";

const services = [
  { icon: Bot, title: "AI কৃষি সহায়ক", subtitle: "প্রশ্ন করুন, করণীয় জানুন", detail: "ফসল, সার, রোগ ও চাষাবাদ নিয়ে প্রাথমিক সহায়তা নিন", href: "/ai", tone: "bg-violet-50 text-violet-700" },
  { icon: Leaf, title: "ফসলের রোগ শনাক্ত", subtitle: "সমস্যা বুঝে করণীয় জানুন", detail: "ফসলের লক্ষণ নিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক বিশ্লেষণ নিন", href: "/crop-disease", tone: "bg-rose-50 text-rose-700" },
  { icon: CloudSun, title: "কৃষি আবহাওয়া", subtitle: "আগে থেকে পরিকল্পনা করুন", detail: "নির্বাচিত এলাকার আবহাওয়া ও পূর্বাভাস দেখে কাজের পরিকল্পনা করুন", href: "/weather", tone: "bg-sky-50 text-sky-700" },
  { icon: ShoppingBasket, title: "বীজ ও কৃষি উপকরণ", subtitle: "প্রয়োজনীয় পণ্য খুঁজুন", detail: "পণ্যের বিবরণ, বিক্রেতা ও প্রাপ্যতা যাচাই করে কেনাকাটা শুরু করুন", href: "/marketplace", tone: "bg-lime-50 text-lime-800" },
  { icon: TrendingUp, title: "কৃষিপণ্যের বাজারদর", subtitle: "দাম যাচাই করে সিদ্ধান্ত নিন", detail: "সরকারি বাজারদরের উৎসে যান এবং বিক্রির পরিকল্পনা করুন", href: "/market-prices", tone: "bg-amber-50 text-amber-700" },
  { icon: CalendarDays, title: "ফসল ক্যালেন্ডার", subtitle: "কাজের ধাপ মনে রাখুন", detail: "ফসলভিত্তিক কাজের চেকলিস্ট ও চাষের পরিকল্পনা সাজান", href: "/crop-calendar", tone: "bg-teal-50 text-teal-700" },
  { icon: Tractor, title: "আমার খামার", subtitle: "জমি ও কাজের রেকর্ড", detail: "খামার, মৌসুম ও দৈনন্দিন কাজের রেকর্ড রাখুন", href: "/farms", tone: "bg-emerald-50 text-emerald-700" },
  { icon: Zap, title: "কৃষি ক্যালকুলেটর", subtitle: "দ্রুত হিসাব করুন", detail: "বীজ, সার, চাষের খরচ ও সম্ভাব্য লাভের হিসাব করুন", href: "/agriculture-calculators", tone: "bg-orange-50 text-orange-700" },
  { icon: Sprout, title: "মাটি ও সার পরিকল্পনা", subtitle: "সুপারিশ থেকে হিসাব", detail: "মাটি পরীক্ষার রিপোর্ট বা কৃষি কর্মকর্তার সুপারিশ ধরে সার হিসাব করুন", href: "/soil-fertilizer", tone: "bg-green-50 text-green-800" },
  { icon: TrendingUp, title: "ফসল বাছাই ও লাভ তুলনা", subtitle: "চাষের আগে হিসাব মিলান", detail: "নিজের খরচ ও দামের ভিত্তিতে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন", href: "/crop-choice", tone: "bg-cyan-50 text-cyan-800" },
  { icon: Wheat, title: "ফসল বিক্রি করুন", subtitle: "ক্রেতার কাছে অফার দিন", detail: "ফসলের পরিমাণ, দাম ও অবস্থান দিয়ে বিক্রির পোস্ট তৈরি করুন", href: "/sell-harvest", tone: "bg-amber-50 text-amber-800" },
  { icon: Users, title: "ক্রেতার চাহিদা", subtitle: "চাহিদা দেখে অফার দিন", detail: "ক্রেতার ফসল, পরিমাণ, এলাকা ও সময়ের চাহিদা দেখুন", href: "/buyer-demands", tone: "bg-emerald-50 text-emerald-800" },
  { icon: Truck, title: "কৃষিপণ্য পরিবহন", subtitle: "পরিবহনের ব্যবস্থা করুন", detail: "ফসল পরিবহনের অনুরোধ দিন ও প্রাপ্ত ভাড়ার অফার তুলনা করুন", href: "/transport", tone: "bg-sky-50 text-sky-800" },
  { icon: BookOpen, title: "কৃষি শেখা ও গাইড", subtitle: "ব্যবহারিক জ্ঞান বাড়ান", detail: "ফসল, মাটি ও সমন্বিত বালাই ব্যবস্থাপনা সম্পর্কে সহজ বাংলায় শিখুন", href: "/learn", tone: "bg-teal-50 text-teal-700" },
];

const toolLinks = [
  { icon: Search, label: "স্মার্ট সার্চ", href: "/search" },
  { icon: Leaf, label: "ফসলের রোগ সহায়তা", href: "/crop-disease" },
  { icon: CloudSun, label: "আবহাওয়া", href: "/weather" },
  { icon: ShoppingBasket, label: "কৃষি মার্কেটপ্লেস", href: "/marketplace" },
  { icon: TrendingUp, label: "কৃষি বাজার গাইড", href: "/krishi-bazar" },
  { icon: Briefcase, label: "কৃষি চাকরি", href: "/jobs" },
  { icon: FileText, label: "CV তৈরি করুন", href: "/jobs/cv-builder" },
  { icon: Tractor, label: "আমার খামার", href: "/farms" },
  { icon: Zap, label: "কৃষি ক্যালকুলেটর", href: "/agriculture-calculators" },
];

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "কৃষি সেবা, বীজ, বাজারদর ও কৃষি টুলস",
  description:
    "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য AGRIVA—ফসলের সহায়তা, কৃষি পণ্য, বাজারদর, চাষের হিসাব, কৃষি চাকরি ও বাংলা-ইংরেজি CV Builder এক প্ল্যাটফর্মে।",
  alternates: { canonical: "/", languages: { "bn-BD": "/", en: "/en", "x-default": "/" } },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "AGRIVA",
    url: "/",
    title: "AGRIVA — কৃষি সেবা, বীজ ও স্মার্ট কৃষি টুলস",
    description:
      "ফসলের সহায়তা, কৃষি পণ্য, বাজারদর, চাষের হিসাব ও কৃষি চাকরির দরকারি টুলস এক জায়গায়।",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA — কৃষির ডিজিটাল প্ল্যাটফর্ম",
    description:
      "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও চাকরিপ্রার্থীদের জন্য দরকারি কৃষি সেবা ও টুলস।",
  },
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: publicSettings } = await supabase.rpc("get_public_site_settings");
  const settingValue = (key: string, fallback = "") => (publicSettings ?? []).find((setting: { key: string; value: string }) => setting.key === key)?.value?.trim() || fallback;
  const siteName = settingValue("site_name", "AGRIVA");
  const homepageNotice = settingValue("homepage_notice");
  const homepageHeroTitle = settingValue("homepage_hero_title", "কৃষির প্রতিটি ধাপে আপনার পাশে AGRIVA.");
  const homepageHeroSubtitle = settingValue("homepage_hero_subtitle", "বীজ ও কৃষি উপকরণ খুঁজুন, ফসলের বিষয়ে সহায়তা নিন, নিজের খামারের হিসাব রাখুন—কৃষির প্রয়োজনীয় ডিজিটাল টুলস এক জায়গায়, সহজ বাংলায়।");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "AGRIVA",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/agriva-logo.svg`,
        },
        description:
          "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও চাকরিপ্রার্থীদের জন্য কৃষি সেবা, পণ্য, তথ্য ও ডিজিটাল টুলসের প্ল্যাটফর্ম।",
        telephone: "+8801717504028",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "AGRIVA",
        inLanguage: "bn-BD",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f8f8f1] pb-20 text-[#173629] selection:bg-emerald-200 selection:text-emerald-950 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      {homepageNotice && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">{homepageNotice}</div>}

      <section className="relative isolate bg-gradient-to-b from-[#f1f6e9] via-[#f8f8f1] to-[#f8f8f1]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[#d8e8b6]/60 blur-3xl" />
          <div className="absolute -left-36 top-32 h-80 w-80 rounded-full bg-[#c4e0cf]/45 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 pt-8 sm:gap-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-20 md:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6e5cf] bg-white/90 px-3.5 py-2 text-xs font-bold text-[#176346] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#c29a43]" /> বাংলাদেশের কৃষির জন্য এক স্মার্ট প্ল্যাটফর্ম</div>
            <h1 className="max-w-2xl break-words text-[clamp(2rem,8vw,3rem)] font-black leading-[1.15] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.15rem]"><span className="bg-gradient-to-r from-[#0b6b4f] to-[#5d8b36] bg-clip-text text-transparent">{homepageHeroTitle}</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">{homepageHeroSubtitle}</p>
            <form action="/search" method="get" role="search" className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-[#dce5d8] sm:mt-8 bg-white p-2 shadow-xl shadow-emerald-950/5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <Search className="ml-2 shrink-0 text-slate-400" size={21} />
              <input name="q" type="search" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400 sm:text-base" placeholder="বীজ, ফসল বা কৃষি পরামর্শ খুঁজুন..." aria-label="AGRIVA-তে খুঁজুন" />
              <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-[#0b6b4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#07543e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-5">খুঁজুন</button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="mr-1 font-semibold text-slate-500">জনপ্রিয়:</span>
              {[{ label: "ফসলের রোগ", href: "/crop-disease" }, { label: "কৃষি বাজার", href: "/marketplace" }, { label: "কৃষি চাকরি", href: "/jobs" }].map(({ label, href }) => <Link key={label} href={href} className="inline-flex min-h-11 items-center rounded-full border border-[#dce5d8] bg-white/80 px-3 py-2 font-semibold text-[#42634f] transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:transition-none">{label}</Link>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600" /> এক জায়গায় বহু কৃষি সেবা</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600" /> মোবাইল ও ডেস্কটপে ব্যবহারযোগ্য</span></div>
            <div className="mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] px-5 py-3.5 text-center text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#07543e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"><ShoppingCart size={17} /> বীজ কিনুন <ArrowRight size={17} /></Link>
              <Link href="#services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-center text-sm font-bold text-[#16382b] transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:transition-none">সব সেবা দেখুন <ArrowDownRight size={17} /></Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/60 via-lime-100/30 to-amber-100/60 blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/95 p-4 shadow-2xl shadow-emerald-950/15 ring-1 ring-emerald-950/5 backdrop-blur sm:p-6">
              <div className="relative mb-4 h-32 overflow-hidden rounded-2xl bg-gradient-to-br from-[#174c35] via-[#668c49] to-[#d7dfac]">
                <div aria-hidden="true" className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(ellipse at 78% 18%, rgba(231,240,182,.7), transparent 30%), radial-gradient(ellipse at 25% 80%, rgba(184,216,150,.65), transparent 42%), linear-gradient(135deg, #174c35 0%, #668c49 55%, #d7dfac 100%)" }} />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0b3d2c]/85 via-[#174c35]/35 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-4 text-white sm:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-100">GROW WITH AGRIVA</span>
                  <p className="mt-1 text-lg font-black">বাংলার মাঠ, স্মার্ট কৃষি</p>
                  <p className="mt-1 text-xs text-white/85">জ্ঞান • পরিকল্পনা • উন্নত চাষাবাদ</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a77d2f]">YOUR AGRICULTURE, ORGANIZED</p><h2 className="mt-1 text-lg font-black">আপনার কৃষি সহায়তা কেন্দ্র</h2></div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Wheat size={23} /></span>
              </div>
              <Link href="/marketplace" className="group mt-4 flex items-center gap-4 rounded-2xl bg-[#0b6b4f] p-4 text-white transition hover:bg-[#07543e] sm:p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15"><ShoppingBasket size={26} /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-emerald-100">আপনার চাষের জন্য উপযুক্ত পণ্য খুঁজুন</span><span className="mt-1 block text-lg font-extrabold">বীজ ও কৃষি উপকরণ</span><span className="mt-1 block text-xs text-emerald-100/80">পণ্যের তথ্য • জাত • কেনাকাটা</span></span>
                <ChevronRight size={20} className="transition group-hover:translate-x-1" />
              </Link>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href="/crop-disease" className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-rose-700"><Leaf size={21} /></span><span className="mt-3 block text-sm font-extrabold">ফসলের রোগ</span><span className="mt-1 block text-xs leading-5 text-slate-500">সমস্যা ও করণীয়</span></Link>
                <Link href="/market-prices" className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-700"><TrendingUp size={21} /></span><span className="mt-3 block text-sm font-extrabold">বাজারদর</span><span className="mt-1 block text-xs leading-5 text-slate-500">দাম দেখে পরিকল্পনা</span></Link>
                <Link href="/weather" className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sky-700"><CloudSun size={21} /></span><span className="mt-3 block text-sm font-extrabold">আবহাওয়া</span><span className="mt-1 block text-xs leading-5 text-slate-500">চাষের পরিকল্পনা</span></Link>
                <Link href="/farms" className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700"><Sprout size={21} /></span><span className="mt-3 block text-sm font-extrabold">আমার খামার</span><span className="mt-1 block text-xs leading-5 text-slate-500">ফসল ও কাজের রেকর্ড</span></Link>
              </div>
              <Link href="/ai" className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600 transition hover:bg-emerald-50"><Bot size={17} className="shrink-0 text-emerald-700" /> বীজের পাশাপাশি ফসলের প্রশ্নও করুন <ArrowRight size={14} className="ml-auto shrink-0" /></Link>
            </div>
            
          </div>
        </div>
      </section>

      <section id="green-living" aria-labelledby="green-living-title" className="border-y border-emerald-100 bg-gradient-to-br from-[#eff7e9] via-white to-[#f4f8e9] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-xs font-black tracking-wide text-emerald-800"><Sprout size={15} /> AGRIVA GREEN LIVING</span>
              <h2 id="green-living-title" className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-[#173629] sm:text-4xl lg:text-5xl">আরও সবুজ জীবন, একসাথে গড়ি</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">গাছ ও বাগানের জন্য আলাদা একটি জায়গা—গাছ কিনুন, গাছ বিনিময় করুন, নিজের গাছের যত্নের রেকর্ড রাখুন এবং AGRIVA কমিউনিটির সবুজ উদ্যোগের প্রভাব দেখুন।</p>
              <Link href="/green-living" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-[#07543e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">Green Living ঘুরে দেখুন <ArrowRight size={17} /></Link>
              <p className="mt-3 text-xs leading-5 text-slate-500">মোবাইল ও ডেস্কটপে সহজে ব্যবহার করুন। ব্যক্তিগত গার্ডেনের তথ্য শুধু আপনার অ্যাকাউন্টের জন্য।</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link href="/plant-market" className="group flex min-h-40 items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-50 text-lime-800"><Leaf size={24} /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-[#173629]">Trusted Plant Marketplace</span><span className="mt-1 block text-sm leading-6 text-slate-600">গাছ, চারা ও বাগানের পণ্য খুঁজুন।</span><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">গাছ দেখুন <ChevronRight size={16} className="transition group-hover:translate-x-1" /></span></span>
              </Link>
              <Link href="/green-exchange" className="group flex min-h-40 items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Users size={24} /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-[#173629]">Tree Exchange 2.0</span><span className="mt-1 block text-sm leading-6 text-slate-600">কমিউনিটির সঙ্গে গাছ বিনিময় করুন।</span><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">বিনিময় বোর্ড <ChevronRight size={16} className="transition group-hover:translate-x-1" /></span></span>
              </Link>
              <Link href="/garden" className="group flex min-h-40 items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800"><Sprout size={24} /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-[#173629]">Personal Garden</span><span className="mt-1 block text-sm leading-6 text-slate-600">গাছের তালিকা ও যত্নের কাজ গুছিয়ে রাখুন।</span><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">আমার গার্ডেন <ChevronRight size={16} className="transition group-hover:translate-x-1" /></span></span>
              </Link>
              <Link href="/impact" className="group flex min-h-40 items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800"><TrendingUp size={24} /></span>
                <span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-[#173629]">Impact & Trust</span><span className="mt-1 block text-sm leading-6 text-slate-600">সম্পন্ন বিনিময় ও যাচাইযোগ্য প্রভাব দেখুন।</span><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">প্রভাব দেখুন <ChevronRight size={16} className="transition group-hover:translate-x-1" /></span></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">আপনার দরকারি সবকিছু</p><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">এক প্ল্যাটফর্মে কৃষির সব সেবা</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">যে কাজটি করতে চান, সেটি বেছে নিন—সরাসরি সংশ্লিষ্ট পেজে গিয়ে ব্যবহার করুন।</p></div>
          <Link href="/agriculture-calculators" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-emerald-800 hover:gap-3">সব টুলস দেখুন <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, subtitle, detail, href, tone }) => <Link key={href} href={href} className="group flex min-h-44 flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:min-h-52 sm:p-6"><div className="flex items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={24} /></span><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></div><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-1 text-sm font-bold text-emerald-800">{subtitle}</p><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Link>)}
        </div>
      </section>

      <section id="career-tools" className="border-y border-blue-100/80 bg-gradient-to-b from-[#f3f7ff] via-white to-[#f8f8f1] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-800">AGRIVA CAREER TOOLS</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">কৃষি চাকরি খুঁজুন, নিজের CV তৈরি করুন</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">কাজ খোঁজা থেকে আবেদন করার প্রস্তুতি—ক্যারিয়ারের প্রয়োজনীয় টুলস এক জায়গায়। মোবাইল বা কম্পিউটার থেকেই শুরু করুন।</p>
            </div>
            <Link href="/jobs" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-blue-900 hover:gap-3">সব চাকরি দেখুন <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/jobs" className="group flex min-h-56 flex-col rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-800"><Briefcase size={27} /></span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">চাকরি ও নিয়োগ</span>
              </div>
              <h3 className="mt-5 text-xl font-black sm:text-2xl">কৃষি চাকরি ও কৃষিশ্রমিক খুঁজুন</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">নিজের জেলা বা এলাকার দৈনিক, মৌসুমি, পার্ট-টাইম ও ফুল-টাইম কাজ খুঁজুন। প্রয়োজন হলে কর্মী নিয়োগের জন্যও চাকরি পোস্ট করুন।</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-blue-900">চাকরি খুঁজুন <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
            <Link href="/jobs/cv-builder" className="group flex min-h-56 flex-col rounded-3xl border border-violet-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-800"><FileText size={27} /></span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-900">ফ্রি CV টুল</span>
              </div>
              <h3 className="mt-5 text-xl font-black sm:text-2xl">কয়েক ধাপে পেশাদার CV তৈরি করুন</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">বাংলা বা English বেছে নিন, নিজের তথ্য যোগ করুন, পছন্দের template-এ preview দেখুন এবং PDF হিসেবে সেভ করুন।</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-violet-900">CV তৈরি শুরু করুন <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">টিপস: CV Builder-এ তথ্য এই browser/device-এ সেভ হয়। শেয়ার করা ডিভাইসে ব্যক্তিগত তথ্য সেভ না রাখাই ভালো।</p>
        </div>
      </section>

      <section className="border-y border-emerald-100/80 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">AGRIVA SEED STORE</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">আপনার চাষের জন্য বীজ খুঁজুন</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">কেনার আগে জাত, প্যাকেটের পরিমাণ, পণ্যের বিবরণ ও প্রযোজ্য চাষের নির্দেশনা দেখে নিন।</p></div>
            <Link href="/marketplace" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-emerald-800 hover:gap-3">সব পণ্য দেখুন <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Wheat, name: "ধানের বীজ", note: "মৌসুম ও জাত অনুযায়ী বেছে নিন", tone: "bg-amber-50 text-amber-800" },
              { icon: Sprout, name: "সবজির বীজ", note: "বাগান ও বাণিজ্যিক চাষের জন্য", tone: "bg-lime-50 text-lime-800" },
              { icon: Leaf, name: "ফসলের পরিচর্যা", note: "চাষের উপকরণ ও সহায়ক পণ্য", tone: "bg-emerald-50 text-emerald-800" },
              { icon: PackageCheck, name: "পণ্যের তথ্য", note: "বিবরণ ও প্রাপ্যতা যাচাই করুন", tone: "bg-sky-50 text-sky-800" },
            ].map(({ icon: Icon, name, note, tone }) => <Link key={name} href="/marketplace" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#fbfdfb] p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={23} /></span>
              <span className="min-w-0 flex-1"><span className="block font-extrabold">{name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{note}</span></span><ChevronRight size={17} className="text-slate-300 group-hover:text-emerald-700" />
            </Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-[#123f30] p-7 text-white sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><BookOpen size={15} /> কৃষি জ্ঞান ও শেখা</span>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">শিখুন, পরিকল্পনা করুন, এগিয়ে যান</h2>
            <p className="mt-4 text-sm leading-7 text-emerald-50/80">ফসল, চাষাবাদ ও কৃষি প্রযুক্তি সম্পর্কে জানুন। কৃষক, শিক্ষার্থী, কৃষিবিদ ও উদ্যোক্তাদের জন্য দরকারি তথ্য এক জায়গায় সাজানো।</p>
            <Link href="/learn" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#123f30] transition hover:bg-emerald-50">কৃষি গাইড দেখুন <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Sprout, title: "আমি কৃষক", description: "খামার, ফসলের রোগ, আবহাওয়া ও লাভ-লোকসানের হিসাব", href: "/farms", tone: "bg-lime-50 text-lime-800" },
              { icon: ShoppingCart, title: "আমি ক্রেতা", description: "কৃষিপণ্য, বীজ ও গাছ খুঁজুন; কেনার আগে তথ্য দেখুন", href: "/marketplace", tone: "bg-blue-50 text-blue-800" },
              { icon: Store, title: "আমি বিক্রেতা / রিসেলার", description: "পণ্য, কমিশন ও বিক্রির সুযোগ সম্পর্কে জানুন", href: "/dashboard", tone: "bg-orange-50 text-orange-800" },
              { icon: Truck, title: "আমি পরিবহন সেবাদাতা", description: "কৃষিপণ্য পরিবহন ও ডেলিভারির সুযোগ খুঁজুন", href: "/transport", tone: "bg-sky-50 text-sky-800" },
              { icon: GraduationCap, title: "আমি শিক্ষার্থী / চাকরিপ্রার্থী", description: "কৃষি শেখা, চাকরি খোঁজা ও CV তৈরি", href: "/jobs", tone: "bg-indigo-50 text-indigo-800" },
              { icon: Stethoscope, title: "আমি কৃষিবিদ / পরামর্শদাতা", description: "কৃষি জ্ঞান, গাইড ও প্রশ্নের প্রাথমিক সহায়তা", href: "/learn", tone: "bg-teal-50 text-teal-800" },
            ].map(({ icon: Icon, title, description, href, tone }) => <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={22} /></span>
              <h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">শুরু করুন <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#123f30] p-7 text-white sm:p-9">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[30px] border-white/5" />
            <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><Sprout size={15} /> পরিকল্পনা থেকে ফলন</span><h2 className="mt-5 max-w-md text-3xl font-black leading-tight sm:text-4xl">আপনার খামারের তথ্য থাকুক আপনার হাতেই</h2><p className="mt-4 max-w-md text-sm leading-7 text-emerald-50/75">খামার তৈরি করুন, ফসলের মৌসুম যোগ করুন এবং কাজের ডায়েরি রাখুন। ধাপে ধাপে আপনার খামারের ডিজিটাল রেকর্ড গড়ে তুলুন।</p><Link href="/farms" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#123f30] transition hover:bg-emerald-50">আমার খামার শুরু করুন <ArrowRight size={16} /></Link></div>
          </div>
          <div className="rounded-[2rem] border border-[#e0e7da] bg-white p-7 shadow-sm sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">দ্রুত প্রবেশ</p><h2 className="mt-2 text-2xl font-black">যা দরকার, এক ক্লিকেই</h2><p className="mt-2 text-sm leading-6 text-slate-500">জনপ্রিয় বিভাগগুলো থেকে সরাসরি কাজ শুরু করুন।</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {toolLinks.map(({ icon: Icon, label, href }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={20} /></span><span className="flex-1 text-sm font-bold">{label}</span><ChevronRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></Link>)}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="agri-blog-title" className="border-y border-emerald-100 bg-[#f3f7ef] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">AGRIVA KNOWLEDGE & STORIES</p>
              <h2 id="agri-blog-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">কৃষি ব্লগ, ব্যবহারিক গাইড ও নতুন ধারণা</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">মৌসুমি কাজ, ফসলের যত্ন, বাজার বুঝে সিদ্ধান্ত এবং কৃষি প্রযুক্তি সম্পর্কে সহজ ভাষায় পড়ুন।</p>
            </div>
            <Link href="/blog" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-emerald-800 hover:gap-3">সব ব্লগ পড়ুন <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: CloudSun, label: "মৌসুমি পরিকল্পনা", title: "আবহাওয়া দেখে কৃষিকাজের পরিকল্পনা", text: "বপন, সেচ ও ফসল কাটার আগে পূর্বাভাস এবং স্থানীয় পরামর্শ মিলিয়ে সিদ্ধান্ত নিন।", href: "/weather", tone: "bg-sky-50 text-sky-800" },
              { icon: Leaf, label: "ফসলের যত্ন", title: "রোগের লক্ষণ দেখলে আগে কী করবেন", text: "লক্ষণ নথিবদ্ধ করুন, আক্রান্ত অংশ পর্যবেক্ষণ করুন এবং নিশ্চিত না হয়ে রাসায়নিক প্রয়োগ করবেন না।", href: "/crop-disease", tone: "bg-rose-50 text-rose-800" },
              { icon: TrendingUp, label: "ব্যবসা ও বাজার", title: "খরচ ও বাজারদর মিলিয়ে হিসাব করুন", text: "ইনপুট খরচ, পরিবহন, সম্ভাব্য বিক্রয়মূল্য ও ঝুঁকি ধরে লাভের হিসাব সাজান।", href: "/agriculture-calculators", tone: "bg-amber-50 text-amber-800" },
            ].map(({ icon: Icon, label, title, text, href, tone }) => <Link key={title} href={href} className="group flex h-full flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={22} /></span>
              <span className="mt-4 text-xs font-bold text-emerald-800">{label}</span>
              <h3 className="mt-2 text-lg font-extrabold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">আরও জানুন <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
            </Link>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">কৃষি-সংক্রান্ত সিদ্ধান্তে স্থানীয় আবহাওয়া, ফসলের জাত এবং প্রয়োজনে কৃষি কর্মকর্তার পরামর্শ মিলিয়ে নিন।</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-7 sm:p-10 md:flex-row md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">শুরু করুন আজই</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">আপনার কৃষিকাজকে আরও পরিকল্পিত করুন</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">কৃষি জিজ্ঞাসা দিয়ে শুরু করুন, অথবা খামার, বাজারদর ও টুলস ঘুরে দেখুন।</p></div>
          <Link href="/ai" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0b6b4f] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#07543e]">AGRIVA ব্যবহার করুন <ArrowRight size={17} /></Link>
        </div>
      </section>

      <nav aria-label="মোবাইল নেভিগেশন" className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,50,35,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {[{ icon: Sprout, label: "হোম", href: "/" }, { icon: Search, label: "খুঁজুন", href: "/search" }, { icon: Zap, label: "টুলস", href: "/agriculture-calculators" }, { icon: Briefcase, label: "চাকরি", href: "/jobs" }, { icon: ShoppingBasket, label: "বাজার", href: "/marketplace" }].map(({ icon: Icon, label, href }) => <Link key={label} href={href} aria-label={label} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 motion-reduce:transition-none"><Icon size={19} /><span>{label}</span></Link>)}
        </div>
      </nav>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Link href="/" aria-label="AGRIVA home" className="flex items-center"><img src="/agriva-logo.svg" alt="AGRIVA — Growing a Better Tomorrow" width="320" height="85" className="h-10 w-36 object-contain object-left" /></Link>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link href="/ai" className="hover:text-emerald-800">AI সহায়ক</Link>
              <Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link>
              <Link href="/learn" className="hover:text-emerald-800">শিখুন</Link>
              <Link href="/jobs" className="hover:text-emerald-800">কৃষি চাকরি</Link>
              <Link href="/jobs/cv-builder" className="hover:text-emerald-800">CV Builder</Link>
              <Link href="/about-us" className="hover:text-emerald-800">About Us</Link>
              <Link href="/contact-us" className="hover:text-emerald-800">Contact Us</Link>
            </nav>
          </div>
          <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <p className="text-sm font-extrabold text-[#173629]">সরাসরি যোগাযোগ করুন</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">কোনো প্রশ্ন বা সহায়তার জন্য ফোন করুন অথবা WhatsApp-এ মেসেজ পাঠান।</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <a href="tel:01717504028" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#07543e] sm:w-auto" aria-label="AGRIVA-তে 01717504028 নম্বরে ফোন করুন">
                <span aria-hidden="true">☎</span> ফোন করুন: 01717504028
              </a>
              <a href="https://wa.me/8801717504028?text=Hello%20AGRIVA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services." target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 sm:w-auto" aria-label="AGRIVA-কে WhatsApp-এ মেসেজ পাঠান 01717504028">
                <span aria-hidden="true">✉</span> WhatsApp-এ মেসেজ দিন
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Legal links" className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy-policy" className="hover:text-emerald-800">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-emerald-800">Terms of Service</Link>
            </nav>
            <p>Copyright © {new Date().getFullYear()} | Agriva.com.bd</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ArrowDownRight, ArrowRight, BookOpen, Bot, CalendarDays, CheckCircle2,
  ChevronRight, CloudSun, Droplets, Leaf, MapPinned, Search,
  ShoppingBasket, Sprout, Store, Tractor, TrendingUp, Wheat, Zap,
  Users, GraduationCap, Stethoscope, PackageCheck, ShoppingCart,
} from "lucide-react";

const services = [
  { icon: ShoppingBasket, title: "বীজ ও কৃষি উপকরণ", subtitle: "প্রয়োজনীয় পণ্য খুঁজুন", detail: "বীজ, জাত ও পণ্যের তথ্য দেখে কেনাকাটা শুরু করুন", href: "/marketplace", tone: "bg-lime-50 text-lime-800" },
  { icon: BookOpen, title: "কৃষি শেখা ও গাইড", subtitle: "জ্ঞান বাড়ান প্রতিদিন", detail: "কৃষি বিষয়ক গাইড, পাঠ ও নিবন্ধ পড়ুন", href: "/learn", tone: "bg-teal-50 text-teal-700" },
  { icon: Bot, title: "AI কৃষি সহায়ক", subtitle: "প্রশ্ন করুন, করণীয় জানুন", detail: "ফসল, সার, রোগ ও চাষাবাদ নিয়ে AI সহায়তা", href: "/ai", tone: "bg-violet-50 text-violet-700" },
  { icon: Leaf, title: "ফসলের রোগ শনাক্ত", subtitle: "সমস্যা বুঝে সমাধান নিন", detail: "ফসলের লক্ষণ নিয়ে সহায়তা পান", href: "/crop-disease", tone: "bg-rose-50 text-rose-700" },
  { icon: CloudSun, title: "আবহাওয়া", subtitle: "পরিকল্পনা করুন আগেই", detail: "চাষাবাদের কাজে আবহাওয়ার তথ্য", href: "/weather", tone: "bg-sky-50 text-sky-700" },
  { icon: TrendingUp, title: "বাজারদর", subtitle: "দাম জেনে সিদ্ধান্ত নিন", detail: "কৃষিপণ্যের বাজারদরের তথ্য দেখুন", href: "/market-prices", tone: "bg-amber-50 text-amber-700" },
  { icon: Tractor, title: "আমার খামার", subtitle: "খামার ও ফসলের হিসাব", detail: "খামার, মৌসুম ও কাজের ডায়েরি রাখুন", href: "/farms", tone: "bg-emerald-50 text-emerald-700" },
  { icon: Zap, title: "কৃষি ক্যালকুলেটর", subtitle: "দ্রুত হিসাব করুন", detail: "বীজ, সার, সেচ ও উৎপাদন খরচের টুল", href: "/tools", tone: "bg-orange-50 text-orange-700" },
];

const toolLinks = [
  { icon: CalendarDays, label: "ফসল ক্যালেন্ডার", href: "/crop-calendar" },
  { icon: Search, label: "স্মার্ট সার্চ", href: "/search" },
  { icon: Store, label: "কৃষি ব্লগ", href: "/blog" },
  { icon: MapPinned, label: "আমার ড্যাশবোর্ড", href: "/dashboard" },
];

export const metadata: Metadata = {
  title: "বীজ, কৃষি সেবা ও কৃষি কমিউনিটি",
  description: "AGRIVA-তে বীজ ও কৃষি উপকরণ খুঁজুন, ফসলের পরামর্শ নিন, কৃষক-শিক্ষার্থী-কৃষিবিদের সঙ্গে যুক্ত থাকুন এবং নিজের খামারের হিসাব রাখুন।",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: publicSettings } = await supabase.rpc("get_public_site_settings");
  const settingValue = (key: string, fallback = "") => (publicSettings ?? []).find((setting: { key: string; value: string }) => setting.key === key)?.value?.trim() || fallback;
  const siteName = settingValue("site_name", "AGRIVA");
  const homepageNotice = settingValue("homepage_notice");
  const homepageHeroTitle = settingValue("homepage_hero_title", "কৃষির প্রতিটি ধাপে আপনার পাশে AGRIVA.");
  const homepageHeroSubtitle = settingValue("homepage_hero_subtitle", "বীজ ও কৃষি উপকরণ খুঁজুন, ফসলের বিষয়ে সহায়তা নিন, নিজের খামারের হিসাব রাখুন—কৃষির প্রয়োজনীয় ডিজিটাল টুলস এক জায়গায়, সহজ বাংলায়।");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f1] pb-20 text-[#173629] selection:bg-emerald-200 selection:text-emerald-950 sm:pb-0">
      {homepageNotice && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">{homepageNotice}</div>}
      <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-[#fbfcf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${siteName} home`}>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#16724e] to-[#0b4936] text-white shadow-lg shadow-emerald-950/20"><Sprout size={25} /></span>
            <span><span className="block text-xl font-black tracking-tight">{siteName}</span><span className="block text-[9px] font-bold uppercase tracking-[0.24em] text-[#a77d2f]">Smart Agriculture Platform</span></span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex">
            <Link className="hover:text-[#0b6b4f]" href="#services">সেবাসমূহ</Link>
            <Link className="hover:text-[#0b6b4f]" href="/tools">কৃষি টুলস</Link>
            <Link className="hover:text-[#0b6b4f]" href="/marketplace">মার্কেটপ্লেস</Link>
            <Link className="hover:text-[#0b6b4f]" href="/learn">শিখুন</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[#0b6b4f] hover:bg-emerald-50 sm:inline-flex">লগইন</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#0b6b4f] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/15 transition hover:bg-[#07543e]">অ্যাপ খুলুন <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <section className="relative isolate bg-gradient-to-b from-[#f1f6e9] via-[#f8f8f1] to-[#f8f8f1]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[#d8e8b6]/60 blur-3xl" />
          <div className="absolute -left-36 top-32 h-80 w-80 rounded-full bg-[#c4e0cf]/45 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 md:pb-20 md:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6e5cf] bg-white/90 px-3.5 py-2 text-xs font-bold text-[#176346] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#c29a43]" /> বাংলাদেশের কৃষির জন্য এক স্মার্ট প্ল্যাটফর্ম</div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.15rem]"><span className="bg-gradient-to-r from-[#0b6b4f] to-[#5d8b36] bg-clip-text text-transparent">{homepageHeroTitle}</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">{homepageHeroSubtitle}</p>
            <form action="/search" method="get" role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-[#dce5d8] bg-white p-2 shadow-xl shadow-emerald-950/5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <Search className="ml-2 shrink-0 text-slate-400" size={21} />
              <input name="q" type="search" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400 sm:text-base" placeholder="বীজ, ফসল বা কৃষি পরামর্শ খুঁজুন..." aria-label="AGRIVA-তে খুঁজুন" />
              <button type="submit" className="rounded-xl bg-[#0b6b4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#07543e] sm:px-5">খুঁজুন</button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="mr-1 font-semibold text-slate-500">জনপ্রিয়:</span>
              {[{ label: "ধানের বীজ", href: "/marketplace" }, { label: "ফসলের রোগ", href: "/crop-disease" }, { label: "আবহাওয়া", href: "/weather" }].map(({ label, href }) => <Link key={label} href={href} className="rounded-full border border-[#dce5d8] bg-white/80 px-3 py-1.5 font-semibold text-[#42634f] transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900">{label}</Link>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600" /> এক জায়গায় বহু কৃষি সেবা</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600" /> মোবাইল ও ডেস্কটপে ব্যবহারযোগ্য</span></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#0b6b4f] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#07543e]"><ShoppingCart size={17} /> বীজ কিনুন <ArrowRight size={17} /></Link>
              <Link href="#services" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#16382b] transition hover:border-emerald-300">সব সেবা দেখুন <ArrowDownRight size={17} /></Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/60 via-lime-100/30 to-amber-100/60 blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/95 p-4 shadow-2xl shadow-emerald-950/15 ring-1 ring-emerald-950/5 backdrop-blur sm:p-6">
              <div className="relative mb-4 h-32 overflow-hidden rounded-2xl bg-gradient-to-br from-[#174c35] via-[#668c49] to-[#d7dfac]">
                <div aria-hidden="true" className="absolute inset-0 opacity-55" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85')", backgroundSize: "cover", backgroundPosition: "center" }} />
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
            <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:flex"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-lime-700"><Droplets size={20} /></span><span><span className="block text-sm font-extrabold">সহজ কৃষি টুলস</span><span className="block text-xs text-slate-500">হিসাব করুন, পরিকল্পনা করুন</span></span></div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">আপনার দরকারি সবকিছু</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">এক প্ল্যাটফর্মে কৃষির সব সেবা</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">যে কাজটি করতে চান, সেটি বেছে নিন—সরাসরি সংশ্লিষ্ট পেজে গিয়ে ব্যবহার করুন।</p></div>
          <Link href="/tools" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-emerald-800 hover:gap-3">সব টুলস দেখুন <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, subtitle, detail, href, tone }) => <Link key={href} href={href} className="group flex min-h-52 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5 sm:p-6"><div className="flex items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={24} /></span><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></div><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-1 text-sm font-bold text-emerald-800">{subtitle}</p><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Link>)}
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
              { icon: Sprout, title: "আমি কৃষক", description: "বীজ, ফসলের রোগ, আবহাওয়া ও জমির হিসাব", href: "/farms", tone: "bg-lime-50 text-lime-800" },
              { icon: GraduationCap, title: "আমি শিক্ষার্থী", description: "কৃষি গাইড, শেখা ও জ্ঞান ভাগাভাগি", href: "/learn", tone: "bg-indigo-50 text-indigo-800" },
              { icon: Stethoscope, title: "আমি কৃষিবিদ", description: "কৃষি প্রশ্ন ও বিশেষজ্ঞ জ্ঞান খুঁজুন", href: "/ai", tone: "bg-teal-50 text-teal-800" },
              { icon: Store, title: "আমি ডিলার / উদ্যোক্তা", description: "পণ্য, ক্রেতা ও মার্কেটপ্লেস", href: "/marketplace", tone: "bg-orange-50 text-orange-800" },
            ].map(({ icon: Icon, title, description, href, tone }) => <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
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

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-7 sm:p-10 md:flex-row md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">শুরু করুন আজই</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">আপনার কৃষিকাজকে আরও পরিকল্পিত করুন</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">কৃষি জিজ্ঞাসা দিয়ে শুরু করুন, অথবা খামার, বাজারদর ও টুলস ঘুরে দেখুন।</p></div>
          <Link href="/ai" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0b6b4f] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#07543e]">AGRIVA ব্যবহার করুন <ArrowRight size={17} /></Link>
        </div>
      </section>

      <nav aria-label="মোবাইল নেভিগেশন" className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,50,35,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {[{ icon: Sprout, label: "হোম", href: "/" }, { icon: Search, label: "খুঁজুন", href: "/search" }, { icon: Tractor, label: "খামার", href: "/farms" }, { icon: ShoppingBasket, label: "বাজার", href: "/marketplace" }, { icon: Users, label: "শিখুন", href: "/learn" }].map(({ icon: Icon, label, href }) => <Link key={label} href={href} aria-label={label} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"><Icon size={19} /><span>{label}</span></Link>)}
        </div>
      </nav>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-black text-[#16382b]"><Sprout size={20} className="text-emerald-700" /> AGRIVA <span className="font-normal text-slate-400">— স্মার্ট কৃষির সহায়ক</span></Link>
          <div className="flex flex-wrap gap-x-5 gap-y-3"><Link href="/ai" className="hover:text-emerald-800">AI সহায়ক</Link><Link href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</Link><Link href="/learn" className="hover:text-emerald-800">শিখুন</Link><Link href="/contact" className="hover:text-emerald-800">যোগাযোগ</Link></div>
          <p>© {new Date().getFullYear()} AGRIVA</p>
        </div>
      </footer>
    </main>
  );
}

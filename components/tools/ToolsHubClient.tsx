"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search, ArrowUpRight, LockKeyhole, SlidersHorizontal, Sparkles } from "lucide-react";
import { relatedServices, toolCategories, tools, type ToolCategoryId, type ToolEntry } from "@/lib/tools/registry";

type Locale = "bn" | "en";

const copy = {
  bn: {
    eyebrow: "AGRIVA TOOLS",
    title: "সকল কৃষি টুলস ও অনলাইন ক্যালকুলেটর এক জায়গায়",
    subtitle: "সার ও বীজের হিসাব, ফসল পরিকল্পনা, AI কৃষি সহায়তা এবং খামার ব্যবস্থাপনার প্রয়োজনীয় টুলস খুঁজে নিন।",
    search: "কোন টুলটি খুঁজছেন? বাংলা বা ইংরেজিতে লিখুন...",
    popularSearches: "জনপ্রিয় খোঁজ",
    finder: "আপনার প্রয়োজন অনুযায়ী টুল খুঁজুন",
    finderText: "আপনি কী করতে চান, সেটি বেছে নিন।",
    popular: "জনপ্রিয় টুলস",
    categories: "ক্যাটাগরি অনুযায়ী খুঁজুন",
    all: "সব টুলস",
    result: "টি টুল পাওয়া গেছে",
    empty: "এই নামে কোনো টুল পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।",
    open: "টুল খুলুন",
    login: "লগইন প্রয়োজন",
    active: "ব্যবহার করুন",
    services: "আরও AGRIVA সেবা",
    faq: "সাধারণ প্রশ্ন",
    faqs: [
      ["AGRIVA Tools কী?", "AGRIVA Tools হলো কৃষি হিসাব, পরিকল্পনা, AI সহায়তা ও খামার ব্যবস্থাপনার প্রয়োজনীয় টুলের একটি কেন্দ্রীয় তালিকা।"],
      ["কৃষি ক্যালকুলেটরের ফলাফল কি নিশ্চিত?", "ক্যালকুলেটরের ফলাফল আপনার দেওয়া তথ্যের ভিত্তিতে আনুমানিক। সার ও বীজের হার ফসল, জাত, মাটি ও চাষপদ্ধতি অনুযায়ী বদলায়; স্থানীয় কৃষি নির্দেশনা অনুসরণ করুন।"],
      ["কিছু টুল ব্যবহার করতে লগইন কেন প্রয়োজন?", "খামারের ব্যক্তিগত রেকর্ড বা সংরক্ষিত বিশ্লেষণের মতো তথ্য দেখার জন্য লগইন প্রয়োজন হতে পারে। সংশ্লিষ্ট টুলের পেজে প্রয়োজনীয় শর্ত দেখানো হবে।"],
      ["AI দিয়ে রোগ বিশ্লেষণ কি চূড়ান্ত রোগ নির্ণয়?", "না। AI বিশ্লেষণ প্রাথমিক সহায়তা মাত্র। রোগ ছড়ালে বা নিশ্চিত না হলে স্থানীয় কৃষি কর্মকর্তা বা উপযুক্ত বিশেষজ্ঞের পরামর্শ নিন।"],
      ["আমার হিসাব বা তথ্য কি সংরক্ষণ করা হয়?", "প্রতিটি টুলের নিজস্ব সংরক্ষণ পদ্ধতি আলাদা। কোনো ব্যক্তিগত তথ্য বা হিসাব সংরক্ষণের আগে সংশ্লিষ্ট টুলে দেওয়া নির্দেশনা ও সম্মতি যাচাই করুন।"],
    ],
    needs: [
      { label: "সারের পরিমাণ হিসাব", query: "সার" },
      { label: "বীজের পরিমাণ হিসাব", query: "বীজ" },
      { label: "চাষের খরচ ও লাভ", query: "লাভ" },
      { label: "ফসলের রোগ বিশ্লেষণ", query: "রোগ" },
      { label: "আবহাওয়া দেখা", query: "আবহাওয়া" },
      { label: "খামারের রেকর্ড রাখা", query: "খামার" },
    ],
  },
  en: {
    eyebrow: "AGRIVA TOOLS",
    title: "Agriculture tools and online calculators in one place",
    subtitle: "Find practical tools for seed and fertilizer estimates, crop planning, AI agriculture assistance and farm management.",
    search: "What tool are you looking for? Search in Bangla or English...",
    popularSearches: "Popular searches",
    finder: "Find a tool for your task",
    finderText: "Choose what you want to do.",
    popular: "Popular tools",
    categories: "Browse by category",
    all: "All tools",
    result: "tools found",
    empty: "No tools match that search. Try another keyword.",
    open: "Open tool",
    login: "Login required",
    active: "Use tool",
    services: "More AGRIVA services",
    faq: "Frequently asked questions",
    faqs: [
      ["What is AGRIVA Tools?", "A central directory for agriculture calculators, planning tools, AI assistance and farm management."],
      ["Are calculator results guaranteed?", "Results are estimates based on your inputs. Fertilizer and seed rates vary by crop, variety, soil and farming method; follow local agricultural guidance."],
      ["Why do some tools require login?", "Login may be required for private farm records or saved analysis. Check each tool page for its access requirements."],
      ["Is AI crop analysis a definitive diagnosis?", "No. AI analysis is preliminary assistance. Consult a local agriculture officer or qualified specialist if symptoms spread or remain uncertain."],
      ["Are my calculations or details saved?", "Storage behavior varies by tool. Review the instructions and consent notice on the relevant tool before saving personal information."],
    ],
    needs: [
      { label: "Estimate fertilizer", query: "fertilizer" },
      { label: "Calculate seed quantity", query: "seed" },
      { label: "Estimate farm profit", query: "profit" },
      { label: "Review crop disease", query: "disease" },
      { label: "Check weather", query: "weather" },
      { label: "Manage my farm", query: "farm" },
    ],
  },
} as const;

function matches(tool: ToolEntry, query: string, locale: Locale) {
  if (!query.trim()) return true;
  const value = query.trim().toLocaleLowerCase();
  const haystack = [
    tool.title, tool.titleEn, tool.description, tool.descriptionEn, ...tool.keywords,
  ].join(" ").toLocaleLowerCase();
  return haystack.includes(value) || (locale === "bn" && value.split(/\s+/).every((part) => haystack.includes(part)));
}

function ToolCard({ tool, locale }: { tool: ToolEntry; locale: Locale }) {
  const en = locale === "en";
  const Icon = tool.icon as LucideIcon;
  return (
    <Link href={tool.href} className="group flex h-full flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={21} aria-hidden="true" /></span>
        {tool.status === "login-required" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900"><LockKeyhole size={12} />{copy[locale].login}</span>}
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-slate-900">{en ? tool.titleEn : tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{en ? tool.descriptionEn : tool.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">{copy[locale].open}<ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

export default function ToolsHubClient({ locale = "bn" }: { locale?: Locale }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryId | "all">("all");
  const text = copy[locale];
  const visibleTools = useMemo(() => tools.filter((tool) => (category === "all" || tool.category === category) && matches(tool, query, locale)), [category, query, locale]);
  const featuredTools = tools.filter((tool) => tool.featured);

  function chooseNeed(value: string) {
    setQuery(value);
    setCategory("all");
    document.getElementById("all-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-900 to-teal-800 px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12 lg:px-14">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold tracking-[.18em] text-emerald-200"><Sparkles size={14} />{text.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{text.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">{text.subtitle}</p>
          <form className="mt-7 flex max-w-3xl items-center gap-3 rounded-2xl bg-white p-2 shadow-lg" role="search" onSubmit={(event) => { event.preventDefault(); document.getElementById("all-tools")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <Search className="ml-2 shrink-0 text-emerald-800" size={21} aria-hidden="true" />
            <label className="min-w-0 flex-1"><span className="sr-only">{text.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder={text.search} /></label>
            {query && <button type="button" onClick={() => setQuery("")} className="rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50">{locale === "bn" ? "মুছুন" : "Clear"}</button>}
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-emerald-100">{text.popularSearches}:</span>
            {(locale === "bn" ? ["সার", "বীজ", "লাভ", "রোগ", "আবহাওয়া"] : ["fertilizer", "seed", "profit", "disease", "weather"]).map((term) => <button key={term} type="button" onClick={() => chooseNeed(term)} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/20">{term}</button>)}
          </div>
        </section>

        <section className="mt-9" aria-labelledby="tool-finder-title">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="tool-finder-title" className="text-2xl font-black">{text.finder}</h2><p className="mt-1 text-sm text-slate-600">{text.finderText}</p></div><span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><SlidersHorizontal size={14} />{locale === "bn" ? "দ্রুত নির্বাচন" : "Quick selection"}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {text.needs.map((need) => <button key={need.query} type="button" onClick={() => chooseNeed(need.query)} className="min-h-12 rounded-xl border border-emerald-100 bg-white px-3 py-3 text-left text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{need.label}</button>)}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="popular-tools-title">
          <h2 id="popular-tools-title" className="text-2xl font-black">{text.popular}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => <ToolCard key={tool.id} tool={tool} locale={locale} />)}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="category-title">
          <h2 id="category-title" className="text-2xl font-black">{text.categories}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {toolCategories.map((item) => {
              const Icon = item.icon;
              const count = tools.filter((tool) => tool.category === item.id).length;
              return <button key={item.id} type="button" onClick={() => { setCategory(item.id); setQuery(""); document.getElementById("all-tools")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="flex min-h-28 items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={20} /></span>
                <span className="min-w-0"><span className="block font-extrabold">{locale === "bn" ? item.title : item.titleEn}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{locale === "bn" ? item.description : item.descriptionEn}</span><span className="mt-2 block text-xs font-bold text-emerald-800">{count} {locale === "bn" ? "টি টুল" : count === 1 ? "tool" : "tools"}</span></span>
              </button>;
            })}
          </div>
        </section>

        <section id="all-tools" className="mt-11 scroll-mt-28" aria-labelledby="all-tools-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="all-tools-title" className="text-2xl font-black">{text.all}</h2><p className="mt-1 text-sm text-slate-600">{visibleTools.length} {text.result}</p></div>
            <div className="flex max-w-full flex-wrap gap-2">
              <button type="button" onClick={() => setCategory("all")} className={"rounded-full px-3 py-2 text-xs font-bold transition " + (category === "all" ? "bg-emerald-800 text-white" : "border border-emerald-100 bg-white text-slate-700 hover:bg-emerald-50")}>{text.all}</button>
              {toolCategories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={"rounded-full px-3 py-2 text-xs font-bold transition " + (category === item.id ? "bg-emerald-800 text-white" : "border border-emerald-100 bg-white text-slate-700 hover:bg-emerald-50")}>{locale === "bn" ? item.title : item.titleEn}</button>)}
            </div>
          </div>
          {visibleTools.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleTools.map((tool) => <ToolCard key={tool.id} tool={tool} locale={locale} />)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-slate-600">{text.empty}</p>}
        </section>

        <section className="mt-12 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8" aria-labelledby="related-services-title">
          <h2 id="related-services-title" className="text-2xl font-black">{text.services}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedServices.map((service) => {
              const Icon = service.icon;
              return <Link key={service.href} href={service.href} className="rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><Icon size={21} className="text-emerald-800" /><span className="mt-3 block font-bold">{locale === "bn" ? service.title : service.titleEn}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{locale === "bn" ? service.description : service.descriptionEn}</span></Link>;
            })}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="tools-faq-title">
          <h2 id="tools-faq-title" className="text-2xl font-black">{text.faq}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {text.faqs.map(([question, answer]) => <details key={question} className="rounded-2xl border border-emerald-100 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{question}</summary><p className="mt-3 text-sm leading-7 text-slate-600">{answer}</p></details>)}
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Bot, Leaf, Loader2, PackageSearch, Search, ShoppingBag, Sparkles } from "lucide-react";
import MobileDashboardNav from "@/components/MobileDashboardNav";

type Product = {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
  description: string | null;
  price: number | string | null;
  stock: number | null;
  unit: string | null;
  image_url: string | null;
};

type ContentMatch = {
  slug: string;
  title: string;
  description: string;
  href: string;
  type: "guide" | "article";
};

type CatalogResult = {
  query: string;
  resultCount: number;
  products: Product[];
  guides: ContentMatch[];
  articles: ContentMatch[];
  catalogueUnavailable?: boolean;
};

type AIResult = {
  answer: string;
  answerSource?: "gemini" | "openai" | "built-in";
  fallbackReason?: "missing_api_key" | "provider_error" | "empty_response";
  error?: string;
};

const emptyCatalog: CatalogResult = { query: "", resultCount: 0, products: [], guides: [], articles: [] };

function productHref(product: Product) {
  return "/marketplace/" + encodeURIComponent(product.slug || product.id);
}

function safeImage(value: string | null) {
  if (!value) return null;
  if (value.startsWith("/")) return value;
  return /^https:\/\//i.test(value) ? value : null;
}

async function getCatalog(query: string, signal?: AbortSignal, suggest = false): Promise<CatalogResult> {
  const url = "/api/search?q=" + encodeURIComponent(query) + (suggest ? "&suggest=1" : "");
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "সার্চ ফলাফল লোড করা যাচ্ছে না।");
  return {
    ...emptyCatalog,
    ...data,
    products: Array.isArray(data.products) ? data.products : [],
    guides: Array.isArray(data.guides) ? data.guides : [],
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

function ProductCard({ product }: { product: Product }) {
  const imageUrl = safeImage(product.image_url);
  const inStock = Number(product.stock || 0) > 0;
  return (
    <Link href={productHref(product)} className="group flex gap-4 rounded-2xl border border-emerald-100 bg-white p-3.5 transition hover:border-emerald-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
      <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-700">
        {imageUrl ? <Image src={imageUrl} alt={product.name} width={96} height={96} unoptimized className="h-full w-full object-cover" /> : <ShoppingBag size={30} />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold text-emerald-700">{product.category || "কৃষি পণ্য"}</span>
        <h3 className="mt-0.5 line-clamp-2 text-base font-extrabold text-slate-900 group-hover:text-emerald-800">{product.name}</h3>
        {product.price !== null && product.price !== undefined && <p className="mt-1 text-sm font-bold text-emerald-900">৳{product.price}{product.unit ? " / " + product.unit : ""}</p>}
        <p className={"mt-1 text-xs font-semibold " + (inStock ? "text-emerald-700" : "text-amber-700")}>{inStock ? "স্টকে আছে" : "স্টক নেই"}</p>
      </div>
      <ArrowRight className="mt-auto shrink-0 text-emerald-700" size={18} aria-hidden="true" />
    </Link>
  );
}

function SmartSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") || "").trim().slice(0, 160);
  const [query, setQuery] = useState(urlQuery);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const suggestionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(urlQuery);
    setCatalog(null);
    setAiResult(null);
    setAiError("");
    if (urlQuery.length < 2) {
      setCatalog(null);
      setCatalogLoading(false);
      return;
    }
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    getCatalog(urlQuery, controller.signal)
      .then(setCatalog)
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error instanceof Error ? error.message : "সার্চে সমস্যা হয়েছে।");
      })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [urlQuery]);

  useEffect(() => {
    suggestionRequest.current?.abort();
    const value = query.trim();
    const minLength = /[\u0980-\u09ff]/.test(value) ? 2 : 3;
    if (!focused || !suggestionsOpen || value.length < minLength || value === urlQuery) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    suggestionRequest.current = controller;
    const timer = setTimeout(() => {
      getCatalog(value.slice(0, 160), controller.signal, true)
        .then((result) => { if (!controller.signal.aborted) setSuggestions(result.products); })
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]); });
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, focused, suggestionsOpen, urlQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) return;
    setSuggestionsOpen(false);
    setFocused(false);
    setSuggestions([]);
    setAiResult(null);
    setAiError("");
    // These are the only queries recorded: never record autocomplete keystrokes.
    void fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "track", query: value }),
      keepalive: true,
    }).catch(() => {});
    if (value === urlQuery) {
      setCatalogLoading(true);
      setCatalogError("");
      getCatalog(value).then(setCatalog).catch((error) =>
        setCatalogError(error instanceof Error ? error.message : "সার্চে সমস্যা হয়েছে।")
      ).finally(() => setCatalogLoading(false));
    } else {
      router.push("/search?q=" + encodeURIComponent(value));
    }
  }

  async function askAI() {
    if (!urlQuery || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: urlQuery, mode: "ai" }),
      });
      const data: AIResult = await response.json();
      if (!response.ok || !data.answer) throw new Error(data.error || "AI উত্তর দিতে পারছে না।");
      setAiResult(data);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI সহায়তা পাওয়া যায়নি।");
    } finally {
      setAiLoading(false);
    }
  }

  const contentResults = [...(catalog?.guides || []), ...(catalog?.articles || [])];
  const searched = urlQuery.length >= 2;

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-9 pb-28 text-[#17351f] sm:px-6 sm:py-14 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-extrabold text-emerald-800 hover:underline">AGRIVA হোম</Link>
          <Link href="/ai" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline"><Bot size={17} /> AGRIVA AI</Link>
        </div>
        <div className="mt-9">
          <p className="text-xs font-black tracking-[.18em] text-amber-700">AGRIVA UNIFIED SEARCH</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">আপনার প্রয়োজনীয় পণ্য ও কৃষি তথ্য খুঁজুন</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">আগে AGRIVA-এর পণ্য ও গাইডে খুঁজুন। চাইলে আলাদাভাবে AI-কে প্রশ্ন করুন। সাধারণ সার্চে AI API ব্যবহার হয় না।</p>
        </div>

        <div className="relative mt-7">
          <form role="search" onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex min-h-14 min-w-0 flex-1 items-center rounded-2xl border border-emerald-200 bg-white shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
              <Search size={20} className="ml-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <input
                type="search"
                name="q"
                value={query}
                maxLength={160}
                onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true); }}
                onFocus={() => { setFocused(true); setSuggestionsOpen(true); }}
                onKeyDown={(event) => { if (event.key === "Escape") setSuggestionsOpen(false); }}
                onBlur={() => { setFocused(false); }}
                aria-label="AGRIVA-তে পণ্য ও কৃষি তথ্য খুঁজুন"
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="যেমন: black rice, কালো ধানের বীজ, ধানের রোগ..."
                className="h-14 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              />
            </div>
            <button type="submit" disabled={query.trim().length < 2 || catalogLoading} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0b6b4f] px-7 font-extrabold text-white transition hover:bg-[#07533d] disabled:cursor-not-allowed disabled:opacity-50">
              <Search size={19} /> খুঁজুন
            </button>
          </form>
          {focused && suggestionsOpen && suggestions.length > 0 && (
            <div role="listbox" aria-label="পণ্যের সাজেশন" className="absolute left-0 right-0 top-[68px] z-20 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-xl sm:right-40">
              <p className="px-3 pb-1 pt-2 text-xs font-bold text-slate-500">পণ্যের দ্রুত ফলাফল</p>
              {suggestions.map((product) => (
                <Link key={product.id} role="option" aria-selected={false} href={productHref(product)} onMouseDown={(event) => event.preventDefault()} className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50">
                  <span className="truncate">{product.name}</span><ArrowRight size={15} className="shrink-0 text-emerald-600" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {!searched && (
          <section className="mt-9 grid gap-4 sm:grid-cols-2">
            <Link href="/marketplace" className="rounded-2xl border border-emerald-100 bg-white p-6 hover:border-emerald-400"><ShoppingBag className="text-emerald-700" /><h2 className="mt-3 font-extrabold">মার্কেটপ্লেস</h2><p className="mt-1 text-sm text-slate-600">বীজ, সার ও কৃষি উপকরণ দেখুন</p></Link>
            <Link href="/learn" className="rounded-2xl border border-emerald-100 bg-white p-6 hover:border-emerald-400"><BookOpen className="text-emerald-700" /><h2 className="mt-3 font-extrabold">কৃষি গাইড</h2><p className="mt-1 text-sm text-slate-600">চাষের ধাপ ও প্রয়োজনীয় তথ্য পড়ুন</p></Link>
          </section>
        )}

        {searched && (
          <div className="mt-9 space-y-7" aria-live="polite">
            {catalogLoading && <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><Loader2 size={18} className="animate-spin" /> সার্চ ফলাফল খোঁজা হচ্ছে...</p>}
            {catalogError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{catalogError}</p>}
            {catalog?.catalogueUnavailable && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">মার্কেটপ্লেসের ফলাফল সাময়িকভাবে পাওয়া যাচ্ছে না। কিছু ফলাফল অনুপস্থিত থাকতে পারে।</p>}

            {!catalogLoading && catalog && (
              <>
                <p className="text-sm text-slate-600">“<strong>{urlQuery}</strong>” এর জন্য {catalog.resultCount}টি প্রাসঙ্গিক ফলাফল</p>
                {catalog.products.length > 0 && (
                  <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2 text-xl font-black"><PackageSearch size={22} className="text-emerald-700" /> মিলে যাওয়া পণ্য</h2>
                      <Link href={"/marketplace?q=" + encodeURIComponent(urlQuery)} className="text-sm font-bold text-emerald-800 hover:underline">মার্কেটপ্লেসে দেখুন →</Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">{catalog.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
                  </section>
                )}

                {contentResults.length > 0 && (
                  <section>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><BookOpen size={22} className="text-emerald-700" /> কৃষি গাইড ও প্রবন্ধ</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {contentResults.map((item) => (
                        <Link href={item.href} key={item.type + item.slug} className="rounded-2xl border border-emerald-100 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm">
                          <span className="text-xs font-bold text-emerald-700">{item.type === "guide" ? "কৃষি গাইড" : "প্রবন্ধ"}</span>
                          <h3 className="mt-2 font-extrabold text-slate-900">{item.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">পড়ুন <ArrowRight size={15} /></span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {catalog.resultCount === 0 && !catalog.catalogueUnavailable && !catalogError && (
                  <div className="rounded-2xl border border-amber-100 bg-white p-6">
                    <Leaf size={25} className="text-amber-700" />
                    <h2 className="mt-3 text-lg font-extrabold">এখনো কোনো সরাসরি মিল পাওয়া যায়নি</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">ভিন্ন বানান বা সংক্ষিপ্ত শব্দ দিয়ে চেষ্টা করুন। কৃষি বিষয়ে জানতে চাইলে নিচে AI সহায়তা নিতে পারেন।</p>
                  </div>
                )}
              </>
            )}

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 text-emerald-700"><Sparkles size={22} /></div>
                <div className="flex-1">
                  <h2 className="text-lg font-black">AGRIVA AI দিয়ে আরও জানুন</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">ফসলের সমস্যা, চাষপদ্ধতি ও সাধারণ কৃষি প্রশ্নের জন্য AI উত্তর নিতে পারেন। শুধু এই বাটনে চাপলে AI API ব্যবহার হবে।</p>
                  <button type="button" disabled={aiLoading || Boolean(aiResult)} onClick={askAI} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-950 disabled:opacity-60">
                    {aiLoading ? <Loader2 size={17} className="animate-spin" /> : <Bot size={17} />}
                    {aiLoading ? "AI উত্তর তৈরি হচ্ছে..." : aiResult ? "AI উত্তর তৈরি হয়েছে" : "AI-কে জিজ্ঞেস করুন"}
                  </button>
                </div>
              </div>
              {aiError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{aiError}</p>}
              {aiResult && (
                <div className="mt-5 rounded-xl bg-white p-5">
                  <p className="text-xs font-bold text-emerald-800">AGRIVA AI · {aiResult.answerSource === "openai" ? "OpenAI" : aiResult.answerSource === "gemini" ? "Gemini" : "সাধারণ সহায়ক উত্তর"}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{aiResult.answer}</p>
                  {aiResult.fallbackReason && <p className="mt-3 text-xs text-amber-800">AI provider থেকে উত্তর পাওয়া যায়নি; সাধারণ সহায়ক তথ্য দেখানো হয়েছে।</p>}
                  <p className="mt-3 text-xs text-slate-500">স্থানীয় কৃষি পরিস্থিতি ও গুরুত্বপূর্ণ প্রয়োগের সিদ্ধান্তের আগে কৃষি কর্মকর্তার সঙ্গে যাচাই করুন।</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <MobileDashboardNav active="search" />
    </main>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f6f8f3] p-8 text-emerald-800">সার্চ লোড হচ্ছে...</main>}><SmartSearchContent /></Suspense>;
}

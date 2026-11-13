"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Bot, Leaf, Loader2, PackageSearch, Search, ShoppingBag, Sparkles, Cpu, ShieldCheck } from "lucide-react";
import MobileDashboardNav from "@/components/MobileDashboardNav";
import VisualSearchButton from "@/components/search/VisualSearchButton";
import {
  isSavedVisualQuery,
  visualSimilarity,
  VISUAL_QUERY_EVENT,
  VISUAL_QUERY_STORAGE_KEY,
  type SavedVisualQuery,
  type VisualFingerprint,
} from "@/lib/search/visual-fingerprint";

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

type IndexedVisualProduct = Product & { fingerprint: VisualFingerprint };
type RankedVisualProduct = { product: Product; score: number };
type VisualIndex = {
  products: IndexedVisualProduct[];
  indexedCount: number;
  limited: boolean;
  storageOrigin: string;
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
  const visualMode = searchParams.get("visual") === "1";
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
  const [visualQuery, setVisualQuery] = useState<SavedVisualQuery | null>(null);
  const [visualMatches, setVisualMatches] = useState<RankedVisualProduct[]>([]);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState("");
  const [indexedCount, setIndexedCount] = useState(0);
  const [visualLimited, setVisualLimited] = useState(false);
  const [visualProducts, setVisualProducts] = useState<IndexedVisualProduct[]>([]);
  const [visualStorageOrigin, setVisualStorageOrigin] = useState("");
  const [semanticMatches, setSemanticMatches] = useState<RankedVisualProduct[]>([]);
  const [semanticState, setSemanticState] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [semanticMessage, setSemanticMessage] = useState("");
  const [semanticStep, setSemanticStep] = useState("");
  const [semanticPercent, setSemanticPercent] = useState(0);
  const semanticWorkerRef = useRef<Worker | null>(null);
  const semanticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionRequest = useRef<AbortController | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchBoxRef.current?.contains(event.target)) {
        setFocused(false);
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

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

  function stopSemanticSearch() {
    semanticWorkerRef.current?.terminate();
    semanticWorkerRef.current = null;
    if (semanticTimeoutRef.current !== null) clearTimeout(semanticTimeoutRef.current);
    semanticTimeoutRef.current = null;
  }

  function startSemanticSearch() {
    if (!visualQuery || visualProducts.length === 0 || !visualStorageOrigin || semanticState === "running") return;
    if (typeof Worker === "undefined") {
      setSemanticState("error");
      setSemanticMessage("এই ব্রাউজারে লোকাল ছবি-মডেল চালানো যায় না।");
      return;
    }
    stopSemanticSearch();
    setSemanticState("running");
    setSemanticMatches([]);
    setSemanticMessage("");
    setSemanticStep("মডেল প্রস্তুত হচ্ছে");
    setSemanticPercent(0);
    try {
      const worker = new Worker("/workers/agriva-semantic-vision.mjs", { type: "module" });
      semanticWorkerRef.current = worker;
      semanticTimeoutRef.current = setTimeout(() => {
        if (semanticWorkerRef.current !== worker) return;
        stopSemanticSearch();
        setSemanticState("error");
        setSemanticMessage("উন্নত ছবি বিশ্লেষণে বেশি সময় লাগছে। সাধারণ সার্চের ফলাফল দেখানো হচ্ছে।");
      }, 240_000);
      worker.onerror = () => {
        if (semanticWorkerRef.current !== worker) return;
        stopSemanticSearch();
        setSemanticState("error");
        setSemanticMessage("ব্রাউজারে মডেল লোড করা যায়নি। ইন্টারনেট সংযোগ যাচাই করুন।");
      };
      worker.onmessage = (message: MessageEvent) => {
        if (semanticWorkerRef.current !== worker) return;
        const data = message.data;
        if (data?.type === "progress") {
          const total = Math.max(1, Number(data.total) || 1);
          const done = Math.max(0, Number(data.done) || 0);
          setSemanticStep(data.stage === "products" ? `পণ্যের ছবি বিশ্লেষণ: ${done}/${total}` : "ওপেন-সোর্স মডেল ডাউনলোড/লোড হচ্ছে");
          if (data.stage === "products") setSemanticPercent(Math.round(100 * done / total));
        } else if (data?.type === "model-progress") {
          setSemanticPercent(Math.max(0, Math.min(100, Number(data.percent) || 0)));
        } else if (data?.type === "results" && Array.isArray(data.results)) {
          const productsById = new Map(visualProducts.map((product) => [product.id, product]));
          const ranked: RankedVisualProduct[] = data.results
            .filter((entry: { id?: unknown; score?: unknown }) => typeof entry?.id === "string" && typeof entry?.score === "number")
            .map((entry: { id: string; score: number }) => ({
              product: productsById.get(entry.id),
              score: entry.score,
            }))
            .filter((entry: { product: IndexedVisualProduct | undefined; score: number }) => Boolean(entry.product) && Number.isFinite(entry.score))
            .map((entry: { product: IndexedVisualProduct | undefined; score: number }) => ({ product: entry.product!, score: entry.score }));
          setSemanticMatches(ranked);
          setSemanticState("complete");
          setSemanticStep("");
          stopSemanticSearch();
        } else if (data?.type === "error") {
          setSemanticState("error");
          setSemanticMessage(typeof data.message === "string" ? data.message : "মডেল কাজ করেনি।");
          stopSemanticSearch();
        }
      };
      const products = [...visualProducts]
        .sort((a, b) => visualSimilarity(visualQuery.fingerprint, b.fingerprint) - visualSimilarity(visualQuery.fingerprint, a.fingerprint))
        .slice(0, 48)
        .filter((product) => Boolean(product.image_url))
        .map((product) => ({
          id: product.id,
          image_url: product.image_url,
          visualScore: visualSimilarity(visualQuery.fingerprint, product.fingerprint),
        }));
      worker.postMessage({
        type: "search",
        photo: visualQuery.semanticPreview || visualQuery.preview,
        products,
        storageOrigin: visualStorageOrigin,
      });
    } catch {
      stopSemanticSearch();
      setSemanticState("error");
      setSemanticMessage("লোকাল মডেল চালু করা যায়নি। সাধারণ ফলাফল দেখানো হচ্ছে।");
    }
  }

  useEffect(() => {
    if (!visualMode) {
      stopSemanticSearch();
      setSemanticState("idle");
      setSemanticMatches([]);
      setVisualProducts([]);
      setVisualStorageOrigin("");
      setVisualQuery(null);
      setVisualMatches([]);
      setVisualLoading(false);
      return;
    }
    let controller: AbortController | null = null;
    const loadVisualResults = async () => {
      stopSemanticSearch();
      setSemanticState("idle");
      setSemanticMessage("");
      setSemanticMatches([]);
      setVisualProducts([]);
      setVisualStorageOrigin("");
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      setVisualError("");
      setVisualMatches([]);
      setIndexedCount(0);
      let parsed: unknown;
      try {
        parsed = JSON.parse(sessionStorage.getItem(VISUAL_QUERY_STORAGE_KEY) || "null");
      } catch {
        parsed = null;
      }
      if (!isSavedVisualQuery(parsed)) {
        setVisualQuery(null);
        setVisualLoading(false);
        setVisualError("ছবির সার্চের তথ্য পাওয়া যায়নি। আবার ক্যামেরা আইকনে চাপ দিয়ে ছবি নির্বাচন করুন।");
        return;
      }
      setVisualQuery(parsed);
      setVisualLoading(true);
      try {
        const response = await fetch("/api/search/visual-index", { signal: current.signal });
        const result: VisualIndex & { error?: string } = await response.json();
        if (!response.ok || !Array.isArray(result.products)) throw new Error(result.error || "ছবির সার্চ এখন পাওয়া যাচ্ছে না।");
        const ranked = result.products
          .map((product) => ({
            product,
            score: visualSimilarity(parsed.fingerprint, product.fingerprint),
          }))
          .filter((candidate) => candidate.score >= 0.76)
          .sort((a, b) => b.score - a.score)
          .slice(0, 12);
        if (!current.signal.aborted) {
          setVisualMatches(ranked);
          setVisualProducts(result.products);
          setVisualStorageOrigin(typeof result.storageOrigin === "string" ? result.storageOrigin : "");
          setIndexedCount(result.indexedCount || 0);
          setVisualLimited(Boolean(result.limited));
        }
      } catch (error) {
        if (!current.signal.aborted) setVisualError(error instanceof Error ? error.message : "ছবির সার্চ ব্যর্থ হয়েছে।");
      } finally {
        if (!current.signal.aborted) setVisualLoading(false);
      }
    };
    const onNewPhoto = () => { void loadVisualResults(); };
    window.addEventListener(VISUAL_QUERY_EVENT, onNewPhoto);
    void loadVisualResults();
    return () => {
      stopSemanticSearch();
      controller?.abort();
      window.removeEventListener(VISUAL_QUERY_EVENT, onNewPhoto);
    };
  }, [visualMode]);

  const displayedVisualMatches = semanticState === "complete" && semanticMatches.length > 0
    ? semanticMatches : visualMatches;
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

        <div ref={searchBoxRef} className="relative mt-7">
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
                aria-label="AGRIVA-তে পণ্য ও কৃষি তথ্য খুঁজুন"
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="যেমন: black rice, কালো ধানের বীজ, ধানের রোগ..."
                className="h-14 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              />
              <VisualSearchButton />
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

        {!searched && !visualMode && (
          <section className="mt-9 grid gap-4 sm:grid-cols-2">
            <Link href="/marketplace" className="rounded-2xl border border-emerald-100 bg-white p-6 hover:border-emerald-400"><ShoppingBag className="text-emerald-700" /><h2 className="mt-3 font-extrabold">মার্কেটপ্লেস</h2><p className="mt-1 text-sm text-slate-600">বীজ, সার ও কৃষি উপকরণ দেখুন</p></Link>
            <Link href="/learn" className="rounded-2xl border border-emerald-100 bg-white p-6 hover:border-emerald-400"><BookOpen className="text-emerald-700" /><h2 className="mt-3 font-extrabold">কৃষি গাইড</h2><p className="mt-1 text-sm text-slate-600">চাষের ধাপ ও প্রয়োজনীয় তথ্য পড়ুন</p></Link>
          </section>
        )}


        {visualMode && (
          <section className="mt-8 space-y-5" aria-live="polite">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
              {visualQuery ? (
                <Image src={visualQuery.preview} alt="আপনার নির্বাচিত পণ্যের ছবি" width={104} height={104} unoptimized className="h-24 w-24 rounded-xl border border-slate-100 bg-white object-contain" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><PackageSearch size={32} /></div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-black">ছবি দিয়ে পণ্য খোঁজা</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">আপনার ছবি ডিভাইসেই বিশ্লেষণ করা হয়েছে। একই বা দেখতে কাছাকাছি পণ্য খোঁজা হচ্ছে।</p>
                <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <VisualSearchButton /> অন্য ছবি নির্বাচন করুন
                </div>
              </div>
            </div>
            {visualLoading && <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><Loader2 size={18} className="animate-spin" /> পণ্যের ছবির সঙ্গে তুলনা হচ্ছে...</p>}
            {visualError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{visualError}</p>}
            {!visualLoading && !visualError && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-emerald-950">{semanticState === "complete" ? "উন্নত AI ছবি-মিলের ফলাফল" : "ছবির সঙ্গে মিলে যাওয়া পণ্য"}</h2>
                    <p className="mt-1 text-sm text-slate-600">{indexedCount}টি পণ্যের ছবি বিশ্লেষণ করে {displayedVisualMatches.length}টি সম্ভাব্য মিল পাওয়া গেছে।</p>
                  </div>
                  <Link href="/marketplace" className="text-sm font-bold text-emerald-800 hover:underline">সব পণ্য দেখুন →</Link>
                </div>
                {displayedVisualMatches.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">{displayedVisualMatches.map(({ product }) => <ProductCard key={product.id} product={product} />)}</div>
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-white p-5">
                    <p className="font-extrabold text-slate-900">যথেষ্ট কাছাকাছি পণ্যের ছবি পাওয়া যায়নি।</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">পণ্যটি সামনে থেকে পরিষ্কার আলোয় তুলুন, শুধু প্যাকেট বা পণ্যটি ফ্রেমে রাখুন। অথবা নাম লিখে সার্চ করুন।</p>
                  </div>
                )}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="rounded-xl bg-white p-2 text-emerald-700"><Cpu size={23} /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-emerald-950">উন্নত AI ছবি-মিল</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-700">Open-source CLIP মডেল ব্রাউজারেই পণ্যের ছবি থেকে বৈশিষ্ট্য বের করে তুলনা করবে। OpenAI/Gemini API লাগে না।</p>
                      <p className="mt-2 text-xs leading-5 text-amber-900">প্রথমবার মডেল ডাউনলোডে আনুমানিক ৯০–১৬০ MB ডেটা ও কিছু সময় লাগতে পারে। মোবাইল ডেটা ব্যবহারের আগে বিবেচনা করুন।</p>
                      <button type="button" onClick={startSemanticSearch} disabled={semanticState === "running" || visualProducts.length === 0}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60">
                        {semanticState === "running" ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                        {semanticState === "running" ? "উন্নত ছবি-মিল চলছে..." : semanticState === "complete" ? "আবার উন্নত ছবি-মিল করুন" : "উন্নত ছবি-মিল চালু করুন"}
                      </button>
                      {semanticState === "running" && (
                        <div className="mt-3" role="status">
                          <p className="text-xs font-semibold text-emerald-800">{semanticStep} ({semanticPercent}%)</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-200"><div className="h-full bg-emerald-700 transition-all" style={{ width: semanticPercent + "%" }} /></div>
                          <button type="button" className="mt-2 text-xs font-bold text-slate-600 underline" onClick={() => { stopSemanticSearch(); setSemanticState("idle"); setSemanticMessage(""); }}>বাতিল করুন</button>
                        </div>
                      )}
                      {semanticState === "complete" && <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-emerald-800"><ShieldCheck size={16} /> উন্নত মিল সম্পন্ন—সব হিসাব আপনার ডিভাইসে হয়েছে।</p>}
                      {semanticState === "error" && <p className="mt-3 rounded-lg bg-white p-3 text-xs text-amber-900" role="alert">{semanticMessage} আগের ছবি-মিলের ফলাফল রাখা হয়েছে।</p>}
                    </div>
                  </div>
                </div>
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                  {semanticState === "complete" ? "AI ছবির বৈশিষ্ট্য তুলনা করে সম্ভাব্য মিল সাজিয়েছে; এটি নিশ্চিত পণ্য শনাক্তকরণ নয়।" : "সাধারণ ছবি-মিল রং, নকশা ও গঠনের ভিত্তিতে কাজ করে। ভিন্ন কোণ থেকে তোলা ছবি মেলাতে উন্নত AI ছবি-মিল ব্যবহার করুন।"}{visualLimited ? " বড় ক্যাটালগের ক্ষেত্রে কিছু পণ্য অন্তর্ভুক্ত নাও থাকতে পারে।" : ""}
                </p>
              </>
            )}
          </section>
        )}

        {searched && !visualMode && (
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeSearch } from "@/lib/ai/analyze";
import { normalizeQuery } from "@/lib/ai/intent";
import { answerAgricultureQuestion } from "@/lib/ai/respond";
import { LESSONS } from "@/lib/learn/lessons";
import { resolvePublicCatalogConfig } from "@/lib/search/public-catalog-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type SearchGuide = {
  slug: string;
  title: string;
  description: string;
  href: string;
  type: "guide" | "article";
};

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const MAX_CANDIDATES = 60;

function publicClient() {
  const config = resolvePublicCatalogConfig();
  if (!config) return null;
  const { url, key } = config;
  // Public search must never use a privileged key or the visitor's session.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanTerms(value: string) {
  return normalizeQuery(value)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 2)
    .slice(0, 6);
}

function normalizeSearchText(value: string | null | undefined) {
  return normalizeQuery(value || "").replace(/[-_]/g, " ");
}

function alternativePhrases(query: string) {
  const normalized = normalizeSearchText(query);
  const phrases = [normalized];
  if (/black\s+rice|কালো\s*(?:চাল|ধান)/i.test(normalized)) {
    phrases.push("black rice", "কালো চাল", "কালো ধান");
  }
  return [...new Set(phrases)];
}

function relevance(query: string, title: string, category = "", description = "", slug = "") {
  const name = normalizeSearchText(title);
  const categoryText = normalizeSearchText(category);
  const body = normalizeSearchText(description);
  const slugText = normalizeSearchText(slug);
  const terms = cleanTerms(query);
  const phrases = alternativePhrases(query);
  let score = 0;
  let titlePhrase = false;
  for (const phrase of phrases) {
    if (name === phrase || slugText === phrase) { score = Math.max(score, 120); titlePhrase = true; }
    else if (name.includes(phrase) || slugText.includes(phrase)) { score = Math.max(score, 85); titlePhrase = true; }
    else if (categoryText.includes(phrase)) score = Math.max(score, 40);
    else if (body.includes(phrase)) score = Math.max(score, 15);
  }
  const matched = terms.filter((term) => name.includes(term) || slugText.includes(term) || categoryText.includes(term) || body.includes(term));
  if (matched.length) {
    score += matched.filter((term) => name.includes(term) || slugText.includes(term)).length * 14;
    score += matched.length * 3;
  }
  // A single broad word within a multi-word query should not swamp results.
  if (terms.length > 1 && matched.length < Math.min(2, terms.length) && !titlePhrase && score < 40) return 0;
  return score;
}

function matchingGuides(query: string): SearchGuide[] {
  return LESSONS.map((lesson) => ({
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.summary,
    href: "/learn/" + encodeURIComponent(lesson.slug),
    type: "guide" as const,
    score: relevance(query, lesson.title, lesson.crop, lesson.summary),
  }))
    .filter((lesson) => lesson.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score: _score, ...guide }) => guide);
}

async function searchCatalog(query: string, limit: number, suggestionsOnly: boolean) {
  const terms = cleanTerms(query);
  const guides = suggestionsOnly ? [] : matchingGuides(query);
  const empty = { products: [] as Product[], guides, articles: [] as SearchGuide[], catalogueUnavailable: false };
  if (!terms.length) return empty;

  const supabase = publicClient();
  if (!supabase) return { ...empty, catalogueUnavailable: true };

  const searchWords = [...new Set([...terms, ...alternativePhrases(query).flatMap(cleanTerms)])].slice(0, 10);
  const productFilter = searchWords.flatMap((word) => [
    "name.ilike.%" + word + "%",
    "category.ilike.%" + word + "%",
    "slug.ilike.%" + word + "%",
    ...(suggestionsOnly ? [] : ["description.ilike.%" + word + "%"]),
  ]).join(",");

  const productLookup = supabase.from("products")
    .select("id,slug,name,category,description,price,stock,unit,image_url")
    .eq("status", "active")
    .eq("marketplace_channel", "marketplace")
    .is("deleted_at", null)
    .or(productFilter)
    .limit(MAX_CANDIDATES);

  // Product searches need one database read; only information-seeking queries
  // additionally search published articles (guides above are local/static).
  const needsArticles = !suggestionsOnly && /চাষ|পদ্ধতি|কেন|কিভাবে|কীভাবে|লক্ষণ|পরামর্শ|রোগ|তথ্য|শিখ|guide|how|why|disease|cultivat|grow|farming|problem/i.test(query);
  const articleLookup = !needsArticles ? null : supabase.from("content_drafts")
    .select("slug,title,meta_description,primary_keyword")
    .eq("status", "published")
    .eq("content_type", "article")
    .or(searchWords.flatMap((word) => [
      "title.ilike.%" + word + "%",
      "meta_description.ilike.%" + word + "%",
      "primary_keyword.ilike.%" + word + "%",
    ]).join(","))
    .limit(40);

  const [productsResponse, articlesResponse] = await Promise.all([
    productLookup,
    articleLookup || Promise.resolve(null),
  ]);

  if (productsResponse.error) console.error("Public product search failed:", productsResponse.error.message);
  if (articlesResponse?.error) console.error("Published article search failed:", articlesResponse.error.message);

  const products = ((productsResponse.data || []) as Product[])
    .map((product) => ({
      product,
      score: relevance(query, product.name, product.category || "", product.description || "", product.slug || "") +
        (Number(product.stock || 0) > 0 ? 2 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);

  const articles = ((articlesResponse?.data || []) as Array<{
    slug: string;
    title: string;
    meta_description: string | null;
    primary_keyword: string | null;
  }>)
    .filter((item) => Boolean(item.slug))
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      description: item.meta_description || "",
      href: "/blog/" + encodeURIComponent(item.slug),
      type: "article" as const,
      score: relevance(query, item.title, item.primary_keyword || "", item.meta_description || ""),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score: _score, ...article }) => article);

  return {
    products,
    guides,
    articles,
    catalogueUnavailable: Boolean(productsResponse.error),
  };
}

// Autocomplete and submitted catalogue searches use only public database reads.
// They never invoke Gemini or OpenAI and are safe to cache by URL.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const suggestionsOnly = url.searchParams.get("suggest") === "1";
  if (query.length > 160) {
    return NextResponse.json({ error: "সার্চ সর্বোচ্চ ১৬০ অক্ষরের হতে পারে।" }, { status: 400 });
  }
  if (query.length < 2) {
    return NextResponse.json({
      query, products: [], guides: [], articles: [], resultCount: 0, zeroResult: true,
    }, { headers: { "Cache-Control": PUBLIC_CACHE } });
  }

  try {
    const catalog = await searchCatalog(query, suggestionsOnly ? 5 : 16, suggestionsOnly);
    const resultCount = catalog.products.length + catalog.guides.length + catalog.articles.length;
    return NextResponse.json({
      query,
      normalizedQuery: normalizeQuery(query),
      ...catalog,
      resultCount,
      zeroResult: resultCount === 0,
    }, { headers: { "Cache-Control": PUBLIC_CACHE } });
  } catch (error) {
    console.error("Public search failed:", error);
    return NextResponse.json({ error: "সার্চে সাময়িক সমস্যা হয়েছে।" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) return NextResponse.json({ error: "অনুসন্ধানের জন্য প্রশ্ন লিখুন।" }, { status: 400 });
    if (query.length > 2000) return NextResponse.json({ error: "প্রশ্নটি ২০০০ অক্ষরের মধ্যে রাখুন।" }, { status: 400 });

    if (body?.mode === "track") {
      // Only explicit submitted searches are counted, never autocomplete keystrokes.
      if (query.length > 160) return NextResponse.json({ tracked: false }, { status: 400 });
      const supabase = publicClient();
      if (!supabase) return NextResponse.json({ tracked: false }, { status: 503 });
      const { error } = await supabase.rpc("track_search", { p_query: query, p_session_id: null });
      if (error) {
        console.error("Search analytics logging failed:", error.message);
        return NextResponse.json({ tracked: false }, { status: 503 });
      }
      return NextResponse.json({ tracked: true });
    }

    // The AI route is called only when a person explicitly requests an AI answer.
    // Retain the legacy POST contract for existing clients and smoke tests.
    if (body?.mode && body.mode !== "ai") {
      return NextResponse.json({ error: "Unsupported search mode." }, { status: 400 });
    }
    const analysis = await analyzeSearch(query);
    const [answer, catalog] = await Promise.all([
      answerAgricultureQuestion(query, analysis.intent),
      searchCatalog(query.slice(0, 160), 6, true),
    ]);
    return NextResponse.json({
      query,
      normalizedQuery: normalizeQuery(query),
      ...analysis,
      resultCount: catalog.products.length,
      products: catalog.products,
      zeroResult: catalog.products.length === 0,
      answer: answer.answer.trim() || "আরও বিস্তারিত তথ্য দিয়ে প্রশ্নটি করুন।",
      answerSource: answer.source,
      fallbackReason: answer.fallbackReason,
      aiConfigured: answer.source === "gemini" || answer.source === "openai",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Smart Search failed:", error);
    return NextResponse.json({ error: "সার্চ এখন উত্তর দিতে পারছে না।" }, { status: 500 });
  }
}

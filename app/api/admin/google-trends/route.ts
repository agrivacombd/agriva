import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export const dynamic = "force-dynamic";
const ALLOWED_PERIODS = new Set(["today 3-m", "today 12-m", "today 5-y"]);
const AGRICULTURE = /ধান|চাল|গম|ভুট্টা|পাট|সবজি|টমেটো|আলু|পেঁয়াজ|রসুন|মরিচ|বেগুন|কুমড়া|শসা|ঢেঁড়স|ফুলকপি|বাঁধাকপি|পেঁপে|শিম|সরিষা|কৃষি|চাষ|ফসল|বীজ|সার|কীটনাশক|পোকা|সেচ|মাটি|রোগ|ধানের|ফলন|rice|wheat|maize|corn|jute|vegetable|tomato|potato|onion|garlic|chili|chilli|brinjal|eggplant|pumpkin|cucumber|okra|cauliflower|cabbage|papaya|mustard|agricultur|farm|crop|seed|fertilizer|pesticide|irrigation|soil/i;
const PRODUCT = /বীজ|দাম|কিন|বিক্র|অর্ডার|প্যাকেট|সার|কীটনাশক|যন্ত্র|seed|price|buy|sale|shop|packet|fertilizer|pesticide|equipment/i;
const INFORMATIONAL = /চাষ|পদ্ধতি|রোপণ|বপন|পরিচর্যা|ফলন|রোগ|পোকা|দমন|প্রতিকার|সমাধান|কিভাবে|কখন|কেন|সেচ|মাটি|cultivation|grow|planting|disease|treatment|how|when|yield|care|irrigation/i;
const DEFAULT_TERMS = ["ধান চাষ", "টমেটো চাষ", "মিষ্টিকুমড়া চাষ", "কৃষি বীজ", "পোকা দমন"];
type Item = { query: string; value: string; intent: string };
function classify(query: string) {
  if (PRODUCT.test(query)) return "Product / Commercial (estimated)";
  if (INFORMATIONAL.test(query)) return "Informational (estimated)";
  return "Unclassified";
}
function parseRelated(payload: any, field: "top" | "rising"): Item[] {
  const root = payload?.related_queries ?? payload?.relatedQueries ?? {};
  const raw = root[field] ?? root[field === "top" ? "top_queries" : "rising_queries"] ?? [];
  return (Array.isArray(raw) ? raw : []).slice(0, 25).filter((item: any) => typeof item?.query === "string" && AGRICULTURE.test(item.query) && classify(item.query) !== "Unclassified").map((item: any) => ({ query: item.query.slice(0, 160), value: String(item.value ?? item.extracted_value ?? "—"), intent: classify(item.query) }));
}
export async function GET(request: NextRequest) {
  const access = await requireAdminApi("content.read");
  if (!access.ok) return access.response;
  // The existing SEARCHAPI_API_KEY environment variable contains a Serper.dev key.
  // SERPER_API_KEY is preferred for future deployments; keep the legacy name as fallback.
  const apiKey = process.env.SERPER_API_KEY || process.env.SEARCHAPI_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false, message: "Set SERPER_API_KEY (or the existing SEARCHAPI_API_KEY) in Vercel." });
  const term = (request.nextUrl.searchParams.get("q") ?? DEFAULT_TERMS[0]).trim();
  const period = request.nextUrl.searchParams.get("period") ?? "today 12-m";
  if (!term || term.length > 100 || !AGRICULTURE.test(term) || !ALLOWED_PERIODS.has(period))
    return NextResponse.json({ error: "Choose an agriculture-related keyword and valid period." }, { status: 400 });
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: term, gl: "bd", hl: "bn", num: 10 }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store"
    });
    if (!response.ok) {
      const statuses: Record<number,string> = {
        401: "Serper API key was rejected (401).",
        402: "Serper credits or billing required (402).",
        403: "Serper request forbidden (403).",
        429: "Serper quota or rate limit reached (429)."
      };
      return NextResponse.json({ error: statuses[response.status] ?? "Serper search provider returned an error.", providerStatus: response.status }, { status: 502 });
    }
    const payload = await response.json();
    const related = Array.isArray(payload?.relatedSearches) ? payload.relatedSearches : [];
    const questions = Array.isArray(payload?.peopleAlsoAsk) ? payload.peopleAlsoAsk : [];
    const convert = (items: unknown[], field: "query" | "question") => items
      .filter((item): item is Record<string,unknown> => !!item && typeof item === "object")
      .map(item => item[field])
      .filter((value): value is string => typeof value === "string" && AGRICULTURE.test(value) && classify(value) !== "Unclassified")
      .slice(0,25).map(query => ({ query: query.slice(0,160), value: "—", intent: classify(query) }));
    return NextResponse.json({
      configured: true, provider: "Serper.dev Google Search", geography: "BD",
      keyword: term, period: "not applicable", metric: "Google related searches and People Also Ask; no trend score or search volume",
      intentMethod: "Rule-based informational/product intent estimate",
      top: convert(related, "query"), rising: convert(questions, "question"),
      fetchedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: "Unable to contact Serper.dev. Try again." }, { status: 502 });
  }
}

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
  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false, message: "Add SEARCHAPI_API_KEY in Vercel server environment to enable Google Trends data. Official Google Trends API is alpha-access only." });
  const term = (request.nextUrl.searchParams.get("q") ?? DEFAULT_TERMS[0]).trim();
  const period = request.nextUrl.searchParams.get("period") ?? "today 12-m";
  if (!term || term.length > 100 || !AGRICULTURE.test(term) || !ALLOWED_PERIODS.has(period)) return NextResponse.json({ error: "Invalid keyword or period." }, { status: 400 });
  const url = new URL("https://www.searchapi.io/api/v1/search");
  url.searchParams.set("engine", "google_trends"); url.searchParams.set("q", term); url.searchParams.set("geo", "BD"); url.searchParams.set("time", period); url.searchParams.set("data_type", "RELATED_QUERIES");
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "SearchAPI rejected the request (400). Check provider parameters.",
        401: "SearchAPI authentication failed (401). Verify the server-side API key.",
        402: "SearchAPI requires available credits or an eligible plan (402).",
        403: "SearchAPI denied access to Google Trends (403). Check plan and engine permissions.",
        429: "SearchAPI rate limit or quota reached (429). Please retry later.",
        500: "SearchAPI encountered a server error (500).",
        502: "SearchAPI could not retrieve Google Trends data (502).",
        503: "SearchAPI is temporarily unavailable (503)."
      };
      return NextResponse.json({ error: messages[response.status] ?? "Google Trends provider request failed.", providerStatus: response.status }, { status: 502 });
    }
    const payload = await response.json();
    if (payload?.error) return NextResponse.json({ error: "SearchAPI returned a provider error. Check Google Trends engine access and account credits." }, { status: 502 });
    return NextResponse.json({ configured: true, provider: "SearchAPI (Google Trends)", geography: "BD", keyword: term, period, metric: "Relative search interest; not search volume", intentMethod: "Bangladesh agriculture-only keyword filtering and rule-based informational/product intent estimates; not Google-provided intent", top: parseRelated(payload, "top"), rising: parseRelated(payload, "rising"), fetchedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Could not fetch Google Trends data." }, { status: 502 }); }
}

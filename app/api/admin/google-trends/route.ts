import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export const dynamic = "force-dynamic";
const ALLOWED_PERIODS = new Set(["today 3-m", "today 12-m", "today 5-y"]);
const DEFAULT_TERMS = ["ধান চাষ", "টমেটো চাষ", "মিষ্টিকুমড়া চাষ", "কৃষি বীজ", "পোকা দমন"];
type Item = { query: string; value: string; intent: string };
function classify(query: string) {
  if (/দাম|কিন|বিক্র|বীজ|price|buy|seed/i.test(query)) return "Commercial (estimated)";
  if (/কিভাবে|পদ্ধতি|চাষ|রোপণ|সার|রোগ|পোকা|সমাধান|how|disease|fertilizer/i.test(query)) return "Informational (estimated)";
  return "Unclassified";
}
function parseRelated(payload: any, field: "top" | "rising"): Item[] {
  const root = payload?.related_queries ?? payload?.relatedQueries ?? {};
  const raw = root[field] ?? root[field === "top" ? "top_queries" : "rising_queries"] ?? [];
  return (Array.isArray(raw) ? raw : []).slice(0, 25).filter((item: any) => typeof item?.query === "string").map((item: any) => ({ query: item.query.slice(0, 160), value: String(item.value ?? item.extracted_value ?? "—"), intent: classify(item.query) }));
}
export async function GET(request: NextRequest) {
  const access = await requireAdminApi("content.read");
  if (!access.ok) return access.response;
  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false, message: "Add SEARCHAPI_API_KEY in Vercel server environment to enable Google Trends data. Official Google Trends API is alpha-access only." });
  const term = (request.nextUrl.searchParams.get("q") ?? DEFAULT_TERMS[0]).trim();
  const period = request.nextUrl.searchParams.get("period") ?? "today 12-m";
  if (!term || term.length > 100 || !ALLOWED_PERIODS.has(period)) return NextResponse.json({ error: "Invalid keyword or period." }, { status: 400 });
  const url = new URL("https://www.searchapi.io/api/v1/search");
  url.searchParams.set("engine", "google_trends"); url.searchParams.set("q", term); url.searchParams.set("geo", "BD"); url.searchParams.set("time", period); url.searchParams.set("data_type", "RELATED_QUERIES");
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "Google Trends data provider is temporarily unavailable.", providerStatus: response.status }, { status: 502 });
    const payload = await response.json();
    if (payload?.error) return NextResponse.json({ error: "Google Trends provider returned an error." }, { status: 502 });
    return NextResponse.json({ configured: true, provider: "SearchAPI (Google Trends)", geography: "BD", keyword: term, period, metric: "Relative search interest; not search volume", intentMethod: "Rule-based estimates, not Google-provided intent", top: parseRelated(payload, "top"), rising: parseRelated(payload, "rising"), fetchedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Could not fetch Google Trends data." }, { status: 502 }); }
}

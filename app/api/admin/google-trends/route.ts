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
  return (Array.isArray(raw) ? raw : []).slice(0, 25).filter((item: any) => typeof item?.query === "string" && AGRICULTURE.test(item.query) && classify(item.query) !== "Unclassified").map((item: any) => ({ query: item.query.slice(0, 160), value: String(item.values ?? item.value ?? item.extracted_value ?? "—"), intent: classify(item.query) }));
}
export async function GET(request: NextRequest) {
  const access = await requireAdminApi("content.read");
  if (!access.ok) return access.response;
  const term = (request.nextUrl.searchParams.get("q") ?? DEFAULT_TERMS[0]).trim();
  const period = request.nextUrl.searchParams.get("period") ?? "today 12-m";
  const provider = request.nextUrl.searchParams.get("provider") ?? "serper";
  if (!term || term.length > 100 || !AGRICULTURE.test(term) || !ALLOWED_PERIODS.has(period) || !["serper","trends"].includes(provider))
    return NextResponse.json({ error: "Invalid agriculture keyword, period or provider." }, { status: 400 });
  const searchApiKey = process.env.GOOGLE_TRENDS_SEARCHAPI_KEY;
  // Legacy SEARCHAPI_API_KEY was configured with a Serper.dev key in AGRIVA.
  // Do not reuse it for SearchAPI.io; both providers need distinct credentials.
  const serperKey = process.env.SERPER_API_KEY || process.env.SEARCHAPI_API_KEY;
  const apiKey = provider === "trends" ? searchApiKey : serperKey;
  if (!apiKey) return NextResponse.json({
    configured: false, provider,
    message: provider === "trends"
      ? "Set GOOGLE_TRENDS_SEARCHAPI_KEY in Vercel for SearchAPI.io Google Trends."
      : "Set SERPER_API_KEY in Vercel for Serper.dev Google Search."
  });
  try {
    if (provider === "trends") {
      const url = new URL("https://www.searchapi.io/api/v1/search");
      url.searchParams.set("engine","google_trends");
      url.searchParams.set("data_type","RELATED_QUERIES");
      url.searchParams.set("q",term);
      url.searchParams.set("geo","BD");
      url.searchParams.set("time",period);
      const response = await fetch(url,{headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(15000),next:{revalidate:3600}});
      if (!response.ok) return NextResponse.json({error:"SearchAPI.io Google Trends request failed.",providerStatus:response.status},{status:502});
      const payload = await response.json();
      if (payload?.error) return NextResponse.json({error:"SearchAPI.io returned an error."},{status:502});
      return NextResponse.json({
        configured:true,provider:"SearchAPI.io Google Trends",geography:"BD",keyword:term,period,
        metric:"Google Trends relative interest, not monthly search volume",
        intentMethod:"Heuristic informational/product classification, not Google intent data",
        top:parseRelated(payload,"top"),rising:parseRelated(payload,"rising"),
        fetchedAt:new Date().toISOString()
      });
    }
    const response = await fetch("https://google.serper.dev/search",{
      method:"POST",headers:{"X-API-KEY":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({q:term,gl:"bd",hl:"bn",num:10}),
      signal:AbortSignal.timeout(12000),cache:"no-store"
    });
    if (!response.ok) return NextResponse.json({error:"Serper.dev Google Search request failed.",providerStatus:response.status},{status:502});
    const payload = await response.json();
    const related = Array.isArray(payload?.relatedSearches) ? payload.relatedSearches : [];
    const questions = Array.isArray(payload?.peopleAlsoAsk) ? payload.peopleAlsoAsk : [];
    const convert = (items:unknown[],field:"query"|"question") => items
      .filter((item):item is Record<string,unknown> => !!item && typeof item==="object")
      .map(item=>item[field])
      .filter((value):value is string => typeof value==="string" && AGRICULTURE.test(value) && classify(value)!=="Unclassified")
      .slice(0,25).map(query=>({query:query.slice(0,160),value:"—",intent:classify(query)}));
    return NextResponse.json({
      configured:true,provider:"Serper.dev Google Search",geography:"BD",keyword:term,period:"not applicable",
      metric:"Related searches and People Also Ask; no trend growth or search volume",
      intentMethod:"Heuristic informational/product classification",
      top:convert(related,"query"),rising:convert(questions,"question"),
      fetchedAt:new Date().toISOString()
    });
  } catch {
    return NextResponse.json({error:"Search provider connection failed or timed out."},{status:502});
  }
}

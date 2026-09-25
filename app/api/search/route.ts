import { NextRequest, NextResponse } from "next/server";
import { analyzeSearch } from "@/lib/ai/analyze";
import { normalizeQuery } from "@/lib/ai/intent";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const analysis = await analyzeSearch(query);
  const normalizedQuery = normalizeQuery(query);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: products } = await supabase.from("products").select("id").eq("status", "active").eq("moderation_status", "approved").ilike("name", `%${query}%`).limit(10);
  const resultCount = products?.length ?? 0;

  await supabase.from("search_queries").insert({ user_id: user?.id ?? null, query, normalized_query: normalizedQuery, intent: analysis.intent, crop: analysis.crop });

  const { data: existing } = await supabase.from("content_opportunities").select("id,search_count").eq("keyword", normalizedQuery).maybeSingle();
  if (existing) {
    await supabase.from("content_opportunities").update({ search_count: (existing.search_count ?? 0) + 1, last_seen_at: new Date().toISOString(), result_count: resultCount }).eq("id", existing.id);
  } else {
    await supabase.from("content_opportunities").insert({ keyword: normalizedQuery, normalized_keyword: normalizedQuery, intent: analysis.intent, search_count: 1, result_count: resultCount, opportunity_type: analysis.opportunityType, status: "open" });
  }

  if (resultCount === 0) {
    await supabase.from("content_opportunities").upsert({ keyword: normalizedQuery, normalized_keyword: normalizedQuery, intent: analysis.intent, search_count: existing?.search_count ? existing.search_count + 1 : 1, result_count: 0, opportunity_type: analysis.opportunityType === "product" ? "both" : "article", status: "open", last_seen_at: new Date().toISOString() }, { onConflict: "normalized_keyword,opportunity_type" });
  }

  return NextResponse.json({ query, normalizedQuery, resultCount, zeroResult: resultCount === 0, ...analysis, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
}

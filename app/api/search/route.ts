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

  await supabase.from("search_queries").insert({
    user_id: user?.id ?? null,
    query,
    normalized_query: normalizedQuery,
    intent: analysis.intent,
    crop: analysis.crop,
  });

  const { data: existing } = await supabase.from("content_opportunities")
    .select("id, search_count").eq("keyword", normalizedQuery).maybeSingle();

  if (existing) {
    await supabase.from("content_opportunities").update({ search_count: (existing.search_count ?? 0) + 1 }).eq("id", existing.id);
  } else {
    await supabase.from("content_opportunities").insert({
      keyword: normalizedQuery,
      intent: analysis.intent,
      search_count: 1,
      opportunity_type: analysis.opportunityType,
      status: "open",
    });
  }

  return NextResponse.json({
    query,
    normalizedQuery,
    ...analysis,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    answer: analysis.opportunityType === "product"
      ? `AGRIVA detected a product-intent query about ${analysis.topic}.`
      : `AGRIVA detected an information opportunity about ${analysis.topic}.`,
  });
}

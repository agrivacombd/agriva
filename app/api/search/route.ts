import { NextRequest, NextResponse } from "next/server";
import { detectIntent, normalizeQuery } from "@/lib/ai/intent";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const normalizedQuery = normalizeQuery(query);
  const intent = detectIntent(query);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("search_queries").insert({
    user_id: user?.id ?? null,
    query,
    normalized_query: normalizedQuery,
    intent,
  });

  if (insertError) console.error("AGRIVA search log error:", insertError.message);

  const { data: existing } = await supabase
    .from("content_opportunities")
    .select("id, search_count, opportunity_type")
    .eq("keyword", normalizedQuery)
    .maybeSingle();

  if (existing) {
    await supabase.from("content_opportunities").update({ search_count: (existing.search_count ?? 0) + 1 }).eq("id", existing.id);
  } else {
    await supabase.from("content_opportunities").insert({
      keyword: normalizedQuery,
      intent,
      search_count: 1,
      opportunity_type: intent === "product" ? "product" : "article",
      status: "open",
    });
  }

  return NextResponse.json({
    query,
    normalizedQuery,
    intent,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    answer: Boolean(process.env.OPENAI_API_KEY)
      ? "AGRIVA AI is ready to analyze this query."
      : "AGRIVA detected the query intent. Add OPENAI_API_KEY to enable the full AI response layer.",
    opportunity: { detected: true, type: intent === "product" ? "product" : "article", keyword: normalizedQuery, status: "open" },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { analyzeSearch } from "@/lib/ai/analyze";
import { normalizeQuery } from "@/lib/ai/intent";
import { answerAgricultureQuestion } from "@/lib/ai/respond";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) return NextResponse.json({ error: "অনুসন্ধানের জন্য প্রশ্ন লিখুন।" }, { status: 400 });
    if (query.length > 2000) return NextResponse.json({ error: "প্রশ্নটি ২০০০ অক্ষরের মধ্যে রাখুন।" }, { status: 400 });

    const analysis = await analyzeSearch(query);
    const normalizedQuery = normalizeQuery(query);
    const answer = await answerAgricultureQuestion(query, analysis.intent);
    let resultCount = 0;

    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("status", "active")
        .eq("moderation_status", "approved")
        .ilike("name", \`%\${query.replace(/[,%_]/g, " ")}%\`)
        .limit(10);
      resultCount = products?.length ?? 0;

      await supabase.from("search_queries").insert({
        user_id: user?.id ?? null,
        query,
        normalized_query: normalizedQuery,
        intent: analysis.intent,
        crop: analysis.crop,
      });

      const { data: existing } = await supabase
        .from("content_opportunities")
        .select("id,search_count")
        .eq("keyword", normalizedQuery)
        .maybeSingle();

      if (existing) {
        await supabase.from("content_opportunities").update({
          search_count: (existing.search_count ?? 0) + 1,
          last_seen_at: new Date().toISOString(),
          result_count: resultCount,
        }).eq("id", existing.id);
      } else {
        await supabase.from("content_opportunities").insert({
          keyword: normalizedQuery,
          normalized_keyword: normalizedQuery,
          intent: analysis.intent,
          search_count: 1,
          result_count: resultCount,
          opportunity_type: analysis.opportunityType,
          status: "open",
        });
      }
    } catch (error) {
      console.error("Optional Smart Search analytics failed:", error);
    }

    return NextResponse.json({
      query,
      normalizedQuery,
      resultCount,
      zeroResult: resultCount === 0,
      answer: answer.answer?.trim() || "আপনার প্রশ্নটি পেয়েছি। আরও নির্দিষ্ট পরামর্শ দিতে ফসলের নাম, এলাকা এবং সমস্যার বিস্তারিত লিখুন।",
      answerSource: answer.source || "built-in",
      fallbackReason: answer.fallbackReason,
      aiConfigured: answer.source === "openai",
      ...analysis,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Smart Search failed:", error);
    return NextResponse.json({ error: "Smart Search উত্তর তৈরি করতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।" }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}

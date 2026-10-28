import { NextRequest, NextResponse } from "next/server";
import { analyzeSearch } from "@/lib/ai/analyze";
import { normalizeQuery } from "@/lib/ai/intent";
import { answerAgricultureQuestion } from "@/lib/ai/respond";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function searchTerms(value: string) {
  // Keep user input from changing PostgREST .or() filter syntax.
  // Preserve Unicode letters/numbers (including Bangla) and whitespace only.
  return value
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((term) => term.length >= 2)
    .slice(0, 6);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "অনুসন্ধানের জন্য প্রশ্ন লিখুন।" }, { status: 400 });
    }
    if (query.length > 2000) {
      return NextResponse.json({ error: "প্রশ্নটি ২০০০ অক্ষরের মধ্যে রাখুন।" }, { status: 400 });
    }

    const analysis = await analyzeSearch(query);
    const normalizedQuery = normalizeQuery(query);
    const answer = await answerAgricultureQuestion(query, analysis.intent);
    let resultCount = 0;
    let products: Array<{ id: string; name: string; category: string | null; description: string | null }> = [];

    try {
      const supabase = await createSupabaseServerClient();
      const terms = searchTerms(query);

      if (terms.length) {
        const orFilter = terms.flatMap((term) => [
          "name.ilike.%" + term + "%",
          "category.ilike.%" + term + "%",
          "description.ilike.%" + term + "%",
        ]).join(",");

        const { data, error: productError } = await supabase
          .from("products")
          .select("id,name,category,description")
          // Legacy production products schema has no moderation_status column.
          // Keep active listings searchable without querying a missing field.
          .eq("status", "active")
          .or(orFilter)
          .limit(10);

        if (productError) {
          // Keep AI answers available even if the optional product lookup fails.
          console.error("Smart Search product lookup failed:", productError.message);
        } else {
          products = data ?? [];
          resultCount = products.length;
        }
      }

      // Use the database's canonical aggregation RPC. Direct inserts used
      // columns that do not exist in search_queries and failed on every search.
      // The RPC also safely aggregates repeated normalized queries.
      if (query.length <= 200) {
        const { error: logError } = await supabase.rpc("track_search", {
          p_query: query,
          p_session_id: null,
        });
        if (logError) console.error("Smart Search query logging failed:", logError.message);
      }
    } catch (error) {
      console.error("Optional Smart Search database work failed:", error);
    }

    return NextResponse.json({
      query,
      normalizedQuery,
      resultCount,
      products,
      zeroResult: resultCount === 0,
      answer: answer.answer.trim() || "আপনার প্রশ্নটি পেয়েছি। আরও নির্দিষ্ট পরামর্শ দিতে ফসলের নাম, এলাকা এবং সমস্যার বিস্তারিত লিখুন।",
      answerSource: answer.source,
      fallbackReason: answer.fallbackReason,
      aiConfigured: answer.source === "gemini" || answer.source === "openai",
      ...analysis,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Smart Search failed:", error);
    return NextResponse.json(
      { error: "Smart Search উত্তর তৈরি করতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

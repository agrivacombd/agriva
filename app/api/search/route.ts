import { NextRequest, NextResponse } from "next/server";
import { detectIntent, normalizeQuery } from "@/lib/ai/intent";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const intent = detectIntent(query);
  const normalizedQuery = normalizeQuery(query);
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json({
    query,
    normalizedQuery,
    intent,
    aiConfigured,
    answer: aiConfigured
      ? "AGRIVA AI is ready to analyze this query."
      : "AGRIVA detected the query intent. Add OPENAI_API_KEY to enable the full AI response layer.",
    opportunity: {
      detected: true,
      type: intent === "product" ? "product" : "article",
      keyword: normalizedQuery,
      status: "new",
    },
  });
}

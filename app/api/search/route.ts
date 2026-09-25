import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const lower = query.toLowerCase();
  const intent = /buy|price|product|fertilizer|medicine|সার|ওষুধ|কিনতে|দাম/.test(lower)
    ? "product"
    : /disease|pest|leaf|spot|রোগ|পোকা|পাতা|দাগ/.test(lower)
      ? "crop_health"
      : "information";

  return NextResponse.json({
    query,
    intent,
    answer: `AGRIVA understood this as a ${intent.replace("_", " ")} request. AI and knowledge-base responses will be connected after the AI credentials are configured.`,
    opportunity: {
      detected: true,
      type: intent === "product" ? "product" : "content",
      query,
    },
  });
}

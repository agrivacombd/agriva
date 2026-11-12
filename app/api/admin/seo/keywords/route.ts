import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { generateSeoText } from "@/lib/seo/ai-provider";

export const runtime = "nodejs";
const intents = ["informational", "commercial", "transactional", "navigational", "local", "tool"] as const;
type Intent = typeof intents[number];
type Suggestion = { keyword: string; intent: Intent; cluster: string; rationale: string };

function isSuggestion(value: unknown): value is Suggestion {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.keyword === "string" && v.keyword.trim().length > 2 && v.keyword.length <= 160
    && typeof v.cluster === "string" && v.cluster.length <= 100
    && typeof v.rationale === "string" && v.rationale.length <= 400
    && intents.includes(v.intent as Intent);
}
export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const body = await request.json().catch(() => null);
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  if (topic.length < 3 || topic.length > 120) {
    return NextResponse.json({ error: "Topic must be 3–120 characters" }, { status: 400 });
  }
  // No SERP scraping or fabricated volume/KD data: these are AI hypotheses for review.
  const prompt = [
    "Generate 8 Bangladesh-specific Bengali long-tail agriculture keyword hypotheses.",
    "Topic: " + JSON.stringify(topic),
    "Return only a JSON array of objects with keys keyword, intent, cluster, rationale.",
    "intent must be one of: " + intents.join(", "),
    "Avoid duplicate intent, invented search volume, keyword difficulty, ranking and competitor facts.",
    "Suggestions are editorial hypotheses, not verified search demand."
  ].join("\n");
  try {
    const generated = await generateSeoText(prompt);
    const raw = generated.text.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\x60\x60\x60$/i, "");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid suggestions response");
    const unique = new Set<string>();
    const suggestions = parsed.filter(isSuggestion).filter(item => {
      const key = item.keyword.trim().toLocaleLowerCase("bn-BD");
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    }).slice(0, 8);
    if (!suggestions.length) throw new Error("No valid keyword suggestions");
    return NextResponse.json({
      topic, suggestions, source: "ai_hypotheses", verifiedSearchVolume: false,
      verifiedKeywordDifficulty: false, provider: generated.provider, model: generated.model,
      requiresHumanReview: true
    });
  } catch {
    return NextResponse.json({ error: "Keyword research is temporarily unavailable; no data was saved." }, { status: 503 });
  }
}

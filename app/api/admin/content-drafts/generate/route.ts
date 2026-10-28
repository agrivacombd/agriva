import { NextRequest, NextResponse } from "next/server";
import { authorizePermission } from "@/lib/auth/server-authorization";

type GeneratedDraft = {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  secondary_keywords: string[];
  outline: Array<Record<string, unknown>>;
  faq: Array<Record<string, unknown>>;
  internal_link_suggestions: string[];
  competitor_analysis: Array<Record<string, unknown>>;
  body_markdown: string;
  intent: string;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown, limit = 30): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean).slice(0, limit);
}

function records(value: unknown, limit = 30): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).slice(0, limit);
}

function fallback(keyword: string, intent: string): GeneratedDraft {
  const title = `${keyword}: Complete Agriculture Guide`;
  return {
    title,
    slug: slugify(title),
    meta_title: title.slice(0, 60),
    meta_description: `A practical, farmer-friendly guide about ${keyword}, including key considerations, steps, FAQs and useful AGRIVA resources.`.slice(0, 320),
    secondary_keywords: [`${keyword} guide`, `${keyword} for farmers`, `how to ${keyword}`],
    outline: [
      { h2: "Introduction", points: [`What ${keyword} means and why it matters`] },
      { h2: "Key considerations", points: ["Important factors farmers should understand"] },
      { h2: "Practical steps", points: ["A clear step-by-step approach"] },
      { h2: "Common mistakes", points: ["Problems to avoid and when to seek expert advice"] },
      { h2: "Conclusion", points: ["Key takeaways for farmers"] },
    ],
    faq: [
      { q: `What is ${keyword}?`, a: "Explain the term in simple, farmer-friendly language." },
      { q: `How should farmers approach ${keyword}?`, a: "Use verified practical guidance and adapt it to local conditions." },
    ],
    internal_link_suggestions: ["/marketplace/buy", "/tools", "/blog"],
    competitor_analysis: [{ note: "Competitor claims must be verified from current public sources before publication." }],
    body_markdown: `# ${title}\n\n## Introduction\n\nThis draft is a structured starting point for **${keyword}**. Verify local recommendations, product labels, regulations and agronomic claims before publication.\n\n## Key considerations\n\nAdd source-backed, location-appropriate guidance here.\n\n## Practical steps\n\n1. Identify the farm context.\n2. Check current agronomic guidance.\n3. Follow product labels and local requirements.\n4. Monitor results and adjust with qualified advice.\n\n## Common mistakes\n\nAvoid unsupported guarantees and one-size-fits-all recommendations.\n\n## Conclusion\n\nSummarize the verified guidance and link readers to relevant AGRIVA resources.`,
    intent,
  };
}

async function aiDraft(keyword: string, intent: string): Promise<Partial<GeneratedDraft> | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const prompt = `Create an SEO article draft for an agriculture marketplace in Bangladesh. Primary keyword: ${keyword}. Search intent: ${intent}. Return ONLY valid JSON with keys title, meta_title, meta_description, secondary_keywords (array of strings), outline (array of objects), faq (array of objects), internal_link_suggestions (array of strings), competitor_analysis (array of objects), body_markdown. Do not invent competitor facts; mark claims that need verification. Keep advice farmer-friendly and avoid unsupported agronomic guarantees.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    const cleaned = text.replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/i, "").trim();
    const parsed: unknown = JSON.parse(cleaned);
    if (!isRecord(parsed) || typeof parsed.title !== "string" || typeof parsed.body_markdown !== "string") return null;

    return {
      title: parsed.title.trim().slice(0, 160),
      meta_title: typeof parsed.meta_title === "string" ? parsed.meta_title.trim().slice(0, 160) : undefined,
      meta_description: typeof parsed.meta_description === "string" ? parsed.meta_description.trim().slice(0, 320) : undefined,
      secondary_keywords: strings(parsed.secondary_keywords),
      outline: records(parsed.outline),
      faq: records(parsed.faq),
      internal_link_suggestions: strings(parsed.internal_link_suggestions),
      competitor_analysis: records(parsed.competitor_analysis),
      body_markdown: parsed.body_markdown.slice(0, 100_000),
      intent,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizePermission("content.draft");
  if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const { supabase, user } = authorization;

  const body = await request.json().catch(() => null);
  const id = typeof body?.opportunityId === "string" ? body.opportunityId.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "A valid opportunityId is required" }, { status: 400 });
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from("content_opportunities")
    .select("id,keyword,intent,opportunity_type,title,slug,status")
    .eq("id", id)
    .maybeSingle();

  if (opportunityError) return NextResponse.json({ error: "Unable to load opportunity" }, { status: 500 });
  if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  if (opportunity.status !== "approved") {
    return NextResponse.json({ error: "Only approved opportunities can be converted to content drafts" }, { status: 409 });
  }

  const aiGenerated = await aiDraft(opportunity.keyword, opportunity.intent);
  const template = fallback(opportunity.keyword, opportunity.intent);
  const generated = { ...template, ...aiGenerated };
  const title = (opportunity.title?.trim() || generated.title || template.title).slice(0, 160);
  const proposedSlug = opportunity.slug?.trim() || slugify(title);
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(proposedSlug) && proposedSlug.length <= 180
    ? proposedSlug
    : slugify(title) || `agri-guide-${opportunity.id.slice(0, 8)}`;

  const { data: draft, error: draftError } = await supabase.rpc("create_generated_content_draft_from_opportunity", {
    p_opportunity_id: opportunity.id,
    p_title: title,
    p_slug: slug,
    p_meta_title: (generated.meta_title || title).slice(0, 160),
    p_meta_description: (generated.meta_description || template.meta_description).slice(0, 320),
    p_secondary_keywords: strings(generated.secondary_keywords),
    p_outline: records(generated.outline),
    p_faq: records(generated.faq),
    p_internal_link_suggestions: strings(generated.internal_link_suggestions),
    p_competitor_analysis: records(generated.competitor_analysis),
    p_body_markdown: typeof generated.body_markdown === "string" ? generated.body_markdown.slice(0, 100_000) : template.body_markdown,
  });

  if (draftError) {
    if (draftError.code === "23505" || draftError.code === "55000") {
      return NextResponse.json({ error: "This opportunity is no longer available for drafting. Reload the queue and check its status." }, { status: 409 });
    }
    console.error("Content draft creation failed", { code: draftError.code || "unknown" });
    return NextResponse.json({ error: "Unable to create content draft" }, { status: draftError.code === "42501" ? 403 : 500 });
  }

  return NextResponse.json({ draft, aiUsed: Boolean(aiGenerated) }, { status: 201 });
}

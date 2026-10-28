import { NextRequest, NextResponse } from "next/server";
import { authorizePermission } from "@/lib/auth/server-authorization";

export async function POST(request: NextRequest) {
  const authorization = await authorizePermission("content.draft");
  if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });

  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  if (keyword.length > 160) return NextResponse.json({ error: "Keyword must be 160 characters or fewer" }, { status: 400 });

  const language = body?.language === "Bengali" ? "Bengali" : "English";
  const brief = {
    title: `Complete guide to ${keyword}`,
    language,
    audience: "Farmers and agriculture learners",
    outline: [
      `What is ${keyword}?`,
      `Common causes and practical considerations`,
      `Step-by-step recommendations`,
      `Prevention and monitoring`,
      `Frequently asked questions`,
    ],
    faq: [
      `What should I know first about ${keyword}?`,
      `What are the common problems related to ${keyword}?`,
      `When should a farmer seek expert help?`,
    ],
    seo: {
      metaTitle: `AGRIVA: ${keyword} guide for farmers`,
      metaDescription: `A practical AGRIVA guide covering ${keyword}, key considerations, and frequently asked questions.`,
      keywords: [keyword, "agriculture", "farming", "AGRIVA"],
    },
  };

  // This endpoint currently builds a deterministic template; an API key alone
  // does not mean that an AI provider was called.
  return NextResponse.json({ brief, generatedWith: "template" });
}

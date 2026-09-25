import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });

  const language = typeof body?.language === "string" ? body.language : "English";
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

  return NextResponse.json({ brief, generatedWith: process.env.OPENAI_API_KEY ? "ai-ready" : "template" });
}

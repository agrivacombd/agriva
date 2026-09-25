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
  const opportunityId = body?.opportunityId || null;
  if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });

  const title = `কৃষকের জন্য ${keyword}: কারণ, করণীয় ও প্রতিরোধের পূর্ণাঙ্গ গাইড`;
  const slug = keyword.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70) || `agriva-${Date.now()}`;
  const content = `## ${title}\n\nএই খসড়াটি AGRIVA user search demand থেকে তৈরি করা হয়েছে। প্রকাশের আগে বিষয়ভিত্তিক তথ্য, স্থানীয় কৃষি-পরামর্শ এবং প্রয়োজনীয় সূত্র যাচাই করুন।\n\n### ${keyword} কী?\n\nএই অংশে বিষয়টির সহজ সংজ্ঞা, কৃষকের জন্য গুরুত্ব এবং প্রাসঙ্গিক প্রেক্ষাপট ব্যাখ্যা করা হবে।\n\n### প্রধান কারণ ও লক্ষণ\n\nকৃষক কী কী লক্ষণ দেখতে পারেন, সম্ভাব্য কারণ কী এবং কোন তথ্য সংগ্রহ করলে সমস্যাটি ভালোভাবে বোঝা যায়—তা এখানে থাকবে।\n\n### করণীয়\n\nধাপে ধাপে বাস্তবসম্মত করণীয়, কখন বিশেষজ্ঞের পরামর্শ নিতে হবে এবং কী কী ভুল এড়িয়ে চলা উচিত তা এখানে থাকবে।\n\n### প্রতিরোধ\n\nআগামী মৌসুমে ঝুঁকি কমাতে ব্যবস্থাপনা, পর্যবেক্ষণ ও ভালো কৃষি-পদ্ধতি আলোচনা করা হবে।\n\n### FAQ\n\nকৃষকের সাধারণ প্রশ্নের সংক্ষিপ্ত উত্তর এখানে যোগ করা হবে।`;

  const { data, error } = await supabase.from("article_drafts").insert({
    opportunity_id: opportunityId,
    keyword,
    search_intent: "informational",
    title,
    slug,
    content,
    meta_title: `${keyword} | কৃষকের জন্য AGRIVA গাইড`,
    meta_description: `${keyword} সম্পর্কে কারণ, লক্ষণ, করণীয় ও প্রতিরোধের ব্যবহারিক AGRIVA গাইড।`,
    primary_keyword: keyword,
    secondary_keywords: ["agriculture", "farmer guide", "কৃষি", "কৃষকের পরামর্শ"],
    faq: [],
    competitor_notes: [],
    ai_model: process.env.OPENAI_API_KEY ? "configured" : "template-fallback",
    status: "draft",
    created_by: user.id,
  }).select("id,title,slug,status").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ article: data });
}

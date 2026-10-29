import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const { supabase, user } = access;

  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  const opportunityId = typeof body?.opportunityId === "string" ? body.opportunityId : null;
  if (!keyword || keyword.length > 160) {
    return NextResponse.json({ error: "A keyword of 1–160 characters is required" }, { status: 400 });
  }

  const title = `কৃষকের জন্য ${keyword}: কারণ, করণীয় ও প্রতিরোধের পূর্ণাঙ্গ গাইড`;
  // Use actual whitespace matching and keep the generated slug URL-safe.
  const slug = keyword.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70) || `agriva-${Date.now()}`;
  const content = `## ${title}

এই খসড়াটি AGRIVA user search demand থেকে তৈরি করা হয়েছে। প্রকাশের আগে বিষয়ভিত্তিক তথ্য, স্থানীয় কৃষি-পরামর্শ এবং প্রয়োজনীয় সূত্র যাচাই করুন।

### ${keyword} কী?

এই অংশে বিষয়টির সহজ সংজ্ঞা, কৃষকের জন্য গুরুত্ব এবং প্রাসঙ্গিক প্রেক্ষাপট ব্যাখ্যা করা হবে।

### প্রধান কারণ ও লক্ষণ

কৃষক কী কী লক্ষণ দেখতে পারেন, সম্ভাব্য কারণ কী এবং কোন তথ্য সংগ্রহ করলে সমস্যাটি ভালোভাবে বোঝা যায়—তা এখানে থাকবে।

### করণীয়

ধাপে ধাপে বাস্তবসম্মত করণীয়, কখন বিশেষজ্ঞের পরামর্শ নিতে হবে এবং কী কী ভুল এড়িয়ে চলা উচিত তা এখানে থাকবে।

### প্রতিরোধ

আগামী মৌসুমে ঝুঁকি কমাতে ব্যবস্থাপনা, পর্যবেক্ষণ ও ভালো কৃষি-পদ্ধতি আলোচনা করা হবে।

### FAQ

কৃষকের সাধারণ প্রশ্নের সংক্ষিপ্ত উত্তর এখানে যোগ করা হবে.`;

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

  if (error) return NextResponse.json({ error: "Unable to create article draft" }, { status: 500 });
  return NextResponse.json({ article: data });
}

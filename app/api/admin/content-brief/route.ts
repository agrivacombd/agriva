import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const audienceLabels: Record<string, string> = {
  farmers: "কৃষক",
  gardeners: "বাগানপ্রেমী",
  "agri-business": "কৃষি উদ্যোক্তা ও ব্যবসায়ী",
  general: "সাধারণ পাঠক",
};
const contentTypeLabels: Record<string, string> = {
  "how-to": "ব্যবহারিক গাইড",
  "problem-solving": "সমস্যা ও সমাধান",
  seasonal: "মৌসুমি গাইড",
  comparison: "তুলনামূলক বিশ্লেষণ",
  business: "কৃষি ব্যবসা",
};
const intentLabels: Record<string, string> = {
  informational: "তথ্য জানতে চায়",
  commercial: "তুলনা / কেনার আগে গবেষণা",
  transactional: "কেনা বা কাজ সম্পন্ন করা",
  local: "স্থানীয় তথ্য বা সেবা",
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 });
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  if (keyword.length > 160) return NextResponse.json({ error: "Keyword must be 160 characters or fewer" }, { status: 400 });

  const language = body?.language === "Bengali" ? "Bengali" : "English";
  const audienceKey = typeof body?.audience === "string" && audienceLabels[body.audience] ? body.audience : "farmers";
  const contentTypeKey = typeof body?.contentType === "string" && contentTypeLabels[body.contentType] ? body.contentType : "how-to";
  const intentKey = typeof body?.intent === "string" && intentLabels[body.intent] ? body.intent : "informational";
  const title = language === "Bengali"
    ? `${keyword} নিয়ে সম্পূর্ণ ব্যবহারিক গাইড`
    : `Complete practical guide to ${keyword}`;
  const outline = contentTypeKey === "problem-solving"
    ? [`${keyword}: লক্ষণ ও প্রাথমিক যাচাই`, "সম্ভাব্য কারণ আলাদা করে বোঝা", "নিরাপদ ও যাচাইকৃত করণীয়", "কখন বিশেষজ্ঞের সাহায্য নেবেন", "প্রতিরোধ ও পরবর্তী পর্যবেক্ষণ"]
    : contentTypeKey === "seasonal"
      ? [`${keyword}: মৌসুম ও অঞ্চলভিত্তিক প্রেক্ষাপট`, "মৌসুম শুরুর প্রস্তুতি", "ধাপে ধাপে কাজের ক্যালেন্ডার", "আবহাওয়া ও ঝুঁকি পর্যবেক্ষণ", "ফসল তোলা ও মৌসুম-শেষের পর্যালোচনা"]
      : contentTypeKey === "comparison"
        ? [`${keyword}: পাঠকের সিদ্ধান্তের প্রেক্ষাপট`, "তুলনার মানদণ্ড", "বিকল্পগুলোর সুবিধা ও সীমাবদ্ধতা", "খরচ, ঝুঁকি ও উপযোগিতা", "কোন পরিস্থিতিতে কোন বিকল্প বিবেচনা করবেন"]
        : contentTypeKey === "business"
          ? [`${keyword}: বাজার ও ব্যবসায়িক প্রেক্ষাপট`, "সম্ভাব্য ক্রেতা ও চাহিদা যাচাই", "খরচ ও পরিচালনাগত বিবেচনা", "ঝুঁকি, সরবরাহ ও মান নিয়ন্ত্রণ", "বাস্তবায়নের আগে যাচাই তালিকা"]
          : [`${keyword} কী এবং কার জন্য প্রাসঙ্গিক?`, "শুরু করার আগে যা জানা দরকার", "ধাপে ধাপে ব্যবহারিক নির্দেশনা", "সাধারণ ভুল ও সেগুলো এড়ানোর উপায়", "ফলাফল পর্যবেক্ষণ ও পরবর্তী পদক্ষেপ"];

  const brief = {
    title,
    language,
    audience: audienceLabels[audienceKey],
    contentType: contentTypeLabels[contentTypeKey],
    searchIntent: intentLabels[intentKey],
    angle: "Answer the reader's main question early, add locally relevant practical detail, and distinguish verified facts from estimates.",
    outline,
    faq: [
      `${keyword} সম্পর্কে প্রথমে কী জানা জরুরি?`,
      `${keyword} নিয়ে কোন সাধারণ ভুল এড়ানো উচিত?`,
      `${keyword} সম্পর্কে তথ্য যাচাই করার নির্ভরযোগ্য উপায় কী?`,
    ],
    researchChecklist: [
      "প্রতিটি গুরুত্বপূর্ণ কৃষি-সংক্রান্ত দাবি সরকারি, বিশ্ববিদ্যালয় বা গবেষণা-ভিত্তিক সূত্র দিয়ে যাচাই করুন।",
      "বাংলাদেশের জেলা, মৌসুম ও ফসলের জাত অনুযায়ী তথ্য প্রযোজ্য কি না নিশ্চিত করুন।",
      "সূত্রের URL, প্রকাশের তারিখ এবং তথ্য যাচাইয়ের তারিখ সংরক্ষণ করুন।",
      "সার বা কীটনাশকের মাত্রা অনুমান করে লিখবেন না; প্রামাণিক নির্দেশনা ও নিরাপত্তা সতর্কতা যাচাই করুন।",
      "একই search intent-এর বিদ্যমান AGRIVA article থাকলে duplicate না করে সেটি উন্নত করুন।",
      "শিরোনাম ও meta description যেন আর্টিকেলের প্রকৃত বিষয়বস্তুর সঙ্গে মেলে।",
    ],
    seo: {
      metaTitle: language === "Bengali" ? `${keyword}: ব্যবহারিক গাইড | AGRIVA` : `${keyword}: Practical Guide | AGRIVA`,
      metaDescription: language === "Bengali"
        ? `${keyword} সম্পর্কে ব্যবহারিক নির্দেশনা, গুরুত্বপূর্ণ বিবেচনা এবং যাচাই করার বিষয়গুলো নিয়ে AGRIVA-এর গাইড।`
        : `A practical AGRIVA guide to ${keyword}, key considerations, and questions to verify before taking action.`,
      keywords: [keyword, "agriculture", "farming", "AGRIVA"],
    },
  };

  // This is an editorial template, not a live AI generation, keyword-volume lookup,
  // Google Search Console sync, or factual research service.
  return NextResponse.json({ brief, generatedWith: "template", dataSources: [] });
}

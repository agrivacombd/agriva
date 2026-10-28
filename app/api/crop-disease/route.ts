import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readRequestBytesWithLimit } from "@/lib/http/read-limited-request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Allow multipart headers/fields while enforcing the actual streamed request size.
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type Diagnosis = {
  crop: string;
  disease: string;
  confidence: "low" | "medium" | "high";
  confidenceNote: string;
  symptoms: string[];
  possibleCauses: string[];
  immediateActions: string[];
  prevention: string[];
  whenToSeekHelp: string;
  disclaimer: string;
};

function isValidImageSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

function cleanDiagnosis(raw: unknown, cropFallback: string): Diagnosis {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const stringValue = (key: string, fallback: string) =>
    typeof value[key] === "string" && (value[key] as string).trim()
      ? (value[key] as string).trim().slice(0, 1200)
      : fallback;
  const stringList = (key: string) => Array.isArray(value[key])
    ? (value[key] as unknown[]).filter((item): item is string => typeof item === "string")
      .map((item) => item.trim()).filter(Boolean).slice(0, 6).map((item) => item.slice(0, 300))
    : [];
  const confidence = value.confidence === "high" || value.confidence === "medium" ? value.confidence : "low";
  return {
    crop: stringValue("crop", cropFallback),
    disease: stringValue("disease", "ছবি থেকে নির্দিষ্ট রোগ নিশ্চিত করা যায়নি"),
    confidence,
    confidenceNote: stringValue("confidenceNote", "ছবির ভিত্তিতে অনুমান; নিশ্চিত রোগ নির্ণয় নয়।"),
    symptoms: stringList("symptoms"),
    possibleCauses: stringList("possibleCauses"),
    immediateActions: stringList("immediateActions"),
    prevention: stringList("prevention"),
    whenToSeekHelp: stringValue("whenToSeekHelp", "লক্ষণ ছড়ালে বা ফসলের ক্ষতি বাড়লে স্থানীয় কৃষি কর্মকর্তার সাহায্য নিন।"),
    disclaimer: "এটি AI-ভিত্তিক প্রাথমিক ধারণা, নিশ্চিত রোগ নির্ণয় নয়।",
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "আগে AGRIVA-তে লগইন করুন।" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("crop_disease_detections")
      .select("id,crop,location,symptoms,diagnosis,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Crop diagnosis history query failed:", error.message);
      return NextResponse.json({ error: "ইতিহাস লোড করা যায়নি। ডেটাবেস migration প্রয়োগ হয়েছে কি না দেখুন।" }, { status: 503 });
    }
    return NextResponse.json({ history: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Crop diagnosis history failed:", error);
    return NextResponse.json({ error: "ইতিহাস লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
  let uploadedPath: string | null = null;

  try {
    supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "ছবি বিশ্লেষণ করতে আগে লগইন করুন।" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: "ছবি বিশ্লেষণ এখনো চালু হয়নি: সার্ভারে GEMINI_API_KEY সেট করতে হবে। কোনো ছবি সংরক্ষণ করা হয়নি।",
        code: "AI_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
      const declaredBytes = Number(contentLength);
      if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0 || declaredBytes > MAX_REQUEST_BYTES) {
        return NextResponse.json(
          { error: "আপলোডের মোট আকার সীমার বেশি। ৫ MB-এর মধ্যে একটি ছবি ও প্রয়োজনীয় তথ্য দিন।" },
          { status: 413 },
        );
      }
    }

    const boundedBody = await readRequestBytesWithLimit(request, MAX_REQUEST_BYTES);
    if (!boundedBody.ok) {
      return NextResponse.json(
        { error: "আপলোডের মোট আকার সীমার বেশি। ৫ MB-এর মধ্যে একটি ছবি ও প্রয়োজনীয় তথ্য দিন।" },
        { status: 413 },
      );
    }
    const form = await new Response(boundedBody.bytes, { headers: request.headers }).formData();
    const file = form.get("photo");
    const crop = typeof form.get("crop") === "string" ? String(form.get("crop")).trim().slice(0, 80) : "";
    const location = typeof form.get("location") === "string" ? String(form.get("location")).trim().slice(0, 120) : "";
    const symptoms = typeof form.get("symptoms") === "string" ? String(form.get("symptoms")).trim().slice(0, 1000) : "";

    if (!(file instanceof File)) return NextResponse.json({ error: "একটি ফসলের ছবি আপলোড করুন।" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json({ error: "শুধু JPG, PNG বা WebP ছবি গ্রহণ করা হয়।" }, { status: 415 });
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "ছবির আকার ৫ MB-এর মধ্যে রাখুন।" }, { status: 413 });
    }
    if (!crop) return NextResponse.json({ error: "ফসলের নাম নির্বাচন করুন।" }, { status: 400 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isValidImageSignature(bytes, file.type)) {
      return NextResponse.json({ error: "ছবির ফাইলটি সঠিক নয়। নতুন ছবি নির্বাচন করুন।" }, { status: 400 });
    }

    const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
    const prompt = [
      "You are a cautious agricultural triage assistant for farmers in Bangladesh. Analyze this crop photo and respond in Bengali.",
      "Do not claim certainty from a photo. If the image is unclear, disease is not visible, or the image is not a crop, say so.",
      "Do not prescribe pesticide brands, exact chemical doses, or unsafe mixtures. Prefer non-chemical IPM steps and recommend local agricultural officers for confirmation.",
      "Crop supplied by user: " + crop,
      "Location supplied by user: " + (location || "not supplied"),
      "Additional symptoms supplied by user: " + (symptoms || "not supplied"),
      "Return only valid JSON with keys crop, disease, confidence (low|medium|high), confidenceNote, symptoms (string array), possibleCauses (string array), immediateActions (string array), prevention (string array), whenToSeekHelp, disclaimer.",
      "Keep each list to at most 5 practical, cautious points. If uncertain, set confidence to low.",
    ].join("\n");

    const modelResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(process.env.GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: file.type, data: Buffer.from(bytes).toString("base64") } },
          ] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      },
    );

    if (!modelResponse.ok) {
      const errorBody = await modelResponse.text().catch(() => "");
      console.error("Gemini crop image analysis failed:", modelResponse.status, errorBody.slice(0, 500));
      return NextResponse.json({
        error: "AI ছবি বিশ্লেষণ সেবা উত্তর দেয়নি। API key, model access ও provider quota পরীক্ষা করে আবার চেষ্টা করুন।",
        code: "AI_PROVIDER_ERROR",
      }, { status: 502 });
    }

    const modelData = await modelResponse.json();
    const rawText = modelData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (!rawText) {
      return NextResponse.json({ error: "AI থেকে ব্যবহারযোগ্য বিশ্লেষণ পাওয়া যায়নি। অন্য পরিষ্কার ছবি দিয়ে চেষ্টা করুন।" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Gemini returned invalid diagnosis JSON");
      return NextResponse.json({ error: "AI উত্তরটি পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" }, { status: 502 });
    }
    const diagnosis = cleanDiagnosis(parsed, crop);

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    uploadedPath = user.id + "/" + crypto.randomUUID() + "." + extension;
    const { error: uploadError } = await supabase.storage
      .from("crop-disease-photos")
      .upload(uploadedPath, Buffer.from(bytes), { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Crop photo storage failed:", uploadError.message);
      return NextResponse.json({ error: "বিশ্লেষণ হয়েছে, কিন্তু ব্যক্তিগত ছবির স্টোরেজে সংরক্ষণ হয়নি। migration ও Storage policy পরীক্ষা করুন।" }, { status: 503 });
    }

    const { data: saved, error: saveError } = await supabase
      .from("crop_disease_detections")
      .insert({
        user_id: user.id,
        image_path: uploadedPath,
        mime_type: file.type,
        crop,
        location: location || null,
        symptoms: symptoms || null,
        status: "completed",
        diagnosis,
      })
      .select("id,crop,location,symptoms,diagnosis,created_at")
      .single();

    if (saveError || !saved) {
      await supabase.storage.from("crop-disease-photos").remove([uploadedPath]);
      uploadedPath = null;
      console.error("Crop diagnosis database save failed:", saveError?.message);
      return NextResponse.json({ error: "বিশ্লেষণ হয়েছে, কিন্তু ইতিহাসে সংরক্ষণ হয়নি। migration প্রয়োগ হয়েছে কি না পরীক্ষা করুন।" }, { status: 503 });
    }

    return NextResponse.json({ result: saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Crop disease diagnosis failed:", error);
    return NextResponse.json({
      error: error instanceof Error && error.name === "TimeoutError"
        ? "ছবি বিশ্লেষণে সময় বেশি লাগছে। ছোট ছবি দিয়ে আবার চেষ্টা করুন।"
        : "ছবি বিশ্লেষণ করা যায়নি। সংযোগ ও সার্ভার কনফিগারেশন পরীক্ষা করুন।",
    }, { status: 500 });
  }
}

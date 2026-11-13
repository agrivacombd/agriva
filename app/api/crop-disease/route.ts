import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type Diagnosis = {
  crop: string;
  disease: string;
  confidence: "low" | "medium" | "high";
  confidenceNote: string;
  imageQuality: "good" | "limited" | "unusable";
  imageQualityNote: string;
  alternativeDiagnoses: string[];
  followUpQuestions: string[];
  needsMorePhotos: boolean;
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
    imageQuality: value.imageQuality === "good" || value.imageQuality === "limited" ? value.imageQuality : "unusable",
    imageQualityNote: stringValue("imageQualityNote", "ছবির স্পষ্টতা ও লক্ষণ যাচাই করুন।"),
    alternativeDiagnoses: stringList("alternativeDiagnoses"),
    followUpQuestions: stringList("followUpQuestions"),
    needsMorePhotos: value.needsMorePhotos !== false,
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
  const uploadedPaths: string[] = [];

  try {
    supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "ছবি বিশ্লেষণ করতে আগে লগইন করুন।" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "ছবি বিশ্লেষণ এখনো চালু হয়নি: সার্ভারে OPENAI_API_KEY সেট করতে হবে। কোনো ছবি সংরক্ষণ করা হয়নি।",
        code: "AI_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const form = await request.formData();
    const photos = form.getAll("photo");
    const crop = typeof form.get("crop") === "string" ? String(form.get("crop")).trim().slice(0, 80) : "";
    const location = typeof form.get("location") === "string" ? String(form.get("location")).trim().slice(0, 120) : "";
    const symptoms = typeof form.get("symptoms") === "string" ? String(form.get("symptoms")).trim().slice(0, 1000) : "";

    if (photos.length < 1 || photos.length > 4 || photos.some((item) => !(item instanceof File))) {
      return NextResponse.json({ error: "একসঙ্গে ১ থেকে ৪টি ফসলের ছবি নির্বাচন করুন।" }, { status: 400 });
    }
    if (!crop) return NextResponse.json({ error: "ফসলের নাম নির্বাচন করুন।" }, { status: 400 });
    const files = photos as File[];
    const imageInputs: { type: "image_url"; image_url: { url: string; detail: "high" } }[] = [];
    const imageBuffers: { bytes: Buffer; mime: string }[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
        return NextResponse.json({ error: "শুধু JPG, PNG বা WebP ছবি গ্রহণ করা হয়।" }, { status: 415 });
      }
      if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "প্রতিটি ছবির আকার ৫ MB-এর মধ্যে রাখুন।" }, { status: 413 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!isValidImageSignature(bytes, file.type)) {
        return NextResponse.json({ error: "একটি ছবির ফাইল সঠিক নয়। নতুন ছবি নির্বাচন করুন।" }, { status: 400 });
      }
      imageBuffers.push({ bytes, mime: file.type });
      imageInputs.push({ type: "image_url", image_url: { url: "data:" + file.type + ";base64," + bytes.toString("base64"), detail: "high" } });
    }

    const model = (process.env.OPENAI_CROP_DISEASE_MODEL || "gpt-4.1-mini").trim();
    const prompt = [
      "You are AGRIVA's cautious crop-health visual triage assistant for Bangladesh. Answer in clear Bengali.",
      "Analyze ALL supplied photos together as different views of the SAME crop problem. Cross-check close-ups, whole-plant and leaf/panicle views, identify contradictory clues, and do not treat different photos as separate diagnoses.",
      "Analyze the ACTUAL visual evidence: plant part, lesion shape, margin, color, distribution, wilting, insect signs and context. Report only genuinely visible findings. Never invent signs.",
      "Assess imageQuality as good, limited, or unusable first. For blurry, distant, wrong-subject or unclear images do NOT guess a disease. Ask for close-up and whole-plant images.",
      "Treat selected crop, district and user symptoms as hints, not proof. Explicitly note mismatches between image and selected crop.",
      "Consider differential diagnoses including fungal, bacterial, viral, pest, nutrient and abiotic injury ONLY where visual signs support them. Avoid generic unrelated lists.",
      "Calibrate confidence: high only for strongly distinctive visual signs; medium for overlapping signs; low for weak or incomplete evidence. High never means laboratory confirmation.",
      "Never automatically call brown lesions leaf spot. In rice, distinguish panicle versus leaf and consider blast, brown spot, bacterial blight, sheath blight, insects and abiotic stress only if characteristic features fit.",
      "If image evidence is insufficient, set disease to 'রোগ নির্দিষ্টভাবে শনাক্ত করা যায়নি', confidence low, needsMorePhotos true, and ask targeted follow-up questions.",
      "Avoid chemical recommendations, pesticide brands, dosages and unsafe mixtures. Give safe practical IPM and refer to local agricultural extension for confirmation.",
      "Crop selected: " + crop,
      "District: " + (location || "not supplied"),
      "User symptoms: " + (symptoms || "not supplied"),
      "Return valid JSON only with crop, disease, confidence (low|medium|high), confidenceNote, imageQuality (good|limited|unusable), imageQualityNote, alternativeDiagnoses (array), followUpQuestions (array), needsMorePhotos (boolean), symptoms (visible-only array), possibleCauses (array), immediateActions (array), prevention (array), whenToSeekHelp, disclaimer.",
      "Limit lists to five concise, crop-specific items. Do not invent unseen symptoms.",
    ].join("\n");

    const modelResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageInputs,
          ],
        }],
      }),
    });

    if (!modelResponse.ok) {
      const errorBody = await modelResponse.text().catch(() => "");
      console.error("OpenAI crop image analysis failed:", modelResponse.status, errorBody.slice(0, 500));
      return NextResponse.json({
        error: "AI ছবি বিশ্লেষণ সেবা উত্তর দেয়নি। API key, model access ও provider quota পরীক্ষা করে আবার চেষ্টা করুন।",
        code: "AI_PROVIDER_ERROR",
      }, { status: 502 });
    }

    const modelData = await modelResponse.json();
    const rawText = modelData?.choices?.[0]?.message?.content?.trim();
    if (!rawText) {
      return NextResponse.json({ error: "AI থেকে ব্যবহারযোগ্য বিশ্লেষণ পাওয়া যায়নি। অন্য পরিষ্কার ছবি দিয়ে চেষ্টা করুন।" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("OpenAI returned invalid diagnosis JSON");
      return NextResponse.json({ error: "AI উত্তরটি পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" }, { status: 502 });
    }
    const diagnosis = cleanDiagnosis(parsed, crop);
    if (diagnosis.imageQuality === "unusable") {
      diagnosis.confidence = "low";
      diagnosis.disease = "ছবি থেকে রোগ নির্দিষ্টভাবে শনাক্ত করা যায়নি";
      diagnosis.needsMorePhotos = true;
    }
    if (diagnosis.imageQuality === "limited" && diagnosis.confidence === "high") diagnosis.confidence = "medium";
    if (diagnosis.confidence === "low" && !diagnosis.followUpQuestions.length) diagnosis.followUpQuestions = ["আক্রান্ত অংশের কাছ থেকে পরিষ্কার ছবি দিতে পারবেন?", "সমস্যাটি কতদিন ধরে দেখা যাচ্ছে এবং কতগুলো গাছে ছড়িয়েছে?"];

    for (const image of imageBuffers) {
      const extension = image.mime === "image/jpeg" ? "jpg" : image.mime === "image/png" ? "png" : "webp";
      const path = user.id + "/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await supabase.storage
        .from("crop-disease-photos")
        .upload(path, image.bytes, { contentType: image.mime, upsert: false });
      if (uploadError) {
        if (uploadedPaths.length) await supabase.storage.from("crop-disease-photos").remove(uploadedPaths);
        console.error("Crop photo storage failed:", uploadError.message);
        return NextResponse.json({ error: "ছবি ব্যক্তিগত স্টোরেজে সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" }, { status: 503 });
      }
      uploadedPaths.push(path);
    }

    const { data: saved, error: saveError } = await supabase
      .from("crop_disease_detections")
      .insert({
        user_id: user.id,
        image_path: uploadedPaths[0],
        mime_type: imageBuffers[0].mime,
        crop,
        location: location || null,
        symptoms: symptoms || null,
        status: "completed",
        diagnosis: { ...diagnosis, imagePaths: uploadedPaths },
      })
      .select("id,crop,location,symptoms,diagnosis,created_at")
      .single();

    if (saveError || !saved) {
      await supabase.storage.from("crop-disease-photos").remove(uploadedPaths);
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

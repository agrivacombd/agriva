import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("crop_health_feed")
    .select("id,display_name,crop,district,disease,confidence,image_path,published_at")
    .order("published_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: "ফিড লোড করা যায়নি।" }, { status: 503 });
  const { data: { publicUrl } } = supabase.storage.from("crop-health-feed").getPublicUrl("placeholder");
  const prefix = publicUrl.slice(0, publicUrl.lastIndexOf("/") + 1);
  return NextResponse.json({ feed: (data || []).map((item) => ({
    id: item.id, displayName: item.display_name, crop: item.crop, district: item.district,
    disease: item.disease, confidence: item.confidence, publishedAt: item.published_at,
    imageUrl: item.image_path ? prefix + item.image_path.split("/").map(encodeURIComponent).join("/") : null,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.consent !== true || typeof body?.detectionId !== "string" || typeof body?.displayName !== "string") {
    return NextResponse.json({ error: "প্রকাশের জন্য স্পষ্ট সম্মতি, নাম ও বিশ্লেষণ নির্বাচন করুন।" }, { status: 400 });
  }
  const displayName = body.displayName.trim();
  if (displayName.length < 2 || displayName.length > 60) return NextResponse.json({ error: "নাম ২–৬০ অক্ষরের হতে হবে।" }, { status: 400 });
  const { data: detection, error: lookupError } = await supabase.from("crop_disease_detections")
    .select("id,image_path,mime_type,status").eq("id", body.detectionId).eq("user_id", user.id).single();
  if (lookupError || !detection || detection.status !== "completed") return NextResponse.json({ error: "নিজের সম্পন্ন বিশ্লেষণ নির্বাচন করুন।" }, { status: 404 });
  const { data: published, error: insertError } = await supabase.from("crop_health_feed")
    .insert({ detection_id: detection.id, user_id: user.id, display_name: displayName, crop: "", disease: "", confidence: "low" })
    .select("id,image_path").single();
  if (insertError || !published) return NextResponse.json({ error: "প্রকাশ করা যায়নি। আগে প্রকাশিত হয়ে থাকলে ফিড দেখুন।" }, { status: 409 });
  const { data: original, error: downloadError } = await supabase.storage.from("crop-disease-photos").download(detection.image_path);
  if (downloadError || !original) {
    await supabase.from("crop_health_feed").delete().eq("id", published.id).eq("user_id", user.id);
    return NextResponse.json({ error: "মূল ছবি পাওয়া যায়নি। কিছু প্রকাশ করা হয়নি।" }, { status: 503 });
  }
  const { error: uploadError } = await supabase.storage.from("crop-health-feed")
    .upload(published.image_path, original, { contentType: detection.mime_type, upsert: false });
  if (uploadError) {
    await supabase.from("crop_health_feed").delete().eq("id", published.id).eq("user_id", user.id);
    return NextResponse.json({ error: "অনুমোদিত ছবি প্রকাশ করা যায়নি। আবার চেষ্টা করুন।" }, { status: 503 });
  }
  return NextResponse.json({ published: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.detectionId !== "string") return NextResponse.json({ error: "বিশ্লেষণ নির্বাচন করুন।" }, { status: 400 });
  const { data: row, error } = await supabase.from("crop_health_feed").select("id,image_path")
    .eq("detection_id", body.detectionId).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "প্রকাশনার অবস্থা যাচাই করা যায়নি।" }, { status: 503 });
  if (!row) return NextResponse.json({ unpublished: true });
  // Remove the public image before revoking the feed entry, so failed removal can be retried.
  if (row.image_path) {
    const { error: removeError } = await supabase.storage.from("crop-health-feed").remove([row.image_path]);
    if (removeError) return NextResponse.json({ error: "পাবলিক ছবি সরানো যায়নি। আবার চেষ্টা করুন।" }, { status: 503 });
  }
  const { error: deleteError } = await supabase.from("crop_health_feed").delete().eq("id", row.id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "ফিড থেকে সরানো যায়নি। আবার চেষ্টা করুন।" }, { status: 503 });
  return NextResponse.json({ unpublished: true });
}

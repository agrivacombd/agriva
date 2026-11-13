import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("crop_health_feed")
    .select("id,slug,display_name,crop,district,disease,confidence,image_path,published_at")
    .order("published_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: "ফিড লোড করা যায়নি।" }, { status: 503 });
  const { data: { publicUrl } } = supabase.storage.from("crop-health-feed").getPublicUrl("placeholder");
  const prefix = publicUrl.slice(0, publicUrl.lastIndexOf("/") + 1);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: ownRows } = user ? await supabase.from("crop_health_feed").select("detection_id").eq("user_id", user.id) : { data: [] };
  return NextResponse.json({ ownPublishedDetectionIds: (ownRows || []).map(row => row.detection_id), feed: (data || []).map((item) => ({
    id: item.id, slug: item.slug, displayName: item.display_name, crop: item.crop, district: item.district,
    disease: item.disease, confidence: item.confidence, publishedAt: item.published_at,
    imageUrl: item.image_path ? prefix + item.image_path.split("/").map(encodeURIComponent).join("/") : null,
  })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.consent !== true || typeof body?.detectionId !== "string") {
    return NextResponse.json({ error: "প্রকাশের জন্য স্পষ্ট সম্মতি ও বিশ্লেষণ নির্বাচন করুন।" }, { status: 400 });
  }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  if (profileError) return NextResponse.json({ error: "অ্যাকাউন্টের নাম যাচাই করা যায়নি।" }, { status: 503 });
  const displayName = profile?.full_name?.trim() || "";
  if (displayName.length < 2 || displayName.length > 60) return NextResponse.json({ error: "আপনার প্রোফাইলে ২–৬০ অক্ষরের নাম সেট করুন।" }, { status: 400 });
  const { data: detection, error: lookupError } = await supabase.from("crop_disease_detections")
    .select("id,image_path,mime_type,status").eq("id", body.detectionId).eq("user_id", user.id).single();
  if (lookupError || !detection || detection.status !== "completed") return NextResponse.json({ error: "নিজের সম্পন্ন বিশ্লেষণ নির্বাচন করুন।" }, { status: 404 });
  // Retry rare short-suffix collisions with a fresh UUID. The database registry
  // permanently reserves previously issued slugs, including unpublished ones.
  let published: { id: string; image_path: string; slug: string } | null = null;
  let insertError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await supabase.from("crop_health_feed")
      .insert({ id: crypto.randomUUID(), detection_id: detection.id, user_id: user.id, display_name: displayName, crop: "", disease: "", confidence: "low" })
      .select("id,image_path,slug").single();
    if (!result.error && result.data) { published = result.data; break; }
    insertError = result.error;
    if (result.error?.code !== "23505" || !/slug|registry/i.test(result.error.message || "")) break;
  }
  if (!published) return NextResponse.json({ error: insertError?.code === "23505" ? "এই বিশ্লেষণ আগে প্রকাশিত হয়েছে অথবা ইউনিক লিংক তৈরি করা যায়নি।" : "প্রকাশ করা যায়নি। আবার চেষ্টা করুন।" }, { status: insertError?.code === "23505" ? 409 : 503 });
  const { data: original, error: downloadError } = await supabase.storage.from("crop-disease-photos").download(detection.image_path);
  if (downloadError || !original) {
    await supabase.from("crop_health_feed").delete().eq("id", published.id).eq("user_id", user.id);
    return NextResponse.json({ error: "মূল ছবি পাওয়া যায়নি। কিছু প্রকাশ করা হয়নি।" }, { status: 503 });
  }
  // Re-encode consented photos to strip EXIF/GPS and embedded metadata.
  // Do not copy private originals byte-for-byte to public storage.
  let safePhoto: Buffer;
  try {
    const processor = sharp(Buffer.from(await original.arrayBuffer()), { limitInputPixels: 25000000 }).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true });
    safePhoto = detection.mime_type === "image/png"
      ? await processor.png().toBuffer()
      : detection.mime_type === "image/webp"
        ? await processor.webp({ quality: 85 }).toBuffer()
        : await processor.jpeg({ quality: 85 }).toBuffer();
  } catch {
    await supabase.from("crop_health_feed").delete().eq("id", published.id).eq("user_id", user.id);
    return NextResponse.json({ error: "ছবির ব্যক্তিগত মেটাডেটা নিরাপদে সরানো যায়নি। প্রকাশ বাতিল হয়েছে।" }, { status: 422 });
  }
  const { error: uploadError } = await supabase.storage.from("crop-health-feed")
    .upload(published.image_path, safePhoto, { contentType: detection.mime_type, upsert: false });
  if (uploadError) {
    await supabase.from("crop_health_feed").delete().eq("id", published.id).eq("user_id", user.id);
    return NextResponse.json({ error: "অনুমোদিত ছবি প্রকাশ করা যায়নি। আবার চেষ্টা করুন।" }, { status: 503 });
  }
  return NextResponse.json({ published: true, slug: published.slug }, { status: 201 });
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

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "একটি ছবি নির্বাচন করুন" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "JPG, PNG বা WebP ছবি দিন (সর্বোচ্চ ৫ MB)" }, { status: 400 });
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type, cacheControl: "3600", upsert: false,
  });
  if (error) return NextResponse.json({ error: "ছবি আপলোড হয়নি। Storage migration ও permissions যাচাই করুন।" }, { status: 500 });
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ imageUrl: data.publicUrl }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import sharp from "sharp";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Choose an image under 10 MB" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(buffer, { limitInputPixels: 40000000 }).metadata();
  } catch {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 630
      || !["jpeg", "png", "webp"].includes(metadata.format || "")) {
    return NextResponse.json({ error: "JPEG, PNG or WebP image at least 1200×630 required" }, { status: 400 });
  }
  const ext = metadata.format === "jpeg" ? "jpg" : metadata.format;
  const mime = metadata.format === "jpeg" ? "image/jpeg" : `image/${ext}`;
  const path = `${access.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await access.supabase.storage.from("article-hero-images")
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) return NextResponse.json({ error: "Image upload unavailable. Check storage migration." }, { status: 503 });
  const { data } = access.supabase.storage.from("article-hero-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, width: metadata.width, height: metadata.height });
}

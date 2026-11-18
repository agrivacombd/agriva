import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminApi } from "@/lib/admin/authz";

export const runtime = "nodejs";
const MAX_BYTES = 6 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const form = await request.formData().catch(() => null);
  const id = form?.get("id");
  const alt = form?.get("alt");
  const file = form?.get("file");
  const rights = form?.get("rights");
  if (typeof id !== "string" || !UUID.test(id) || typeof alt !== "string" || alt.trim().length < 5 || alt.length > 250 ||
      rights !== "confirmed" || !(file instanceof File) || !allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Choose a JPEG, PNG or WebP photo, add descriptive alt text and confirm usage rights." }, { status: 400 });
  }
  if (file.size < 100 || file.size > MAX_BYTES) return NextResponse.json({ error: "Image size must be under 6 MB." }, { status: 413 });
  const { supabase } = access;
  const { data: draft, error: lookupError } = await supabase.from("content_drafts")
    .select("id,status,editorial_version,content_type,body_markdown,hero_image_url").eq("id", id).is("deleted_at",null).maybeSingle();
  if (lookupError || !draft || draft.content_type !== "article") return NextResponse.json({ error: "Article not found." }, { status: 404 });
  if (draft.status === "published") return NextResponse.json({ error: "Unpublish & Edit before replacing the image." }, { status: 409 });
  let hero: Buffer, social: Buffer;
  let heroWidth: number, heroHeight: number;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const img = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).rotate();
    const metadata = await img.metadata();
    if (!["jpeg","png","webp"].includes(metadata.format || "")) throw new Error("format");
    const heroOutput = await img.clone().resize({width:1536,height:1024,fit:"inside",withoutEnlargement:true}).webp({quality:84}).toBuffer({resolveWithObject:true});
    hero = heroOutput.data;
    heroWidth = heroOutput.info.width;
    heroHeight = heroOutput.info.height;
    social = await img.clone().resize(1200,630,{ fit:"contain", background:"#ffffff" }).flatten({background:"#ffffff"}).webp({quality:82}).toBuffer();
  } catch {
    return NextResponse.json({ error: "Image processing failed. Upload a valid JPEG, PNG or WebP photo." }, { status: 400 });
  }
  const folder = "drafts/" + id + "/" + crypto.randomUUID();
  const path = folder + ".webp", socialPath = folder + "-social.webp";
  const storage = supabase.storage.from("article-hero-images");
  const uploaded = await storage.upload(path, hero, {contentType:"image/webp",cacheControl:"3600",upsert:false});
  if (uploaded.error) return NextResponse.json({ error: "Image storage upload failed." }, {status:500});
  const shared = await storage.upload(socialPath,social,{contentType:"image/webp",cacheControl:"3600",upsert:false});
  if (shared.error) {
    await storage.remove([path]);
    return NextResponse.json({ error: "Social image upload failed." }, {status:500});
  }
  const url = storage.getPublicUrl(path).data.publicUrl;
  // Persist the same image in the hero field and once in the article body.
  // Remove an older hero image Markdown line before replacing it.
  const oldBody = draft.body_markdown || "";
  const oldHero = draft.hero_image_url || "";
  const cleaned = oldHero ? oldBody.split("\n").filter((line: string) => !line.includes("](" + oldHero + ")")).join("\n") : oldBody;
  const inlineImage = "\n\n![" + alt.trim().replaceAll("[","").replaceAll("]","") + "](" + url + ")\n\n";
  const bodyMarkdown = cleaned.trimEnd() + inlineImage;
  if (bodyMarkdown.length > 50000) {
    await storage.remove([path,socialPath]);
    return NextResponse.json({error:"Article body is too long to insert this image."},{status:413});
  }
  const saved = await supabase.from("content_drafts").update({
    body_markdown: bodyMarkdown,
    hero_image_url:url,hero_image_alt:alt.trim(),
    hero_image_width:heroWidth,hero_image_height:heroHeight,
    hero_image_license:"Admin-uploaded",
    hero_image_rights_note:"Uploader confirmed rights to use this image.",
    hero_image_verified_by:null,hero_image_verified_at:null,
    ...(draft.status === "approved" ? {status:"review",reviewed_at:null}:{})
  }).eq("id",id).eq("status",draft.status).eq("editorial_version",draft.editorial_version)
    .is("deleted_at",null).select("id,status,hero_image_url,hero_image_alt,body_markdown").maybeSingle();
  if (saved.error || !saved.data) {
    await storage.remove([path,socialPath]);
    return NextResponse.json({ error: "Article changed while uploading. Reload and retry." }, {status:409});
  }
  return NextResponse.json({ok:true,url,alt:saved.data.hero_image_alt,status:saved.data.status,body_markdown:saved.data.body_markdown});
}

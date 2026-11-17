import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminApi } from "@/lib/admin/authz";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const form = await request.formData().catch(() => null);
  const id = form?.get("id");
  const file = form?.get("file");
  const alt = form?.get("alt");
  const rights = form?.get("rights");
  if (typeof id !== "string" || !uuid.test(id) || !(file instanceof File) ||
      !allowed.has(file.type) || typeof alt !== "string" ||
      alt.trim().length < 5 || alt.trim().length > 250 || rights !== "confirmed") {
    return NextResponse.json({ error: "Valid article, JPEG/PNG/WebP photo, alt text and rights confirmation required." }, {status:400});
  }
  if (file.size < 100 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({error:"Image must be smaller than 6 MB."},{status:413});
  }
  const {supabase} = access;
  const {data:draft,error:lookupError} = await supabase.from("content_drafts")
    .select("id,status,content_type").eq("id",id).is("deleted_at",null).maybeSingle();
  if (lookupError || !draft || draft.content_type !== "article") {
    return NextResponse.json({error:"Article not found."},{status:404});
  }
  if (draft.status === "published") {
    return NextResponse.json({error:"Unpublish & Edit before adding photos to the article."},{status:409});
  }
  let webp:Buffer;
  try {
    const bytes=Buffer.from(await file.arrayBuffer());
    const source=sharp(bytes,{limitInputPixels:40_000_000,failOn:"error"}).rotate();
    const metadata=await source.metadata();
    if (!["jpeg","png","webp"].includes(metadata.format||"")) throw new Error("Invalid image");
    webp=await source.resize({width:1536,height:1024,fit:"inside",withoutEnlargement:true})
      .webp({quality:83,effort:4}).toBuffer();
  } catch {
    return NextResponse.json({error:"Could not read this image. Use a valid JPEG, PNG, or WebP file."},{status:400});
  }
  const path="drafts/"+id+"/inline/"+crypto.randomUUID()+".webp";
  const storage=supabase.storage.from("article-hero-images");
  const {error:uploadError}=await storage.upload(path,webp,{contentType:"image/webp",cacheControl:"3600",upsert:false});
  if(uploadError) {
    return NextResponse.json({error:"Could not upload image to Storage."},{status:500});
  }
  const {data} = storage.getPublicUrl(path);
  return NextResponse.json({ok:true,url:data.publicUrl,alt:alt.trim()},{headers:{"Cache-Control":"no-store"}});
}

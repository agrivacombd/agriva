import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin/authz";

export async function PATCH(request: NextRequest) {
  const access = await requireAdminApi("catalog.edit");
  if (!access.ok) return access.response;
  const body = await request.json().catch(() => null);
  const id = typeof body?.productId === "string" ? body.productId : "";
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const str = (key: string, max: number) => typeof body?.[key] === "string" && body[key].length <= max ? body[key].trim() : null;
  const title = str("seo_title",70), description = str("seo_description",200), keyword = str("focus_keyword",100), alt = str("image_alt",180);
  const arr = (key: string, max: number) => Array.isArray(body?.[key]) && body[key].length <= max && body[key].every((x: unknown) => typeof x === "string" && x.length <= 120) ? body[key].map((x: string) => x.trim()).filter(Boolean) : null;
  const keywords = arr("seo_keywords",8), highlights = arr("highlights",5);
  if (!uuid.test(id) || title === null || description === null || keyword === null || alt === null || keywords === null || highlights === null) {
    return NextResponse.json({ error: "Invalid SEO data." }, { status: 400 });
  }
  const { data, error } = await access.supabase.rpc("admin_update_product_seo", {
    p_product_id: id, p_seo_title: title, p_seo_description: description,
    p_focus_keyword: keyword, p_seo_keywords: keywords, p_highlights: highlights, p_image_alt: alt,
  });
  if (error) {
    console.error("Admin product SEO save failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "Unable to save SEO fields. Check database migration and permissions." }, { status: error.code === "42501" ? 403 : 500 });
  }
  if (!data || typeof data.slug !== "string") return NextResponse.json({ error: "SEO update returned no product." }, { status: 500 });
  revalidatePath("/marketplace/" + data.slug);
  revalidatePath("/admin/products");
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true, updated_at: data.updated_at }, { headers: { "Cache-Control": "no-store" } });
}

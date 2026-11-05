import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

const transitions: Record<string, string[]> = { draft: ["review"], review: ["draft", "approved"], approved: ["review", "published"], published: ["review"] };
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.action !== "string") return NextResponse.json({ error: "Page id and action are required." }, { status: 400 });
  const access = await requireAdminApi("content.edit");
  if (!access.ok) return access.response;
  const { data: current, error: readError } = await access.supabase.from("seo_landing_pages").select("id,status,title,slug,body_markdown").eq("id", body.id).maybeSingle();
  if (readError || !current) return NextResponse.json({ error: "Landing page not found." }, { status: 404 });
  if (!transitions[current.status]?.includes(body.action)) return NextResponse.json({ error: "Invalid page status transition." }, { status: 409 });
  const publicationRequired = ["approved", "published"].includes(body.action) || (body.action === "review" && ["approved", "published"].includes(current.status));
  if (publicationRequired) {
    const publishAccess = await requireAdminApi("content.publish");
    if (!publishAccess.ok) return publishAccess.response;
  }
  if (["approved", "published"].includes(body.action) && (!current.title?.trim() || !current.slug || !current.body_markdown?.trim())) return NextResponse.json({ error: "Title, URL slug and page content are required before approval." }, { status: 409 });
  if (body.action === "published" && current.status !== "approved") return NextResponse.json({ error: "Only approved pages can be published." }, { status: 409 });
  const { data, error } = await access.supabase.from("seo_landing_pages").update({
    status: body.action, reviewed_by: access.user.id,
    reviewed_at: ["approved", "published"].includes(body.action) ? new Date().toISOString() : null,
    published_at: body.action === "published" ? new Date().toISOString() : null,
  }).eq("id", current.id).eq("status", current.status).select("id,status,slug").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update page workflow." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Page changed; reload before trying again." }, { status: 409 });
  return NextResponse.json({ page: data });
}

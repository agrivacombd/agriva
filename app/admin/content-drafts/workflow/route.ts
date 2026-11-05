import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const transitions: Record<string, string[]> = {
  draft: ["review"],
  review: ["draft", "approved", "rejected"],
  approved: ["review", "published"],
  rejected: ["draft"],
  published: ["review"],
};

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !body.id.trim()) {
    return NextResponse.json({ error: "A valid draft id is required." }, { status: 400 });
  }

  const action = body.action;
  const capability = action === "publish" ? "content.publish" : "content.edit";
  const access = await requireAdminApi(capability);
  if (!access.ok) return access.response;

  const { supabase, user } = access;
  const { data: current, error: readError } = await supabase
    .from("content_drafts")
    .select("id,status,title,slug,body_markdown")
    .eq("id", body.id.trim())
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (action === "save") {
    if (current.status === "published") {
      return NextResponse.json({ error: "Unpublish before editing." }, { status: 409 });
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const markdown = typeof body.body_markdown === "string" ? body.body_markdown : "";
    if (!title || title.length > 160 || !slugPattern.test(slug) || slug.length > 180) {
      return NextResponse.json({ error: "Title or slug is invalid." }, { status: 400 });
    }
    const { error } = await supabase.from("content_drafts").update({
      title, slug, body_markdown: markdown,
      meta_title: typeof body.meta_title === "string" ? body.meta_title.slice(0, 160) : null,
      meta_description: typeof body.meta_description === "string" ? body.meta_description.slice(0, 320) : null,
    }).eq("id", current.id).neq("status", "published");
    if (error) return NextResponse.json({ error: "Could not save draft." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (typeof action !== "string" || !transitions[current.status]?.includes(action)) {
    return NextResponse.json({ error: "Invalid workflow transition." }, { status: 409 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : current.title;
  const slug = typeof body.slug === "string" ? body.slug.trim() : current.slug;
  const markdown = typeof body.body_markdown === "string" ? body.body_markdown.trim() : current.body_markdown?.trim();
  if (action === "approved" || action === "published") {
    if (!title || title.length > 160 || !slugPattern.test(slug) || !markdown) {
      return NextResponse.json({ error: "A valid title, slug and completed article body are required." }, { status: 409 });
    }
  }

  const update = await supabase.from("content_drafts").update({
    status: action,
    reviewed_by: user.id,
    reviewed_at: ["approved", "rejected", "published"].includes(action) ? new Date().toISOString() : null,
    ...(body.title !== undefined ? { title } : {}),
    ...(body.slug !== undefined ? { slug } : {}),
    ...(body.body_markdown !== undefined ? { body_markdown: markdown } : {}),
    ...(body.meta_title !== undefined ? { meta_title: body.meta_title } : {}),
    ...(body.meta_description !== undefined ? { meta_description: body.meta_description } : {}),
  }).eq("id", current.id).eq("status", current.status).select("id,slug").maybeSingle();

  if (update.error) return NextResponse.json({ error: "Workflow update failed." }, { status: 500 });
  if (!update.data) return NextResponse.json({ error: "Draft changed; reload and try again." }, { status: 409 });
  return NextResponse.json({ ok: true, slug: update.data.slug });
}

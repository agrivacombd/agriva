import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const draftId = body?.draftId;

  if (typeof draftId !== "string" || !draftId.trim()) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }

  const access = await requireAdminApi("content.publish");
  if (!access.ok) return access.response;
  const { supabase, user } = access;

  const { data: draft, error: draftError } = await supabase
    .from("content_drafts")
    .select("id,status,title,slug,content_type,body_markdown")
    .eq("id", draftId.trim())
    .maybeSingle();

  if (draftError || !draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (draft.status !== "approved") {
    return NextResponse.json({ error: "Only approved drafts can be published" }, { status: 409 });
  }
  if (
    !draft.body_markdown?.trim() ||
    !draft.title?.trim() ||
    !draft.slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)
  ) {
    return NextResponse.json(
      { error: "Draft needs a title, valid slug, and body before publication" },
      { status: 409 }
    );
  }

  // Conditional update prevents a stale request from publishing a draft that
  // another moderator has moved out of the approved state.
  const { data: published, error: publishError } = await supabase
    .from("content_drafts")
    .update({
      status: "published",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", draft.id)
    .eq("status", "approved")
    .select("id,slug")
    .maybeSingle();

  if (publishError) {
    return NextResponse.json({ error: "Publication failed; verify the draft workflow" }, { status: 500 });
  }
  if (!published) {
    return NextResponse.json(
      { error: "Draft status changed. Reload and review it before publishing." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, slug: published.slug });
}

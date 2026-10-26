import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const draftId = body?.draftId;

  if (typeof draftId !== "string" || !draftId.trim()) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }

  // Use the cookie-aware server client so the caller's Supabase session is
  // forwarded and verified. A bare supabase-js client has no request session.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

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

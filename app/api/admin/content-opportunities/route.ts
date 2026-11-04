import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

const SELECT_COLUMNS = "id,keyword,intent,opportunity_type,search_count,result_count,status,title,slug,created_at";
const ALLOWED_STATUSES = ["all", "open", "draft", "review", "approved", "published", "rejected"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi("content.read");
  if (!auth.ok) return auth.response;

  const status = request.nextUrl.searchParams.get("status") ?? "all";
  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  let query = auth.supabase
    .from("content_opportunities")
    .select(SELECT_COLUMNS)
    .order("search_count", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Unable to load content opportunities" }, { status: 500 });
  }

  return NextResponse.json({ opportunities: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const nextStatus = typeof body?.status === "string" ? body.status : "";

  if (!id || !["review", "approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json({ error: "Valid opportunity id and status are required" }, { status: 400 });
  }

  // Moving an opportunity into the review queue is editorial work. Approval or
  // rejection is a publishing decision and requires the stronger capability.
  const auth = nextStatus === "review"
    ? await requireAdminApi("content.edit")
    : await requireAdminApi("content.publish");
  if (!auth.ok) return auth.response;

  const { data: current, error: readError } = await auth.supabase
    .from("content_opportunities")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: "Unable to verify opportunity status" }, { status: 500 });
  }
  if (!current) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const transitions: Record<string, string[]> = {
    open: ["review"],
    draft: ["review"],
    review: ["approved", "rejected"],
  };

  if (!transitions[current.status]?.includes(nextStatus)) {
    return NextResponse.json({ error: "This status transition is not allowed" }, { status: 409 });
  }

  const reviewFields = nextStatus === "review"
    ? { reviewed_at: null, reviewed_by: null }
    : { reviewed_at: new Date().toISOString(), reviewed_by: auth.user.id };

  const { data: updated, error: updateError } = await auth.supabase
    .from("content_opportunities")
    .update({ status: nextStatus, ...reviewFields })
    .eq("id", id).eq("status", current.status)
    .select("id,status,reviewed_at,reviewed_by")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Unable to update opportunity" }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "Opportunity changed; reload before trying again" }, { status: 409 });
  }

  return NextResponse.json({ opportunity: updated });
}

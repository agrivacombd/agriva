import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELECT_COLUMNS = "id,keyword,intent,opportunity_type,search_count,result_count,status,title,slug,created_at";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return { response: NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 }) };
  if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Admin role required" }, { status: 403 }) };
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const allowed = ["all", "open", "draft", "review", "approved", "published", "rejected"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });

  let query = auth.supabase.from("content_opportunities").select(SELECT_COLUMNS).order("search_count", { ascending: false }).limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load content opportunities" }, { status: 500 });
  return NextResponse.json({ opportunities: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const nextStatus = typeof body?.status === "string" ? body.status : "";
  if (!id || !["review", "approved", "published", "rejected"].includes(nextStatus)) {
    return NextResponse.json({ error: "Valid opportunity id and status are required" }, { status: 400 });
  }

  const { data: current, error: readError } = await auth.supabase.from("content_opportunities").select("id,status").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Unable to verify opportunity status" }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const transitions: Record<string, string[]> = { open: ["review"], draft: ["review"], review: ["approved", "rejected"], approved: ["published"] };
  if (!transitions[current.status]?.includes(nextStatus)) {
    return NextResponse.json({ error: "This status transition is not allowed" }, { status: 409 });
  }

  const { data: updated, error: updateError } = await auth.supabase.from("content_opportunities")
    .update({ status: nextStatus, reviewed_at: new Date().toISOString() })
    .eq("id", id).eq("status", current.status).select("id,status").maybeSingle();
  if (updateError) return NextResponse.json({ error: "Unable to update opportunity" }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Opportunity changed; reload before trying again" }, { status: 409 });
  return NextResponse.json({ opportunity: updated });
}

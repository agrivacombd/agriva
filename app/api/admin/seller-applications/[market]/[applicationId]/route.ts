import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/admin/authz";

type Params = { params: Promise<{ market: string; applicationId?: string }> };
async function getAdminClient() {
  const access = await requireAdminApi("catalog.moderate");
  if (!access.ok) return { response: access.response };
  return { supabase: access.supabase, user: access.user };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { market } = await params;
  const auth = await getAdminClient();
  if ("response" in auth) return auth.response;
  if (market === "marketplace") {
    const { data, error } = await auth.supabase.from("marketplace_seller_applications").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(100);
    if (error) return NextResponse.json({ error: "আবেদন লোড করা যায়নি।" }, { status: 400 });
    return NextResponse.json({ applications: data });
  }
  if (market === "plant-market") {
    const { data, error } = await auth.supabase.from("plant_seller_applications").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(100);
    if (error) return NextResponse.json({ error: "আবেদন লোড করা যায়নি।" }, { status: 400 });
    return NextResponse.json({ applications: data });
  }
  return NextResponse.json({ error: "Unknown market." }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { market, applicationId } = await params;
  const auth = await getAdminClient();
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => ({}))) || {};
  const status = body.status;
  const reviewNote = String(body.review_note || "").trim();
  if (!applicationId || !["approved", "rejected"].includes(status) || reviewNote.length > 1000) {
    return NextResponse.json({ error: "সিদ্ধান্ত ও পর্যালোচনা নোট যাচাই করুন।" }, { status: 400 });
  }
  const update = { status, review_note: reviewNote || null, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (market === "marketplace") {
    const { data, error } = await auth.supabase.from("marketplace_seller_applications").update(update).eq("id", applicationId).eq("status", "pending").select("id,user_id,status,reviewed_at").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "আবেদনটি পাওয়া যায়নি বা ইতিমধ্যে পর্যালোচিত হয়েছে।" }, { status: 409 });
    return NextResponse.json({ application: data });
  }
  if (market === "plant-market") {
    const { data, error } = await auth.supabase.from("plant_seller_applications").update(update).eq("id", applicationId).eq("status", "pending").select("id,user_id,status,reviewed_at").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "আবেদনটি পাওয়া যায়নি বা ইতিমধ্যে পর্যালোচিত হয়েছে।" }, { status: 409 });
    return NextResponse.json({ application: data });
  }
  return NextResponse.json({ error: "Unknown market." }, { status: 404 });
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "প্রথমে AGRIVA-তে লগইন করুন।" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const values = {
    user_id: user.id,
    business_name: String(body.business_name || "").trim(),
    business_type: String(body.business_type || "").trim(),
    contact_phone: String(body.contact_phone || "").trim(),
    business_address: String(body.business_address || "").trim(),
    trade_license: String(body.trade_license || "").trim() || null,
  };
  if (values.business_name.length < 2 || values.business_name.length > 160 ||
      values.business_type.length < 2 || values.business_type.length > 80 ||
      values.contact_phone.length < 6 || values.contact_phone.length > 30 ||
      values.business_address.length < 5 || values.business_address.length > 500) {
    return NextResponse.json({ error: "ব্যবসার নাম, ধরন, ফোন ও ঠিকানা সঠিকভাবে দিন।" }, { status: 400 });
  }
  const { data: existing } = await supabase.from("marketplace_seller_applications")
    .select("id,status").eq("user_id", user.id).eq("status", "pending").maybeSingle();
  if (existing) return NextResponse.json({ error: "আপনার Marketplace আবেদন ইতিমধ্যে পর্যালোচনায় আছে।" }, { status: 409 });
  const { data, error: insertError } = await supabase.from("marketplace_seller_applications")
    .insert(values).select("id,status,created_at").single();
  if (insertError) return NextResponse.json({ error: "আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।" }, { status: 400 });
  return NextResponse.json({ application: data }, { status: 201 });
}

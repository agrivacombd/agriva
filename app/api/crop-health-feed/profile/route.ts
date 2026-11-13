import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("full_name").eq("id",user.id).single();
  if (error) return NextResponse.json({ error: "প্রোফাইল লোড করা যায়নি।" }, { status: 503 });
  return NextResponse.json({ displayName: data?.full_name?.trim() || "" }, { headers: { "Cache-Control": "private, no-store" } });
}

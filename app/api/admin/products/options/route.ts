import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const [categories, subcategories, farmers] = await Promise.all([
    supabase.from("product_categories").select("name,slug").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("product_subcategories").select("name,slug,category_slug").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("profiles").select("id,full_name,phone").eq("role", "farmer").order("full_name").limit(500),
  ]);
  if (categories.error || subcategories.error || farmers.error) return NextResponse.json({ error: "ক্যাটাগরি বা বিক্রেতার তথ্য লোড করা যায়নি" }, { status: 500 });
  return NextResponse.json({ categories: categories.data ?? [], subcategories: subcategories.data ?? [], farmers: farmers.data ?? [] });
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "farmer") {
    return NextResponse.json({ error: "Farmer access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);

  if (
    !name ||
    name.length > 160 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    description.length > 5000 ||
    category.length > 120
  ) {
    return NextResponse.json({ error: "Please check the product details and try again." }, { status: 400 });
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  const slug = `${slugBase || "product"}-${crypto.randomUUID().slice(0, 8)}`;

  // Keep this insert compatible with the currently verified products schema.
  // SEO/image fields are intentionally excluded until their migration is applied
  // to the confirmed target database.
  const { data, error } = await supabase
    .from("products")
    .insert({
      farmer_id: user.id,
      name,
      slug,
      price,
      stock,
      description: description || null,
      category: category || null,
      status: "draft",
    })
    .select("id,name,status")
    .single();

  if (error) {
    console.error("Farmer product creation failed", { code: error.code });
    return NextResponse.json({ error: "Could not submit the product. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}

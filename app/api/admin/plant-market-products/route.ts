import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
import { sanitizeProductDescription } from "@/lib/marketplace/product-description";

const STATUSES = ["draft", "active", "paused", "rejected", "suspended"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const editableFields = ["name", "scientific_name", "description", "price", "stock", "plant_size", "pot_size", "plant_age", "sunlight", "watering", "flowering_season", "delivery_area", "seo_title", "seo_description", "focus_keyword", "image_alt", "usage_instructions"] as const;

export async function GET(request: NextRequest) {
  const access = await requireAdminApi("catalog.read");
  if (!access.ok) return access.response;
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(searchParams.get("page") || "1", 10) || 1));
  if (status !== "all" && !STATUSES.includes(status as typeof STATUSES[number]))
    return NextResponse.json({ error: "অবৈধ status filter।" }, { status: 400 });

  let query = access.supabase.from("plant_market_products")
    .select("id,seller_id,name,slug,scientific_name,category,category_slug,description,price,stock,unit,image_url,status,created_at,updated_at,plant_size,pot_size,plant_age,sunlight,watering,flowering_season,delivery_area,seo_title,seo_description,focus_keyword,image_alt,usage_instructions,moderation_note", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q.replace(/[,%()]/g, "")}%,slug.ilike.%${q.replace(/[,%()]/g, "")}%`);
  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);
  if (error) return NextResponse.json({ error: "Plant Market পণ্য তালিকা লোড করা যায়নি।" }, { status: 400 });
  return NextResponse.json({ products: data || [], total: count || 0, page, pageSize: 20 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "সঠিক তথ্য দিন।" }, { status: 400 });
  const id = typeof body.id === "string" ? body.id : "";
  if (!UUID.test(id)) return NextResponse.json({ error: "অবৈধ Product ID।" }, { status: 400 });

  const action = body.action === "edit" ? "edit" : body.action === "moderate" ? "moderate" : null;
  if (!action) return NextResponse.json({ error: "অবৈধ management action।" }, { status: 400 });
  const access = await requireAdminApi(action === "edit" ? "catalog.edit" : "catalog.moderate");
  if (!access.ok) return access.response;
  const { supabase } = access;

  const { data: current, error: lookupError } = await supabase.from("plant_market_products")
    .select("id,seller_id,name,slug,status").eq("id", id).maybeSingle();
  if (lookupError || !current) return NextResponse.json({ error: "পণ্যটি পাওয়া যায়নি।" }, { status: 404 });

  if (action === "moderate") {
    const status = body.status;
    const note = typeof body.moderation_note === "string" ? body.moderation_note.trim() : "";
    if (!STATUSES.includes(status) || note.length > 1000 || (["rejected", "suspended"].includes(status) && !note))
      return NextResponse.json({ error: "Reject/Suspend করতে কারণ লিখতে হবে (সর্বোচ্চ ১০০০ অক্ষর)।" }, { status: 400 });
    if (status === "active") {
      const [{ data: grant, error: grantError }, { data: gardener, error: gardenerError }] = await Promise.all([
        supabase.from("user_module_grants").select("id").eq("user_id", current.seller_id).eq("module", "plant_market").eq("permission", "create").eq("scope_type", "global").eq("status", "active").maybeSingle(),
        supabase.from("gardener_profiles").select("user_id").eq("user_id", current.seller_id).eq("verification_status", "verified").maybeSingle(),
      ]);
      if (grantError || gardenerError || !grant || !gardener)
        return NextResponse.json({ error: "Seller-এর verified Gardener পরিচয় ও Plant Market create অনুমোদন সক্রিয় নয়।" }, { status: 409 });
    }
    const { data, error } = await supabase.from("plant_market_products")
      .update({ status, moderation_note: note || null, moderated_by: access.user.id, moderated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id).eq("status", current.status).select("id,name,status").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "পণ্যের অবস্থা বদলানো যায়নি; রিফ্রেশ করে চেষ্টা করুন।" }, { status: 409 });
    return NextResponse.json({ product: data });
  }

  if (body.status !== undefined || body.slug !== undefined || body.seller_id !== undefined || body.image_url !== undefined)
    return NextResponse.json({ error: "Owner, image, slug ও status পরিবর্তনের জন্য নির্দিষ্ট আলাদা workflow ব্যবহার করুন।" }, { status: 400 });
  const patch: Record<string, string | number | null> = {};
  for (const field of editableFields) {
    if (!(field in body)) continue;
    if (field === "price" || field === "stock") {
      const n = Number(body[field]);
      if (!Number.isFinite(n) || (field === "price" && n <= 0) || (field === "stock" && (!Number.isInteger(n) || n < 0)))
        return NextResponse.json({ error: "মূল্য বা স্টক সঠিক নয়।" }, { status: 400 });
      patch[field] = n;
    } else {
      if (typeof body[field] !== "string") return NextResponse.json({ error: `${field} এর তথ্য সঠিক নয়।` }, { status: 400 });
      const text = body[field].trim();
      const limit = field === "description" ? 5000 : field === "usage_instructions" ? 2000 : field === "seo_description" ? 200 : field === "seo_title" ? 70 : field === "name" ? 160 : field === "image_alt" ? 180 : 300;
      if (text.length > limit || (field === "name" && text.length < 2)) return NextResponse.json({ error: `${field} ফিল্ডের দৈর্ঘ্য সঠিক নয়।` }, { status: 400 });
      patch[field] = field === "description" ? sanitizeProductDescription(text) : text || null;
    }
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "পরিবর্তন করার তথ্য পাওয়া যায়নি।" }, { status: 400 });
  const { data, error } = await supabase.from("plant_market_products").update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", current.status).select("id,name,status,updated_at").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "পণ্য আপডেট করা যায়নি। অন্য কেউ পরিবর্তন করে থাকলে রিফ্রেশ করুন।" }, { status: 409 });
  return NextResponse.json({ product: data });
}

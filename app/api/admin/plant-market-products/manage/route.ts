import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";

const textField = (value: unknown, max: number) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean.length <= max ? clean || null : undefined;
};

export async function PATCH(request: NextRequest) {
  const access = await requireAdminApi("catalog.edit");
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "সঠিক পণ্য তথ্য পাঠান।" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const name = textField(body.name, 160);
  const scientificName = textField(body.scientific_name, 160);
  const category = textField(body.category, 100);
  const description = textField(body.description, 5000);
  const unit = textField(body.unit, 40);
  const plantSize = textField(body.plant_size, 100);
  const potSize = textField(body.pot_size, 100);
  const plantAge = textField(body.plant_age, 100);
  const sunlight = textField(body.sunlight, 500);
  const watering = textField(body.watering, 500);
  const floweringSeason = textField(body.flowering_season, 160);
  const deliveryArea = textField(body.delivery_area, 500);
  const price = Number(body.price);
  const stock = Number(body.stock);

  if (!id || name === undefined || !name || name.length < 2 ||
      scientificName === undefined || category === undefined || !category ||
      description === undefined || unit === undefined || !unit ||
      plantSize === undefined || potSize === undefined || plantAge === undefined ||
      sunlight === undefined || watering === undefined || floweringSeason === undefined ||
      deliveryArea === undefined ||
      !Number.isFinite(price) || price < 0 || price > 100000000 ||
      !Number.isFinite(stock) || stock < 0 || stock > 100000000) {
    return NextResponse.json({ error: "নাম, ক্যাটাগরি, মূল্য, স্টক ও অন্যান্য ফিল্ডের সীমা যাচাই করুন।" }, { status: 400 });
  }


  const { data: current, error: lookupError } = await access.supabase
    .from("plant_market_products")
    .select("id,seller_id,status")
    .eq("id", id)
    .maybeSingle();
  if (lookupError || !current) {
    return NextResponse.json({ error: "Plant Market পণ্যটি পাওয়া যায়নি।" }, { status: 404 });
  }

  // The database trigger independently enforces seller verification and an active
  // create grant for active listings. Check first to return a useful admin message.
  if (current.status === "active") {
    const [{ data: grant, error: grantError }, { data: gardener, error: gardenerError }] = await Promise.all([
      access.supabase.from("user_module_grants").select("id")
        .eq("user_id", current.seller_id).eq("module", "plant_market")
        .eq("permission", "create").eq("scope_type", "global").is("scope_id", null).eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).maybeSingle(),
      access.supabase.from("gardener_profiles").select("user_id")
        .eq("user_id", current.seller_id).eq("verification_status", "verified").maybeSingle(),
    ]);
    if (grantError || gardenerError || !grant || !gardener) {
      return NextResponse.json({ error: "Seller-এর verified Gardener পরিচয় ও active Plant Market create grant না থাকায় প্রকাশিত পণ্য সম্পাদনা করা যাচ্ছে না। আগে seller access review করুন।" }, { status: 409 });
    }
  }

  const { data, error } = await access.supabase.from("plant_market_products").update({
    name, scientific_name: scientificName, category, description, price, stock, unit,
    plant_size: plantSize, pot_size: potSize, plant_age: plantAge, sunlight, watering,
    flowering_season: floweringSeason, delivery_area: deliveryArea,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("id,name,status,updated_at").maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "পণ্য সংরক্ষণ করা যায়নি। Database policy বা product validation যাচাই করুন।" }, { status: 409 });
  }
  return NextResponse.json({ product: data });
}

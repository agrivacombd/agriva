import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readRequestBodyWithLimit } from "@/lib/http/read-limited-request-body";

const allowedCategories = new Set(["seeds", "fertilizers", "crop-protection", "machinery", "other"]);

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "আবেদন করতে আগে AGRIVA-তে লগইন করুন।" }, { status: 401 });

  const bounded = await readRequestBodyWithLimit(request, 16384);
  if (!bounded.ok) return NextResponse.json({ error: "অনুরোধের তথ্য সীমার বেশি।" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(bounded.text); } catch {
    return NextResponse.json({ error: "সঠিক আবেদন তথ্য পাঠান।" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "সঠিক আবেদন তথ্য পাঠান।" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const companyName = typeof input.company_name === "string" ? input.company_name.trim() : "";
  const legalName = typeof input.legal_name === "string" ? input.legal_name.trim() : "";
  const registrationNumber = typeof input.registration_number === "string" ? input.registration_number.trim() : "";
  const contactPhone = typeof input.contact_phone === "string" ? input.contact_phone.trim() : "";
  const businessEmail = typeof input.business_email === "string" ? input.business_email.trim().toLowerCase() : "";
  const district = typeof input.district === "string" ? input.district.trim() : "";
  const websiteRaw = typeof input.website === "string" ? input.website.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const categories = Array.isArray(input.product_categories)
    ? [...new Set(input.product_categories.filter((value): value is string => typeof value === "string" && allowedCategories.has(value)))]
    : ["seeds"];
  if (
    companyName.length < 2 || companyName.length > 180 ||
    legalName.length > 220 || registrationNumber.length < 2 || registrationNumber.length > 100 ||
    contactPhone.length < 6 || contactPhone.length > 40 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail) || businessEmail.length > 254 ||
    district.length < 2 || district.length > 100 || notes.length > 2000 ||
    categories.length === 0 || categories.some((value) => !allowedCategories.has(value))
  ) return NextResponse.json({ error: "প্রতিষ্ঠানের নাম, ফোন, ইমেইল, জেলা ও পণ্যের ধরন সঠিকভাবে দিন।" }, { status: 400 });

  let website: string | null = null;
  if (websiteRaw) {
    try {
      const parsed = new URL(websiteRaw);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hostname.length > 253) throw new Error("invalid website");
      website = parsed.toString();
      if (website.length > 500) throw new Error("invalid website");
    } catch {
      return NextResponse.json({ error: "ওয়েবসাইট দিলে https:// দিয়ে শুরু হওয়া বৈধ URL দিন।" }, { status: 400 });
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("seed_company_applications")
    .select("id,status")
    .eq("applicant_user_id", user.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "আবেদনের অবস্থা যাচাই করা যায়নি। Migration ও database permission যাচাই করুন।" }, { status: 503 });
  if (existing?.status === "pending" || existing?.status === "approved") {
    return NextResponse.json({ error: existing.status === "pending" ? "আপনার আবেদন ইতিমধ্যে যাচাইয়ের অপেক্ষায় আছে।" : "আপনার কোম্পানি ইতিমধ্যে অনুমোদিত।" }, { status: 409 });
  }

  const values = {
    applicant_user_id: user.id,
    company_name: companyName,
    legal_name: legalName || null,
    registration_number: registrationNumber || null,
    contact_phone: contactPhone,
    business_email: businessEmail,
    district,
    website,
    product_categories: categories,
    notes: notes || null,
    status: "pending",
    review_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };
  const query = existing?.status === "rejected"
    ? supabase.from("seed_company_applications").update(values).eq("id", existing.id).eq("status", "rejected")
    : supabase.from("seed_company_applications").insert(values);
  const { error } = await query;
  if (error) {
    console.error("Seed company application submission failed", { code: error.code || "unknown" });
    return NextResponse.json({ error: "আবেদন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, status: "pending" }, { status: 201 });
}

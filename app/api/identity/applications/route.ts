import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isMarketplaceSellerCategory,
  isPlantMarketSellerCategory,
  isSellerEvidenceType,
  marketplaceOrganizationType,
  PLANT_GARDENING_TYPES,
  OPERATING_MODELS,
} from "@/lib/seller-verification/catalog";

export const runtime = "nodejs";
const MODULES = ["plant_market", "marketplace", "employer", "transport", "sell_harvest"] as const;
const SUBMIT_MODULES = ["plant_market","marketplace"] as const;
type NewApplicationModule = (typeof SUBMIT_MODULES)[number];

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function evidencePaths(value: unknown, userId: string): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 5) return null;
  const paths = value.map((item) => typeof item === "string" ? item : "");
  return paths.every((item) =>
    item.startsWith(userId + "/") &&
    /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$/i.test(item)
  ) ? paths : null;
}

function isBangladeshPhone(value: string): boolean {
  const normalized = value.replace(/[\s()-]/g, "");
  return /^(?:\+?8801|01)[3-9]\d{8}$/.test(normalized);
}

function isHttpsUrl(value: string): boolean {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function evidenceTypes(value: unknown, count: number): string[] | null {
  if (value === undefined) return Array.from({ length: count }, () => "other");
  if (!Array.isArray(value) || value.length !== count) return null;
  return value.every(isSellerEvidenceType) ? value : null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data, error } = await supabase.from("module_access_applications")
    .select("id,module,applicant_type,status,review_note,created_at,updated_at")
    .eq("user_id", user.id).in("module", [...MODULES]).order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Application status unavailable" }, { status: 503 });
  return NextResponse.json({ applications: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid application payload" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (!(SUBMIT_MODULES as readonly string[]).includes(String(input.module))) {
    return NextResponse.json({ error: "Only Marketplace and Plant Market seller applications are supported here." }, { status: 400 });
  }

  const selectedModule = input.module as NewApplicationModule;
  const { data: openApplication, error: openError } = await supabase.from("module_access_applications")
    .select("id,status").eq("user_id", user.id).eq("module", selectedModule)
    .in("status",["pending","under_review","approved"]).limit(1).maybeSingle();

  if (openError) return NextResponse.json({ error: "Application status unavailable" }, { status: 503 });
  if (openApplication?.status === "approved") {
    return NextResponse.json({ error: "You already have approved access for this module" }, { status: 409 });
  }
  if (openApplication) return NextResponse.json({ error: "An application is already under review" }, { status: 409 });

  const paths = evidencePaths(input.evidencePaths, user.id);
  if (!paths || paths.length === 0) {
    return NextResponse.json({ error: "At least one supporting evidence file is required" }, { status: 400 });
  }
  const types = evidenceTypes(input.evidenceTypes, paths.length);
  if (!types) return NextResponse.json({ error: "Evidence document types do not match uploaded files" }, { status: 400 });

  const { data: stored, error: storageError } = await supabase.storage.from("identity-verification").list(user.id, { limit: 100 });
  if (storageError) return NextResponse.json({ error: "Evidence could not be verified" }, { status: 503 });
  const existing = new Set((stored || []).map((item) => user.id + "/" + item.name));
  if (!paths.every((path) => existing.has(path))) {
    return NextResponse.json({ error: "Evidence file missing or not owned by this account" }, { status: 400 });
  }

  const contactName = clean(input.contactName, 120);
  const contactPhone = clean(input.contactPhone, 30);
  const district = clean(input.district, 80);
  const deliveryCoverage = clean(input.deliveryCoverage, 240);
  const sourceDeclaration = clean(input.sourceDeclaration, 2000);
  if (!contactName || !isBangladeshPhone(contactPhone) || !district || deliveryCoverage.length < 3 || sourceDeclaration.length < 20) {
    return NextResponse.json({ error: "Contact name, valid Bangladesh phone, district, delivery coverage and a source declaration (at least 20 characters) are required." }, { status: 400 });
  }
  if (input.policyAccepted !== true) {
    return NextResponse.json({ error: "Please accept the seller declaration and marketplace policies before submitting." }, { status: 400 });
  }

  let applicantType: string;
  let applicantData: Record<string, unknown>;
  let organizationId: string | null = null;

  if (selectedModule === "plant_market") {
    const category = input.sellerCategory;
    if (!isPlantMarketSellerCategory(category)) {
      return NextResponse.json({ error: "Select a valid Plant Market seller category." }, { status: 400 });
    }

    const experience = clean(input.experienceNote, 2000);
    const gardeningTypes = Array.isArray(input.gardeningTypes)
      ? input.gardeningTypes.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    const allowedGardeningTypes = new Set<string>(PLANT_GARDENING_TYPES.map((item) => item.value));
    if (!experience || experience.length < 20 || !gardeningTypes.length ||
      gardeningTypes.some((item) => !allowedGardeningTypes.has(item))) {
      return NextResponse.json({ error: "Select at least one plant/product type and describe your growing or selling experience (at least 20 characters)." }, { status: 400 });
    }

    const operatingModel = clean(input.operatingModel, 40);
    if (!OPERATING_MODELS.some((item) => item.value === operatingModel)) {
      return NextResponse.json({ error: "Select how you grow, source or sell your products." }, { status: 400 });
    }

    const nurseryName = clean(input.nurseryName, 180);
    const nurseryAddress = clean(input.nurseryAddress, 300);
    if (category === "nursery_owner" && (!nurseryName || !nurseryAddress)) {
      return NextResponse.json({ error: "Nursery name and nursery location are required for nursery owners." }, { status: 400 });
    }

    applicantType = "gardener";
    applicantData = {
      schema_version: 1,
      seller_category: category,
      contact_name: contactName,
      contact_phone: contactPhone.replace(/[\s()-]/g, ""),
      district,
      gardening_types: gardeningTypes,
      experience_note: experience,
      operating_model: operatingModel,
      nursery_name: nurseryName || null,
      nursery_address: nurseryAddress || null,
      source_declaration: sourceDeclaration,
      delivery_coverage: deliveryCoverage,
      policy_accepted: true,
      policy_version: "seller-v1",
      policy_accepted_at: new Date().toISOString(),
      evidence_paths: paths,
      evidence_types: types,
    };
  } else {
    const category = input.sellerCategory;
    if (!isMarketplaceSellerCategory(category)) {
      return NextResponse.json({ error: "Select a valid Marketplace seller category." }, { status: 400 });
    }

    const name = clean(input.organizationName, 180);
    const address = clean(input.businessAddress, 300);
    const businessDescription = clean(input.businessDescription, 2000);
    const tradeLicense = clean(input.tradeLicense, 100);
    const website = clean(input.website, 300);
    if (!name || !address || businessDescription.length < 20 || !isHttpsUrl(website)) {
      return NextResponse.json({ error: "Business name, address, business description (at least 20 characters) and a valid HTTPS website (if provided) are required." }, { status: 400 });
    }

    const organizationType = marketplaceOrganizationType(category);
    const { data: verifiedOrganization, error: verifiedError } = await supabase.from("organizations")
      .select("id").eq("owner_id", user.id).eq("status", "verified").limit(1).maybeSingle();
    if (verifiedError) return NextResponse.json({ error: "Verified business profile could not be checked" }, { status: 503 });

    if (verifiedOrganization) {
      organizationId = verifiedOrganization.id;
    } else {
      const { data: existingOrganization, error: existingError } = await supabase.from("organizations")
        .select("id").eq("owner_id", user.id).eq("status", "pending").limit(1).maybeSingle();
      if (existingError) return NextResponse.json({ error: "Business profile could not be checked" }, { status: 503 });

      if (existingOrganization) {
        const { error: updateError } = await supabase.from("organizations")
          .update({ name, organization_type: organizationType, registration_number: tradeLicense || null })
          .eq("id", existingOrganization.id);
        if (updateError) return NextResponse.json({ error: "Business profile could not be updated" }, { status: 409 });
        organizationId = existingOrganization.id;
      } else {
        const { data: organization, error } = await supabase.from("organizations")
          .insert({ owner_id: user.id, name, organization_type: organizationType, registration_number: tradeLicense || null, status: "pending" })
          .select("id").single();
        if (error || !organization) return NextResponse.json({ error: "Business profile could not be created" }, { status: 409 });
        organizationId = organization.id;
      }
    }

    if (category === "authorized_dealer" && !types.includes("dealer_authorization")) {
      return NextResponse.json({ error: "Authorized dealer applicants must attach and label an authorization document." }, { status: 400 });
    }

    applicantType = "business";
    applicantData = {
      schema_version: 1,
      seller_category: category,
      organization_name: name,
      organization_type: organizationType,
      trade_license: tradeLicense,
      business_address: address,
      business_description: businessDescription,
      website,
      contact_name: contactName,
      contact_phone: contactPhone.replace(/[\s()-]/g, ""),
      district,
      source_declaration: sourceDeclaration,
      delivery_coverage: deliveryCoverage,
      policy_accepted: true,
      policy_version: "seller-v1",
      policy_accepted_at: new Date().toISOString(),
      evidence_paths: paths,
      evidence_types: types,
    };
  }

  if (JSON.stringify(applicantData).length > 32000) {
    return NextResponse.json({ error: "Application details are too large. Please shorten the text and try again." }, { status: 413 });
  }

  const { data: application, error } = await supabase.from("module_access_applications").insert({
    user_id: user.id,
    module: selectedModule,
    applicant_type: applicantType,
    organization_id: organizationId,
    applicant_data: applicantData,
    status:"pending",
  }).select("id,module,status,created_at").single();

  if (error || !application) {
    return NextResponse.json({ error: error?.code === "23505" ? "An application is already open" : "Application could not be submitted" }, { status: 409 });
  }
  return NextResponse.json({ application }, { status: 201 });
}

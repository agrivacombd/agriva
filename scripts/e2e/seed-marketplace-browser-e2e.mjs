import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.E2E_SEEDED_PASSWORD;
if (!url || !anonKey || !serviceKey || !password) throw new Error("Missing isolated E2E configuration.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
async function createUser(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, selected_roles: ["farmer"] },
  });
  if (error || !data.user) throw new Error(error?.message || "Test Auth user creation failed.");
  return data.user;
}
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const sellerEmail = process.env.E2E_SELLER_EMAIL;
const adminUser = await createUser(adminEmail, "AGRIVA E2E Admin");
const sellerUser = await createUser(sellerEmail, "AGRIVA E2E Seller");

const { error: roleError } = await admin.from("profiles").update({ role: "admin" }).eq("id", adminUser.id);
if (roleError) throw roleError;

const { data: org, error: orgError } = await admin.from("organizations").insert({
  owner_id: sellerUser.id, name: "AGRIVA E2E Seller Organization",
  organization_type: "company", status: "verified",
}).select("id").single();
if (orgError || !org) throw orgError || new Error("Seller organization fixture missing.");

const grants = ["read", "create", "manage_orders"].map(permission => ({
  user_id: sellerUser.id, module: "marketplace", permission,
  scope_type: "organization", scope_id: org.id, granted_by: adminUser.id,
  reason: "Disposable GitHub Actions E2E fixture",
}));
const { error: grantsError } = await admin.from("user_module_grants").insert(grants);
if (grantsError) throw grantsError;

const { data: product, error: productError } = await admin.from("products").insert({
  farmer_id: sellerUser.id, seller_organization_id: org.id,
  name: "AGRIVA E2E COD Test Product", slug: "agriva-e2e-cod-product",
  description: "Disposable test-only product. Not real inventory.",
  price: 120, stock: 8, reseller_commission_percent: 0, status: "draft",
  category: "Edible Seeds", category_slug: "premium-food-grains",
  subcategory_slug: "edible-seeds", unit: "pack", shipping_class: "packet",
  marketplace_channel: "marketplace", image_urls: [], highlights: [], seo_keywords: [],
}).select("id").single();
if (productError || !product) throw productError || new Error("COD product fixture missing.");

const adminAuth = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { error: signInError } = await adminAuth.auth.signInWithPassword({ email: adminEmail, password });
if (signInError) throw signInError;
const { error: publishError } = await adminAuth.rpc("admin_update_product", {
  p_product_id: product.id, p_name: "AGRIVA E2E COD Test Product",
  p_description: "Disposable test-only product. Not real inventory.",
  p_price: 120, p_stock: 8, p_commission_percent: 0, p_status: "active",
});
if (publishError) throw publishError;

console.log("Seeded disposable Auth users, seller organization/grants, and an admin-published COD product.");
console.log("E2E_PRODUCT_ID=" + product.id);
console.log("E2E_SELLER_ID=" + sellerUser.id);
console.log("E2E_ADMIN_ID=" + adminUser.id);

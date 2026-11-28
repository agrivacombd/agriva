#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const catalog = read("lib/seller-verification/catalog.ts");
const api = read("app/api/identity/applications/route.ts");
const ui = read("app/account/verification/page.tsx");
const admin = read("components/admin/ApplicationManagement.tsx");
const spec = read("docs/seller-verification/PHASE1_IMPLEMENTATION_SPEC.md");

assert.match(catalog, /retailer[\s\S]*wholesaler[\s\S]*authorized_dealer[\s\S]*manufacturer[\s\S]*cooperative[\s\S]*agri_service_provider[\s\S]*other_business/);
assert.match(catalog, /nursery_owner[\s\S]*plant_grower[\s\S]*fruit_sapling_grower[\s\S]*ornamental_plant_seller[\s\S]*seed_cutting_seller[\s\S]*plant_reseller[\s\S]*gardening_supplies[\s\S]*hobby_gardener/);
assert.match(catalog, /marketplaceOrganizationType/);
assert.match(catalog, /isMarketplaceSellerCategory/);
assert.match(catalog, /isPlantMarketSellerCategory/);
assert.match(catalog, /SELLER_EVIDENCE_TYPES/);

assert.match(api, /supabase\.auth\.getUser\(\)/, "server derives applicant from authenticated session");
assert.match(api, /SUBMIT_MODULES = \["plant_market","marketplace"\]/, "only seller modules can submit");
assert.match(api, /isMarketplaceSellerCategory/);
assert.match(api, /isPlantMarketSellerCategory/);
assert.match(api, /marketplaceOrganizationType\(category\)/, "category maps to existing organization type");
assert.match(api, /isBangladeshPhone/);
assert.match(api, /isHttpsUrl/);
assert.match(api, /policyAccepted !== true/);
assert.match(api, /category === "nursery_owner" && \(!nurseryName \|\| !nurseryAddress\)/);
assert.match(api, /evidencePaths/);
assert.match(api, /evidenceTypes/);
assert.match(api, /identity-verification/);
assert.match(api, /JSON\.stringify\(applicantData\)\.length > 32000/);
assert.match(api, /status:"pending"/);
assert.match(api, /\["pending","under_review","approved"\]/);
assert.doesNotMatch(api, /service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(ui, /MARKETPLACE_SELLER_CATEGORIES/);
assert.match(ui, /PLANT_MARKET_SELLER_CATEGORIES/);
assert.match(ui, /sellerCategory/);
assert.match(ui, /gardeningTypes/);
assert.match(ui, /nurseryName/);
assert.match(ui, /evidenceTypes/);
assert.match(ui, /Admin review শেষ না হওয়া পর্যন্ত/);
assert.match(ui, /\.remove\(uploadedPaths\)/);
assert.match(ui, /identity-verification/);

assert.match(admin, /startsWith\(app\.user_id \+ "\/"\)/, "admin signed evidence remains applicant-path scoped");
assert.match(spec, /No database migration or production write/);
assert.match(spec, /Do not reject an individual or small operator merely for not having a trade license/);
assert.match(spec, /No structured NID number capture/);

console.log("AGRIVA seller verification Phase 1 contract checks passed.");

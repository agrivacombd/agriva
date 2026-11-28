#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const page = read("app/admin/plant-market-applications/page.tsx");
const ui = read("components/admin/ApplicationManagement.tsx");
const shell = read("components/admin/shell/AdminShell.tsx");
const action = read("lib/admin/application-review.ts");
const api = read("app/api/identity/applications/route.ts");
const migration = read("supabase/migrations/20261030110000_identity_verification_workflow.sql");
const foundation = read("supabase/migrations/20261030100000_module_access_foundation.sql");

assert.match(page, /ApplicationManagement/);
assert.match(page, /scope="plant"/);
assert.match(page, /category=\{params\.category\}/);
assert.match(page, /robots: \{ index: false, follow: false \}/);

assert.match(ui, /type Scope = "identity" \| "seller" \| "plant"/);
assert.match(ui, /scope === "plant"/);
assert.match(ui, /moduleKey = isSeller \? "marketplace" : isPlant \? "plant_market" : null/);
assert.match(ui, /"\/admin\/plant-market-applications"/);
assert.match(ui, /Plant Market seller verification/);
assert.match(ui, /Plant Market review desk/);
assert.match(ui, /PLANT_CATEGORY_KEYS/);
assert.match(ui, /Filter by Plant Market seller category/);
assert.match(ui, /nursery_name/);
assert.match(ui, /nursery_address/);
assert.match(ui, /gardening_types/);
assert.match(ui, /operating_model/);
assert.match(ui, /experience_note/);
assert.match(ui, /source_declaration/);
assert.match(ui, /Supporting evidence/);
assert.match(ui, /Seller policy consent/);
assert.match(ui, /expectedModule/);
assert.match(ui, /createSignedUrl\(path, 300\)/);
assert.match(ui, /startsWith\(app\.user_id \+ "\/"\)/);
assert.match(ui, /module_access_application_events/);
assert.match(ui, /AdminConfirmSubmitButton/);

assert.match(shell, /href: "\/admin\/plant-market-applications"/);
assert.match(shell, /Plant Market verification/);
assert.match(shell, /event\.metaKey\s*\|\|\s*event\.ctrlKey/);

assert.match(action, /requireAdminPage\("identity\.review"\)/);
assert.match(action, /expectedModule/);
assert.match(action, /application\.module !== expectedModule/);
assert.match(action, /\["pending", "under_review"\]\.includes\(application\.status\)/);
assert.match(action, /admin_review_module_application/);
assert.match(action, /revalidatePath\("\/admin\/plant-market-applications"\)/);

assert.match(api, /category === "nursery_owner" && \(!nurseryName \|\| !nurseryAddress\)/);
assert.match(api, /evidence_types: types/);
assert.match(migration, /module_access_applications/);
assert.match(foundation, /admin_review_module_application/);

console.log("AGRIVA Plant Market seller verification workspace contract checks passed.");

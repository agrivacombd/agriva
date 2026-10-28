#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const reseller = readFileSync("app/api/reseller/links/route.ts", "utf8");
assert.match(reseller, /profile\?\.role !== "reseller"/, "reseller role must be checked before link creation");
assert.match(reseller, /UUID_PATTERN\.test\(productId\)/, "product ID must be validated as UUID");
assert.doesNotMatch(reseller, /error: error\.message/, "database details must not be exposed by reseller link API");

const farmer = readFileSync("app/api/farmer/products/route.ts", "utf8");
const sellerDashboard = readFileSync("app/seller/page.tsx", "utf8");
const sellerForm = readFileSync("components/farmer/ProductForm.tsx", "utf8");
const productModeration = readFileSync("supabase/migrations/20261029140000_seller_product_moderation.sql", "utf8");
const serverAuthorization = readFileSync("lib/auth/server-authorization.ts", "utf8");
const moderationPage = readFileSync("app/admin/moderation/page.tsx", "utf8");
const moderationMigration = readFileSync("supabase/migrations/20261029150000_product_moderation_workflow.sql", "utf8");
const adminOverview = readFileSync("app/admin/page.tsx", "utf8");
const staffAccessPage = readFileSync("app/admin/access/page.tsx", "utf8");
const staffRoleMigration = readFileSync("supabase/migrations/20261029160000_staff_role_assignment.sql", "utf8");
const permissionCatalogue = readFileSync("lib/auth/permissions.ts", "utf8");
assert.match(farmer, /Farmer product creation failed/, "product insert failures must be logged server-side");
assert.match(farmer, /পণ্য সংরক্ষণ করা যায়নি/, "product insert failures must return safe localized message");
assert.doesNotMatch(farmer, /error: error\.message/, "database details must not be exposed by farmer product API");

assert.match(farmer, /authorizePermission\("catalog\.create_own"\)/, "seller listing API must use the shared capability guard");
assert.match(farmer, /role === "farmer" \|\| role === "seller"/, "both seller and farmer memberships may submit listings");
assert.match(farmer, /reseller_commission_percent: 0/, "seller API must not accept commission policy from the client");
assert.doesNotMatch(sellerForm, /commission/, "seller form must not expose commission policy controls");
assert.match(sellerDashboard, /\.eq\("farmer_id", auth\.user\.id\)/, "seller dashboard must query only the authenticated seller's listings");
assert.match(serverAuthorization, /Unable to verify permissions/, "permission lookup failures must fail closed");
assert.match(productModeration, /NEW\.status := 'draft'::public\.product_status/, "database must force new seller listings to draft");
assert.match(productModeration, /Listing status changes require moderation/, "seller must not bypass moderation via direct database updates");
assert.match(productModeration, /Commission changes require platform administration/, "seller must not change commission through direct database updates");
assert.match(productModeration, /role IN \('farmer', 'seller'\)/, "database policy must limit listing writes to seller/farmer roles");


assert.ok(moderationMigration.includes("moderation_status text NOT NULL DEFAULT"), "listing moderation state must be persisted");
assert.ok(moderationMigration.includes("admin_moderate_marketplace_product"), "moderation decisions must use a database RPC");
assert.ok(moderationMigration.includes("product.moderation."), "moderation decisions must be auditable");
assert.ok(moderationPage.includes("request_changes"), "moderators must be able to request seller changes");
assert.ok(moderationPage.includes("Approve & publish"), "approved listings must have an explicit publication action");
assert.ok(moderationPage.includes("super_admin"), "moderation page must check privileged roles");
assert.ok(adminOverview.includes("/admin/moderation"), "Super Admin must have a direct link to the moderation queue");

assert.ok(staffRoleMigration.includes("admin_set_staff_role"), "staff roles must be assigned through a dedicated database RPC");
assert.ok(staffRoleMigration.includes("Self-service staff role changes are not allowed"), "staff must not self-assign privileged roles");
assert.ok(staffRoleMigration.includes("staff.role.granted"), "staff role grants must be audited");
assert.ok(staffAccessPage.includes("Grant role") && staffAccessPage.includes("Revoke selected"), "Super Admin needs staff role grant/revoke controls");
assert.ok(adminOverview.includes("/admin/access"), "Super Admin console must link to staff access management");
assert.ok(permissionCatalogue.includes('"finance.read_scoped", "payout.review", "roles.assign_scoped", "audit.read"'), "admin capability set must include scoped staff provisioning");


const moderatorScopeMigration = readFileSync("supabase/migrations/20261029170000_separate_moderator_and_admin_scope.sql", "utf8");
assert.match(moderatorScopeMigration, /v_is_platform_admin boolean[\s\S]*public\.is_admin\(\)[\s\S]*m\.role IN \('admin', 'super_admin'\)/, "only platform admin/super-admin roles may use broad product write scope");
assert.match(moderatorScopeMigration, /Product moderators may only change moderation fields/, "moderators must not edit price, stock, commission, or ownership through direct writes");
assert.match(moderatorScopeMigration, /OLD\.farmer_id <> auth\.uid\(\)/, "moderators must not approve their own seller listings");
assert.match(moderatorScopeMigration, /INSERT INTO public\.admin_audit_log/, "moderator database transitions must be auditable");
assert.match(moderatorScopeMigration, /AND \(v_is_platform_admin OR farmer_id <> auth\.uid\(\)\)/, "moderation RPC must reject self-approval");

console.log("API role, moderator-scope, and error disclosure regression checks passed.");

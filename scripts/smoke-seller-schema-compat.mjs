#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261029130000_compat_seller_submission_with_current_schema.sql",
  "utf8",
);

assert.match(migration, /CREATE OR REPLACE FUNCTION public\.enforce_seller_product_moderation/);
assert.match(migration, /public\.is_admin\(\)/, "admin access must use the existing main-branch helper");
assert.match(migration, /membership\.role IN \('seller', 'organization'\)/, "only seller and approved organization memberships may submit");
assert.match(migration, /NEW\.status := 'draft'/, "seller submissions must remain drafts");
assert.match(migration, /NEW\.reseller_commission_percent := 0/, "seller submissions cannot set commission");
assert.match(migration, /NEW\.farmer_id IS DISTINCT FROM auth\.uid\(\)/, "seller must not create listings for another account");
assert.match(migration, /NEW\.status IS DISTINCT FROM OLD\.status/, "seller cannot publish or change listing status");
assert.match(migration, /NEW\.reseller_commission_percent IS DISTINCT FROM OLD\.reseller_commission_percent/, "seller cannot change commission");
assert.doesNotMatch(migration, /moderation_status|moderation_reason|moderated_by|moderated_at|has_product_moderation_permission|has_platform_admin_access/, "migration must not depend on unmerged moderation schema");
console.log("Production seller schema compatibility regression checks passed.");

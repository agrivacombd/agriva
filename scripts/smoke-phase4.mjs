#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261031010000_phase4_optional_modules.sql");
const taxonomy = read("lib/marketplace/taxonomy.ts");
const admin = read("app/admin/page.tsx");
const exchange = read("scripts/smoke-green-exchange.mjs");
const garden = read("scripts/smoke-green-living-platform.mjs");
const corrections = read("components/admin/LearningCorrectionInbox.tsx");
const seller = read("scripts/smoke-seller-marketplace-submission.mjs");

assert.match(migration, /plants-gardening/);
for (const slug of ["indoor-plants", "flowering-plants", "fruit-saplings", "seeds-cuttings", "pots-planters", "soil-growing-media", "garden-tools"]) {
  assert.ok(migration.includes(slug), `missing plant taxonomy subcategory: ${slug}`);
}
assert.match(migration, /create or replace function private\.enforce_mfa_for_commission_payout_transition/);
assert.match(migration, /auth\.jwt\(\)\s*->>\s*'aal'/);
assert.match(migration, /v_aal is distinct from 'aal2'/);
assert.match(migration, /v_actor_role is distinct from 'admin'/);
assert.match(migration, /before update of status on public\.commission_payouts/i);
assert.match(migration, /payout\.mfa_approved/);
assert.match(migration, /payout\.mfa_settled/);
assert.match(migration, /public\.admin_audit_log/);
assert.match(admin, /MFA verification required/i);
assert.match(admin, /payout_mfa_required/);

assert.match(exchange, /green_exchange_listings/);
assert.match(garden, /garden_plants/);
assert.match(corrections, /learning_correction_reports/);
assert.match(corrections, /needs_info/);
assert.match(seller, /user_role_memberships/);
console.log("Phase 4 optional-module regression checks passed.");

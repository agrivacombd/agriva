#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261030150000_security_performance_advisor_hardening.sql",
  "utf8"
);

assert.match(migration, /create schema if not exists private/i, "private implementation schema must exist");
assert.match(migration, /alter function %s set schema private/i, "original SECURITY DEFINER function OIDs must be moved");
assert.match(migration, /security invoker/i, "public RPC facades must be SECURITY INVOKER");
assert.match(migration, /pg_get_function_arguments/i, "RPC argument defaults and names must be preserved");
assert.match(migration, /aclexplode\(v_acl\)/i, "original EXECUTE ACL must be copied");
assert.match(migration, /enforce_seller_product_moderation/i, "trigger-only function must be moved out of public");
assert.match(migration, /revoke all on function private\.enforce_seller_product_moderation/i, "trigger-only function must not be directly executable by clients");

for (const index of [
  "admin_user_roles_granted_by_idx",
  "admin_user_roles_role_id_idx",
  "farm_members_invited_by_idx",
  "farmer_profiles_reviewed_by_idx",
  "gardener_profiles_reviewed_by_idx",
  "module_access_application_events_actor_id_idx",
  "module_access_applications_organization_id_idx",
  "module_access_applications_reviewed_by_idx",
  "organization_members_invited_by_idx",
  "user_module_grants_granted_by_idx",
  "user_module_grants_revoked_by_idx",
]) {
  assert.match(migration, new RegExp("create index if not exists " + index, "i"), index + " must cover an unindexed FK");
}

assert.match(migration, /authenticated users can read permitted job posts/i, "job-post SELECT policies must be consolidated");
assert.match(migration, /candidates and employers can read relevant applications/i, "job-application SELECT policies must be consolidated");
assert.doesNotMatch(migration, /drop index/i, "zero-scan indexes must not be dropped without workload evidence");
console.log("AGRIVA security/performance Advisor hardening regression checks passed.");

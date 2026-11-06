#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "ADMIN_TEST_NON_ADMIN_EMAIL",
  "ADMIN_TEST_NON_ADMIN_PASSWORD",
  "ADMIN_TEST_LEGACY_EMAIL",
  "ADMIN_TEST_LEGACY_PASSWORD",
  "ADMIN_TEST_DELEGATED_EMAIL",
  "ADMIN_TEST_DELEGATED_PASSWORD",
  "ADMIN_TEST_DELEGATED_NO_GRANT_EMAIL",
  "ADMIN_TEST_DELEGATED_NO_GRANT_PASSWORD",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const missingTransportId = "00000000-0000-4000-8000-000000000001";
const missingListingId = "00000000-0000-4000-8000-000000000002";

async function signedInClient(email, password) {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Test login failed for ${email}: ${error.message}`);
  return client;
}

function assertDenied(error, label) {
  assert.ok(error, `${label}: expected RPC denial, got success`);
  assert.equal(error.code, "42501", `${label}: expected SQLSTATE 42501, got ${error.code} (${error.message})`);
}

function assertAuthorizedButMissing(error, label) {
  assert.ok(error, `${label}: expected missing fixture row, not successful mutation`);
  assert.equal(error.code, "P0002", `${label}: authorization should pass and then return P0002; got ${error.code} (${error.message})`);
}

async function expectRpc(client, fn, args, assertion, label) {
  const { error } = await client.rpc(fn, args);
  assertion(error, label);
}

const nonAdmin = await signedInClient(process.env.ADMIN_TEST_NON_ADMIN_EMAIL, process.env.ADMIN_TEST_NON_ADMIN_PASSWORD);
const legacyAdmin = await signedInClient(process.env.ADMIN_TEST_LEGACY_EMAIL, process.env.ADMIN_TEST_LEGACY_PASSWORD);
const delegated = await signedInClient(process.env.ADMIN_TEST_DELEGATED_EMAIL, process.env.ADMIN_TEST_DELEGATED_PASSWORD);
const delegatedWithoutGrant = await signedInClient(
  process.env.ADMIN_TEST_DELEGATED_NO_GRANT_EMAIL,
  process.env.ADMIN_TEST_DELEGATED_NO_GRANT_PASSWORD,
);

for (const [fn, args, label] of [
  ["admin_set_transport_partner_verification", { p_user_id: missingTransportId, p_status: "verified", p_note: "negative auth test" }, "Transport RPC"],
  ["admin_moderate_green_exchange_listing", { p_listing_id: missingListingId, p_moderation_status: "approved" }, "Green Exchange RPC"],
]) {
  await expectRpc(nonAdmin, fn, args, assertDenied, `non-admin ${label}`);
  await expectRpc(delegatedWithoutGrant, fn, args, assertDenied, `delegated-without-grant ${label}`);
}

await expectRpc(
  legacyAdmin,
  "admin_set_transport_partner_verification",
  { p_user_id: missingTransportId, p_status: "verified", p_note: "legacy admin auth test" },
  assertAuthorizedButMissing,
  "legacy-admin Transport RPC",
);
await expectRpc(
  legacyAdmin,
  "admin_moderate_green_exchange_listing",
  { p_listing_id: missingListingId, p_moderation_status: "approved" },
  assertAuthorizedButMissing,
  "legacy-admin Green Exchange RPC",
);
await expectRpc(
  delegated,
  "admin_set_transport_partner_verification",
  { p_user_id: missingTransportId, p_status: "verified", p_note: "delegated auth test" },
  assertAuthorizedButMissing,
  "delegated Transport RPC",
);
await expectRpc(
  delegated,
  "admin_moderate_green_exchange_listing",
  { p_listing_id: missingListingId, p_moderation_status: "approved" },
  assertAuthorizedButMissing,
  "delegated Green Exchange RPC",
);

const [nonAdminAudit, legacyAudit, delegatedAudit] = await Promise.all([
  nonAdmin.from("admin_audit_log").select("id").limit(1),
  legacyAdmin.from("admin_audit_log").select("id").limit(1),
  delegated.from("admin_audit_log").select("id").limit(1),
]);
assert.equal(nonAdminAudit.error, null, "non-admin audit query should be RLS-filtered, not error");
assert.equal(nonAdminAudit.data?.length ?? 0, 0, "non-admin must not read audit events");
assert.equal(legacyAudit.error, null, "legacy Admin must be able to read audit events");
assert.equal(delegatedAudit.error, null, "delegated audit.read role must be able to read audit events");

for (const client of [nonAdmin, legacyAdmin, delegated, delegatedWithoutGrant]) {
  await client.auth.signOut();
}

console.log("Admin authorization integration checks passed: non-admin denied; legacy Admin and delegated grants pass; delegated missing grants denied; audit RLS enforced.");

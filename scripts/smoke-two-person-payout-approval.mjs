#!/usr/bin/env node
/**
 * Static contract checks for MFA-gated, two-person commission payout approvals.
 * Does not connect to Supabase or mutate any data.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync(
  "supabase/migrations/20261029180000_two_person_payout_approval.sql",
  "utf8",
);

assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.admin_action_approvals/i);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/i);
assert.match(migration, /REVOKE ALL ON TABLE public\.admin_action_approvals FROM PUBLIC, anon, authenticated/i);
assert.match(migration, /auth\.jwt\(\) ->> 'aal'[\s\S]*?IS DISTINCT FROM 'aal2'/i,
  "both approval steps must require an AAL2 session");
assert.match(migration, /request_commission_payout_approval\([\s\S]*?p_payout_id uuid,[\s\S]*?p_reason text/i);
assert.match(migration, /approve_commission_payout_approval\([\s\S]*?p_approval_id uuid,[\s\S]*?p_approval_reason text/i);
assert.match(migration, /v_approval\.initiated_by = v_uid/i,
  "the initiator must not approve their own request");
assert.match(migration, /UNIQUE INDEX IF NOT EXISTS admin_action_approvals_one_pending_per_target/i,
  "concurrent duplicate pending approvals must be prevented");
assert.match(migration, /FOR UPDATE/i, "approval and payout rows must be locked during transitions");
assert.match(migration, /payout\.approval_requested/i);
assert.match(migration, /payout\.approved_two_person/i);
assert.match(migration, /One-step payout approval is disabled/i,
  "legacy one-step RPC must fail closed");
assert.match(migration, /REVOKE ALL ON FUNCTION public\.request_commission_payout_approval\(uuid, text\) FROM PUBLIC, anon/i);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.approve_commission_payout_approval\(uuid, text\) FROM PUBLIC, anon/i);

console.log("MFA and two-person payout approval contract checks passed.");

#!/usr/bin/env node

/**
 * Static regression checks for payout balance reservation and settlement.
 * Does not connect to Production or create payout/test data.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migrationPath = "supabase/migrations/20261027204414_secure_commission_payout_reservation.sql";
const migration = readFileSync(migrationPath, "utf8");

assert.match(migration, /ADD COLUMN IF NOT EXISTS paid_amount numeric\(12,2\) NOT NULL DEFAULT 0/i,
  "commission rows must track partial paid amounts");
assert.match(migration, /CHECK \(paid_amount >= 0 AND paid_amount <= amount\)/i,
  "paid amounts must stay within commission bounds");
assert.match(migration, /request_commission_payout\(p_amount numeric, p_method text\)/i);
assert.match(migration, /from public\.profiles[\s\S]*?where id = uid[\s\S]*?for update/i,
  "payout requests must serialize on the reseller profile row");
assert.match(migration, /sum\(rc\.amount - rc\.paid_amount\)/i,
  "available balance must exclude already-paid portions");
assert.match(migration, /from public\.commission_payouts[\s\S]*?status IN \('requested', 'approved'\)/i,
  "requested and approved payouts must reserve balance");
assert.match(migration, /p_amount::text IN \('NaN', 'Infinity', '-Infinity'\)/i,
  "non-finite payout amounts must be rejected");
assert.match(migration, /p_amount <> round\(p_amount, 2\)/i,
  "payout amount must use two-decimal currency precision");
assert.match(migration, /revoke all privileges on function public\.request_commission_payout\(numeric, text\) from public, anon/i);
assert.match(migration, /grant execute on function public\.request_commission_payout\(numeric, text\) to authenticated, service_role/i);

assert.match(migration, /complete_commission_payout\(p_payout_id uuid, p_payment_reference text\)/i);
assert.match(migration, /p\.status <> 'approved'/i,
  "settlement must require separate approval");
assert.match(migration, /Payout must be separately approved before payment/i);
assert.match(migration, /from public\.profiles[\s\S]*?where id = p\.reseller_id[\s\S]*?for update/i,
  "settlement must serialize per reseller");
assert.match(migration, /allocation := least\(c\.amount - c\.paid_amount, remaining\)/i,
  "settlement must safely allocate partial commission amounts");
assert.match(migration, /status = CASE WHEN paid_amount \+ allocation >= amount THEN 'paid' ELSE 'approved' END/i,
  "commission status must reflect partial versus full payment");
assert.match(migration, /payment_reference = btrim\(p_payment_reference\)/i,
  "settlement must record a normalized payment reference");
assert.match(migration, /revoke all privileges on function public\.complete_commission_payout\(uuid, text\) from public, anon/i);

console.log("Reseller payout reservation and settlement regression checks passed.");

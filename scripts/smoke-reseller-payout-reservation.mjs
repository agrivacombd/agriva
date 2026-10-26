#!/usr/bin/env node

/**
 * Static regression checks for payout balance reservation.
 * Does not connect to Production or create payout/test data.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migrationPath = "supabase/migrations/20261027180000_reserve_reseller_payout_balance.sql";
const migration = readFileSync(migrationPath, "utf8");

assert.match(migration, /request_commission_payout\(p_amount numeric, p_method text\)/i);
assert.match(migration, /from public\.profiles[\s\S]*?where id = uid[\s\S]*?for update/i,
  "payout requests must serialize on the reseller profile row");
assert.match(migration, /from public\.reseller_commissions[\s\S]*?status = 'approved'/i,
  "available balance must include only approved commissions");
assert.match(migration, /from public\.commission_payouts[\s\S]*?status in \('requested', 'approved'\)/i,
  "requested and approved payouts must reserve balance");
assert.match(migration, /available := available - reserved/i,
  "reserved payout amounts must be deducted from available balance");
assert.match(migration, /p_amount <> round\(p_amount, 2\)/i,
  "payout amount must use two-decimal currency precision");
assert.match(migration, /revoke all privileges on function public\.request_commission_payout\(numeric, text\) from public/i);
assert.match(migration, /revoke all privileges on function public\.request_commission_payout\(numeric, text\) from anon/i);
assert.match(migration, /grant execute on function public\.request_commission_payout\(numeric, text\) to authenticated, service_role/i);

console.log("Reseller payout balance reservation regression checks passed.");

const settlementPath = "supabase/migrations/20261027200000_fix_partial_commission_payout_settlement.sql";
const settlement = readFileSync(settlementPath, "utf8");
assert.match(settlement, /ADD COLUMN IF NOT EXISTS paid_amount numeric\(12,2\) NOT NULL DEFAULT 0/i,
  "commission rows must track partial paid amounts");
assert.match(settlement, /CHECK \(paid_amount >= 0 AND paid_amount <= amount\)/i,
  "paid amounts must stay within commission bounds");
assert.match(settlement, /sum\(rc\.amount - rc\.paid_amount\)/i,
  "available balance must exclude already-paid portions");
assert.match(settlement, /allocation := least\(c\.amount - c\.paid_amount, remaining\)/i,
  "settlement must allocate partial commission amounts safely");
assert.match(settlement, /p\.status <> 'approved'/i,
  "payout settlement must require separate approval");
assert.match(settlement, /Payout must be separately approved before payment/i);
assert.match(settlement, /status = 'approved'[\s\S]*?paid_amount < amount/i,
  "only outstanding approved commissions may be allocated");
assert.match(settlement, /payment_reference = btrim\(p_payment_reference\)/i,
  "settlement must record a normalized payment reference");

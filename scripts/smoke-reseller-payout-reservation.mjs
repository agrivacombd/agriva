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

#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migrationPath = "supabase/migrations/20261028173000_guard_product_insert_status.sql";
const migration = readFileSync(migrationPath, "utf8");

// The trigger must cover both insert and update paths. An UPDATE-only guard
// leaves a direct authenticated INSERT with status='active' unprotected.
assert.match(migration, /CREATE\s+TRIGGER\s+products_guard_status_change\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.products/i,
  "product moderation trigger must run on INSERT and UPDATE");
assert.match(migration, /auth\.uid\(\)\s+IS\s+NOT\s+NULL\s+AND\s+NOT\s+public\.is_admin\(\)/i,
  "guard must restrict authenticated non-admin users");
assert.match(migration, /tg_op\s*=\s*'INSERT'[\s\S]*?new\.status\s+IS\s+DISTINCT\s+FROM\s+'draft'/i,
  "non-admin INSERT must be limited to draft status");
assert.match(migration, /tg_op\s*=\s*'UPDATE'[\s\S]*?new\.status\s+IS\s+DISTINCT\s+FROM\s+old\.status/i,
  "non-admin UPDATE must reject moderation status changes");
assert.match(migration, /ERRCODE\s*=\s*'42501'/i,
  "unauthorized moderation changes must fail with insufficient_privilege");
assert.match(migration, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.guard_product_status_change\(\)\s+FROM\s+public,\s*anon,\s*authenticated/i,
  "trigger function execution must not be granted directly to client roles");

console.log("Product insert moderation guard regression checks passed.");

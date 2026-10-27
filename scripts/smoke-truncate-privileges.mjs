#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync("supabase/migrations/20261027230000_revoke_client_truncate_privileges.sql", "utf8");
assert.match(migration, /REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated/i);
assert.match(migration, /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public[\s\S]*REVOKE TRUNCATE ON TABLES FROM anon, authenticated/i);

const sql = readFileSync("supabase/tests/security_truncate_privileges.sql", "utf8");
assert.match(sql, /FROM pg_tables\s+WHERE schemaname = 'public'/i);
assert.match(sql, /has_table_privilege\('anon'/i);
assert.match(sql, /has_table_privilege\('authenticated'/i);
assert.match(sql, /pg_default_acl/i);
assert.match(sql, /a\.privilege_type = 'TRUNCATE'/i);

console.log("Client TRUNCATE privilege regression checks passed.");

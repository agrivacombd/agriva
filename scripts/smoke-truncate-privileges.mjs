#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const migration = readFileSync("supabase/migrations/20261027230000_revoke_client_truncate_privileges.sql", "utf8");
assert.match(migration, /REVOKE TRUNCATE ON TABLE public\.buyer_demands FROM anon, authenticated/i);
assert.match(migration, /REVOKE TRUNCATE ON TABLE public\.transport_bookings FROM anon, authenticated/i);

const sql = readFileSync("supabase/tests/security_truncate_privileges.sql", "utf8");
for (const role of ["anon", "authenticated"]) {
  for (const table of ["buyer_demands", "transport_bookings"]) {
    assert.match(sql, new RegExp("has_table_privilege\\('" + role + "', 'public\\." + table + "', 'TRUNCATE'\\)"), `missing privilege assertion for ${role} on ${table}`);
  }
}
console.log("Client TRUNCATE privilege regression checks passed.");

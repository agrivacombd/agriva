#!/usr/bin/env node

/**
 * Static regression checks for bilingual signup/login and role-based workspaces.
 * Does not connect to Supabase or create user accounts.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const signup = read("app/signup/page.tsx");
const login = read("app/login/page.tsx");
const dashboard = read("app/dashboard/page.tsx");
const callback = read("app/auth/callback/route.ts");
const enumMigration = read("supabase/migrations/20261027210000_expand_public_user_roles.sql");
const triggerMigration = read("supabase/migrations/20261027210100_secure_signup_role_assignment.sql");
const profilePrivilegeMigration = read("supabase/migrations/20261027210200_restrict_profile_update_columns.sql");

for (const role of ["farmer", "buyer", "seller", "transport_provider", "student", "agronomist", "gardener", "reseller"]) {
  assert.match(signup, new RegExp('id: "' + role + '"'), "signup should offer " + role);
  assert.match(dashboard, new RegExp("\\b" + role + "\\b"), "dashboard should support " + role);
}
assert.doesNotMatch(signup, /id: "admin"/, "admin must not be a self-service signup option");
assert.match(signup, /emailRedirectTo/);
assert.match(signup, /data: \{ role, full_name: fullName\.trim\(\), phone: phone\.trim\(\) \}/);
assert.match(signup, /accepted/);
assert.match(signup, /minLength=\{8\}/);
assert.match(login, /signInWithPassword/);
assert.match(login, /href="\/forgot-password"/);
assert.match(callback, /safeNextPath/);
assert.match(callback, /!value\.startsWith\("\/\/"\)/, "callback must reject protocol-relative redirects");
assert.match(enumMigration, /ADD VALUE IF NOT EXISTS 'buyer'/);
assert.match(enumMigration, /ADD VALUE IF NOT EXISTS 'agronomist'/);
assert.match(triggerMigration, /requested_role IN \([\s\S]*?'agronomist'[\s\S]*?'reseller'[\s\S]*?\)/);
assert.doesNotMatch(triggerMigration, /'admin'\s*\)/, "public signup must not grant admin");
assert.match(triggerMigration, /ELSE\s+safe_role := 'farmer'/);
assert.match(profilePrivilegeMigration, /REVOKE UPDATE ON TABLE public\.profiles FROM PUBLIC, anon, authenticated/i);
assert.match(profilePrivilegeMigration, /REVOKE UPDATE \(id, full_name, phone, role, created_at, updated_at\)/i);
assert.match(profilePrivilegeMigration, /GRANT UPDATE \(full_name, phone\) ON TABLE public\.profiles TO authenticated/i);
assert.match(dashboard, /from\("profiles"\)\.select\("full_name, role"\)/);
assert.match(dashboard, /Object\.prototype\.hasOwnProperty\.call\(roleInfo, profileRole\)/);

console.log("Role-based auth and dashboard regression checks passed.");

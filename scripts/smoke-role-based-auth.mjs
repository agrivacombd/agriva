#!/usr/bin/env node

/**
 * Static regression checks for bilingual signup/login and multi-role workspaces.
 * Does not connect to Supabase or create user accounts.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(path, "utf8");
const signup = read("app/signup/page.tsx");
const login = read("app/login/page.tsx");
const dashboard = read("app/dashboard/page.tsx");
const profile = read("app/profile/page.tsx");
const callback = read("app/auth/callback/route.ts");
const enumMigration = read("supabase/migrations/20261027212516_expand_public_user_roles.sql");
const triggerMigration = read("supabase/migrations/20261027212523_secure_signup_role_assignment.sql");
const profilePrivilegeMigration = read("supabase/migrations/20261027212454_restrict_profile_update_columns.sql");
const multiRoleMigration = read("supabase/migrations/20261028193000_signup_multi_role_memberships.sql");
const roleMembershipFix = read("supabase/migrations/20261028220000_preserve_non_self_service_role_memberships.sql");

for (const role of ["farmer", "buyer", "seller", "transport", "job_seeker", "employer", "student", "agriculturist", "rooftop_gardener"]) {
  assert.match(signup, new RegExp('id: "' + role + '"'), "signup should offer " + role);
  assert.match(dashboard, new RegExp("\\b" + role + "\\b"), "dashboard should support " + role);
}
assert.doesNotMatch(signup, /id: "admin"/, "admin must not be a self-service signup option");
assert.match(signup, /emailRedirectTo/);
assert.match(signup, /data: \{ full_name: fullName\.trim\(\), selected_roles: selectedRoles \}/);
assert.match(signup, /acceptedTerms/);
assert.match(signup, /minLength=\{8\}/);
assert.match(login, /signInWithPassword/);
assert.match(login, /href="\/forgot-password"/);
assert.match(login, /nextPath\.startsWith\("\/\/"\)/, "login must reject protocol-relative redirects");
assert.match(callback, /safeNextPath/);
assert.match(callback, /!value\.startsWith\("\/\/"\)/, "callback must reject protocol-relative redirects");
assert.match(enumMigration, /ADD VALUE IF NOT EXISTS 'buyer'/);
assert.match(enumMigration, /ADD VALUE IF NOT EXISTS 'agronomist'/);
assert.match(triggerMigration, /requested_role IN \([\s\S]*?'agronomist'[\s\S]*?'reseller'[\s\S]*?\)/);
assert.doesNotMatch(triggerMigration, /'admin'\s*\)/, "legacy public signup must not grant admin");
assert.match(triggerMigration, /ELSE\s+safe_role := 'farmer'/);
assert.match(profilePrivilegeMigration, /REVOKE UPDATE ON TABLE public\.profiles FROM PUBLIC, anon, authenticated/i);
assert.match(profilePrivilegeMigration, /REVOKE UPDATE \(id, full_name, phone, role, created_at, updated_at\)/i);
assert.match(profilePrivilegeMigration, /GRANT UPDATE \(full_name, phone\) ON TABLE public\.profiles TO authenticated/i);
assert.match(dashboard, /from\("profiles"\)\.select\("full_name, role"\)/);
assert.match(dashboard, /user_role_memberships/);
assert.match(dashboard, /\n  transport: \{ bn: "পরিবহন সেবাদাতা"/, "dashboard must render the signup transport role");
assert.match(profile, /update_my_role_memberships/);
assert.match(multiRoleMigration, /selected_roles/);
assert.match(multiRoleMigration, /update_my_role_memberships/);
assert.match(multiRoleMigration, /role <> 'admin'/, "original migration preserves admin membership");
assert.match(roleMembershipFix, /role = ANY\(v_allowed\)/, "role updates should replace only self-service memberships");
assert.doesNotMatch(roleMembershipFix, /role <> 'admin'/, "role updates must not delete every non-admin membership");
assert.doesNotMatch(multiRoleMigration, /'admin',\s*'buyer'/, "admin must not be in the self-service allow-list");

console.log("Role-based auth and dashboard regression checks passed.");

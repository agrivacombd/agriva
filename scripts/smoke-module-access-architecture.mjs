#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const migration = readFileSync("supabase/migrations/20261030100000_module_access_foundation.sql", "utf8");
const moduleAccess = readFileSync("lib/authz/module-access.ts", "utf8");
const adminAccess = readFileSync("lib/admin/permission-service.ts", "utf8");
for (const table of ["module_access_applications","user_module_grants","organizations","organization_members","farmer_profiles","farm_members","admin_roles","admin_role_permissions","admin_user_roles"]) {
 assert.match(migration,new RegExp("create table if not exists public\\."+table),table+" must exist");
 assert.match(migration,new RegExp("alter table public\\."+table+" enable row level security"),table+" must have RLS");
}
assert.match(migration,/g\.user_id = auth\.uid\(\)/,"grant principal must come from auth.uid()");
assert.match(migration,/g\.status = 'active'/,"only active grants authorize");
assert.match(migration,/g\.expires_at is null or g\.expires_at > now\(\)/,"expired grants denied");
assert.match(migration,/status = 'pending' and reviewed_by is null and reviewed_at is null/,"self-submitted applications cannot self-approve");
assert.match(migration,/user_module_grants_select[\s\S]*?using \(user_id = \(select auth\.uid\(\)\) or public\.is_admin\(\)\)/,"users only read own grants");
assert.doesNotMatch(migration,/create policy user_module_grants_.*for insert/i,"users cannot self-issue grants");
assert.match(migration,/set search_path = pg_catalog, public, pg_temp/i,"security definer search_path pinned");
assert.match(migration,/revoke truncate,references,trigger[\\s\\S]*?from authenticated/i,"new tables must not inherit client TRUNCATE privileges");
assert.match(migration,/module_access_applicant_type_matches_module/,"application identity must match requested module");
assert.match(migration,/marketplace_application_requires_organization/,"marketplace seller approval must be tied to an organization");
assert.match(migration,/public\.owns_organization\(organization_id\)/,"organization application must be owned by applicant");
assert.match(migration,/admin_review_module_application/,"admin review must be performed through a controlled RPC");
assert.match(migration,/set status = 'verified'/,"marketplace approval must verify the organization");
assert.match(migration,/public\.is_organization_member\(id\)/,"organization RLS must use a non-recursive helper");
assert.match(migration,/public\.owns_farm\(farm_id\)/,"farm RLS must use an owner helper");
assert.match(moduleAccess,/supabase\.auth\.getUser\(\)/,"server helper authenticates session");
assert.match(moduleAccess,/supabase\.rpc\("has_module_access"/,"module authorization uses DB grant check");
assert.doesNotMatch(moduleAccess,/p_user_id|body\.userId/,"caller cannot nominate authorized user");
assert.match(adminAccess,/supabase\.rpc\("has_admin_permission"/,"admin helper checks delegated capability");
assert.doesNotMatch(adminAccess,/profiles.*role.*admin/,"no implicit legacy admin privilege inheritance");
console.log("AGRIVA module-access architecture regression checks passed.");

#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const capabilities = readFileSync("lib/admin/capabilities.ts", "utf8");
const authz = readFileSync("lib/admin/authz.ts", "utf8");
const layout = readFileSync("app/admin/layout.tsx", "utf8");
const productsRoute = readFileSync("app/api/admin/products/route.ts", "utf8");

assert.match(capabilities, /export type AdminCapability/);
assert.match(capabilities, /admin: ADMIN_CAPABILITIES/, "legacy admin compatibility must be explicit");
assert.match(capabilities, /return false/, "unknown roles must fail closed");
assert.match(authz, /supabase\.auth\.getUser\(\)/, "authorization must verify the session server-side");
assert.match(authz, /profileError \|\| !profile \|\| !roleHasAdminCapability/, "profile lookup errors and unknown capabilities must deny access");
assert.match(authz, /status: 401/);
assert.match(authz, /status: 403/);
assert.match(layout, /requireAdminCapability\("dashboard\.read"\)/, "admin layout must use shared capability guard");
assert.match(productsRoute, /requireAdminCapability\("catalog\.create"\)/, "admin product API must authorize independently");
assert.doesNotMatch(layout, /profiles.*select\("role"\)/, "layout must not duplicate role-query logic");
assert.doesNotMatch(productsRoute, /profiles.*select\("role"\)/, "API must not duplicate role-query logic");
console.log("Admin capability authorization foundation regression checks passed.");

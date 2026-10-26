#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => {
  assert.ok(existsSync(path), `Required security file is missing: ${path}`);
  return readFileSync(path, "utf8");
};

const layout = read("app/admin/layout.tsx");
assert.match(layout, /supabase\.auth\.getUser\(\)/, "admin layout must verify the server-side session");
assert.match(layout, /authError\s*\|\|\s*!user/, "admin layout must fail closed on auth errors");
assert.match(layout, /profileError\s*\|\|\s*profile\?\.role\s*!==\s*"admin"/, "admin layout must fail closed on profile lookup errors and non-admin roles");

for (const path of [
  "app/api/admin/article/generate/route.ts",
  "app/api/admin/content-brief/route.ts",
  "app/api/admin/content-drafts/generate/route.ts",
  "app/api/admin/content-opportunities/route.ts",
  "app/admin/content-drafts/publish/route.ts",
  "app/admin/reports/orders.csv/route.ts",
]) {
  const source = read(path);
  assert.match(source, /auth\.getUser\(\)/, `${path} must verify a server-side session`);
  assert.match(source, /profiles/, `${path} must verify the user's profile role`);
  assert.match(source, /role/, `${path} must check a role`);
}

for (const path of [
  "app/admin/categories/page.tsx",
  "app/admin/harvest/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/settings/page.tsx",
]) {
  const source = read(path);
  assert.match(source, /"use server"/, `${path} expected to contain server actions`);
  assert.match(source, /requireAdmin\(/, `${path} server actions must call a server-side admin guard`);
}

console.log("Admin route and Server Action authorization regression checks passed.");

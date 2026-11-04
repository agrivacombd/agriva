#!/usr/bin/env node
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const createForm = readFileSync("components/admin/AdminCreateProductForm.tsx", "utf8");
const adminPage = readFileSync("app/admin/products/page.tsx", "utf8");
const api = readFileSync("app/api/admin/products/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261105120000_admin_marketplace_product_slug.sql", "utf8");

assert.match(createForm, /Product URL Slug/, "admin create form must expose a product slug field");
assert.match(createForm, /slugify\(/, "new product slug should be suggested from its name");
assert.match(adminPage, /name,slug,description/, "admin product query must load stored slugs");
assert.match(adminPage, /name="slug"/, "admin edit form must allow slug changes");
assert.match(adminPage, /p_slug:\s*slug/, "admin update RPC must receive the slug");
assert.match(api, /p_slug:\s*slug/, "admin create RPC must receive the slug");
assert.match(api, /23505/, "duplicate slugs must produce a clear validation message");
assert.match(migration, /Product slug must be lowercase kebab-case/, "database must validate slug format");
assert.match(migration, /Product slug already exists/, "database must reject duplicate slugs");
assert.match(migration, /admin_audit_log/, "slug changes must be audited");
console.log("Admin marketplace product slug regression checks passed.");

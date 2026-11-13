#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import ts from "typescript";

const source = readFileSync("lib/search/public-catalog-config.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleRef = { exports: {} };
new Function("module", "exports", "process", transpiled)(moduleRef, moduleRef.exports, { env: {} });
const { resolvePublicCatalogConfig } = moduleRef.exports;

const url = "https://example.supabase.co";
assert.equal(resolvePublicCatalogConfig({}), null);
assert.equal(resolvePublicCatalogConfig({ NEXT_PUBLIC_SUPABASE_URL: url }), null);
assert.equal(resolvePublicCatalogConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key" }), null);
assert.deepEqual(resolvePublicCatalogConfig({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" }), { url, key: "anon" });
assert.deepEqual(resolvePublicCatalogConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: "publishable" }), { url, key: "publishable" });
assert.deepEqual(resolvePublicCatalogConfig({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable" }), { url, key: "publishable" });
assert.equal(resolvePublicCatalogConfig({ SUPABASE_URL: "http://example.supabase.co", SUPABASE_ANON_KEY: "anon" }), null);
assert.equal(resolvePublicCatalogConfig({ SUPABASE_URL: "https://name:pass@example.supabase.co", SUPABASE_ANON_KEY: "anon" }), null);
assert.equal(resolvePublicCatalogConfig({ SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: "privileged" }), null);
assert.equal(resolvePublicCatalogConfig({ SUPABASE_URL: url, SUPABASE_SECRET_KEY: "privileged" }), null);

const visual = readFileSync("app/api/search/visual-index/route.ts", "utf8");
const search = readFileSync("app/api/search/route.ts", "utf8");
assert.match(visual, /resolvePublicCatalogConfig\(\)/);
assert.match(visual, /VISUAL_SEARCH_MISSING_CONFIG/);
assert.match(visual, /Cache-Control.*no-store/);
assert.match(search, /resolvePublicCatalogConfig\(\)/);
console.log("AGRIVA safe public visual-search config tests passed.");

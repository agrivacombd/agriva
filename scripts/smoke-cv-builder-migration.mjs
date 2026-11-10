import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const types = read("../lib/jobs/cv/types.ts");
const migration = read("../lib/jobs/cv/migration.ts");
const storage = read("../lib/jobs/cv/storage.ts");

assert.ok(types.includes('CV_STORAGE_KEY = "agriva-cv-v1"'));
assert.ok(types.includes("schemaVersion: 2"));
assert.ok(migration.includes("migrateLegacyCV"));
assert.ok(migration.includes("toEntries(legacy.experience"));
assert.ok(migration.includes("toEntries(legacy.education"));
assert.ok(migration.includes("migrateStoredEnvelope"));
assert.ok(storage.includes("migrateStoredEnvelope(parsed)"));
assert.ok(storage.includes("JSON.stringify"));
assert.ok(storage.includes("catch"));

console.log("CV Builder migration architecture checks passed.");

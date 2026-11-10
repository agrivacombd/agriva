import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const types = read("../lib/jobs/cv/types.ts");
const migration = read("../lib/jobs/cv/migration.ts");
const storage = read("../lib/jobs/cv/storage.ts");

assert.ok(types.includes('CV_STORAGE_KEY = "agriva-cv-v1"'));
assert.ok(types.includes("schemaVersion: 3"));
assert.ok(migration.includes("migrateLegacyCV"));
assert.ok(migration.includes("toEntries(legacy.experience"));
assert.ok(migration.includes("toEntries(legacy.education"));
assert.ok(types.includes("CVExperienceEntry") && types.includes("CVEducationEntry"));
assert.ok(migration.includes("envelope.schemaVersion === 2"), "schema v2 records should remain migratable");
assert.ok(migration.includes("description: entry.content") && migration.includes("degree: entry.content"), "legacy work and education text must be preserved");
assert.ok(migration.includes("migrateStoredEnvelope"));
assert.ok(storage.includes("migrateStoredEnvelope(parsed)"));
assert.ok(storage.includes("JSON.stringify"));
assert.ok(storage.includes("catch"));

console.log("CV Builder migration architecture checks passed.");

const client = readFileSync(new URL("../components/jobs/CVBuilderClient.tsx", import.meta.url), "utf8");
assert.ok(client.includes("max-w-[794px]") && client.includes("min-h-[1123px]"), "screen preview should use A4 portrait proportions");
assert.ok(client.includes("size: A4; margin: 10mm;"), "print output should declare A4 paper size");
assert.ok(client.includes("width: 190mm") && client.includes("overflow: visible"), "print layout should allow natural multi-page flow");
assert.ok(client.includes("break-inside: avoid-page"), "CV sections should avoid splitting across pages where possible");
console.log("CV Builder A4 print layout checks passed.");

assert.ok(client.includes("Add experience") && client.includes("Add education"), "structured repeatable work and education forms should be available");
assert.ok(client.includes("Responsibilities / description") && client.includes("Achievements"), "work entries should capture responsibilities and achievements");
assert.ok(client.includes("Degree / qualification") && client.includes("Institution"), "education entries should capture qualification and institution");
console.log("CV Builder structured records checks passed.");

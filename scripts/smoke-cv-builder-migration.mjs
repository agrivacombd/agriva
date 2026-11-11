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
assert.ok(client.includes("size: A4;") && client.includes("margin: 12mm 10mm 16mm;"), "print output should declare A4 paper size and explicit margins");
assert.ok(client.includes("width: 190mm") && client.includes("overflow: visible"), "print layout should allow natural multi-page flow");
assert.ok(client.includes("break-inside: avoid-page"), "CV sections should avoid splitting across pages where possible");
console.log("CV Builder A4 print layout checks passed.");

assert.ok(client.includes("Add experience") && client.includes("Add education"), "structured repeatable work and education forms should be available");
assert.ok(client.includes("Responsibilities / description") && client.includes("Achievements"), "work entries should capture responsibilities and achievements");
assert.ok(client.includes("Degree / qualification") && client.includes("Institution"), "education entries should capture qualification and institution");
console.log("CV Builder structured records checks passed.");

assert.ok(client.includes("CVExperiencePreview") && client.includes("CVEducationPreview"), "CV preview should render structured records");
assert.ok(client.includes("entry.jobTitle") && client.includes("entry.company") && client.includes("entry.achievements"), "experience preview should display structured fields");
assert.ok(client.includes("entry.degree") && client.includes("entry.institution"), "education preview should display structured fields");
assert.ok(client.includes("break-inside-avoid-page"), "individual CV records should avoid page splits");
console.log("CV Builder structured preview checks passed.");

assert.ok(client.includes("navigator.share") && client.includes("navigator.clipboard"), "share should use native share API with clipboard fallback");
assert.ok(client.includes("window.print()"), "PDF export should use the browser print pipeline");
assert.ok(client.includes("does not attach a PDF file"), "text sharing must clearly disclose that it does not attach the PDF");
console.log("CV Builder export and share checks passed.");

assert.ok(client.includes('counter(page)') && client.includes('counter(pages)'), "print pages should expose page numbering where supported");
assert.ok(client.includes("Noto Sans Bengali") && client.includes("Hind Siliguri"), "CV should provide Bengali-capable font fallbacks");
assert.ok(client.includes("#cv-preview article { break-inside: avoid-page"), "individual experience and education records should stay together when possible");
assert.ok(client.includes("#cv-preview > div { display: block !important"), "multi-column templates should become a single-column print layout");
assert.ok(client.includes("orphans: 3") && client.includes("widows: 3"), "print paragraphs should avoid isolated lines");
console.log("CV Builder pagination and print typography checks passed.");

const insights = readFileSync(new URL("../components/jobs/CVInsights.tsx", import.meta.url), "utf8");
assert.ok(insights.includes("workEntries.some") && insights.includes("educationEntries.some"), "quality checks should inspect structured CV records");
assert.ok(insights.includes("invalidDateEntries") && insights.includes("end < start"), "quality checks should flag reversed work dates");
assert.ok(insights.includes("achievement") && insights.includes("education-detail"), "quality checks should assess achievements and education details");
assert.ok(client.includes("workEntries={workEntries}") && client.includes("educationEntries={educationEntries}"), "structured records should feed the quality checker");
console.log("CV Builder quality checker checks passed.");

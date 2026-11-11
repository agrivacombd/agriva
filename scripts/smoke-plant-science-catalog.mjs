import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const data = read("../app/learn/plant-science/plants.ts");
const client = read("../app/learn/plant-science/PlantScienceClient.tsx");

const records = [...data.matchAll(/\{bn:"([^"]*)",en:"([^"]*)",scientific:"([^"]*)",family:"([^"]*)",group:"([^"]*)",clue:"([^"]*)"\}/g)];
const scientificNames = records.map((record) => record[3].trim().toLowerCase());
const slugs = scientificNames.map((name) => name.replace(/×/g, " x ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
const duplicateNames = scientificNames.filter((name, index) => scientificNames.indexOf(name) !== index);
const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);

assert.ok(records.length >= 1905, "catalogue must not regress below the current reviewed baseline");
assert.equal(new Set(scientificNames).size, records.length, "scientific-name exact duplicates detected");
assert.equal(duplicateNames.length, 0);
assert.equal(duplicateSlugs.length, 0, "scientific-name URL slug collisions detected");
assert.ok(records.every((record) => record.slice(1).every((value) => value.trim().length > 0)), "every record must have names, family, group and source note");
assert.ok(records.every((record) => /^(?:[A-Z]|×\s*[A-Z])/.test(record[3])), "scientific name must begin with a capitalized taxon name");
assert.ok(data.includes('taxonomicReviewStatus: "pending"'), "unreviewed taxonomic status must remain explicit");
assert.ok(client.includes('from "./plants"'), "interactive page must consume the shared catalogue module");

console.log(`Plant-science catalogue checks passed: ${records.length} records, ${new Set(scientificNames).size} unique exact names, no slug collisions.`);

const sourceRegistry = read("../app/learn/plant-science/sources.ts");
assert.ok(sourceRegistry.includes('id: "cvpb-2026"'), "CVPB reference must be registered");
assert.ok(sourceRegistry.includes('id: "powo-wcvp"'), "Kew taxonomy backbone must be registered");
assert.ok(sourceRegistry.includes('id: "bnh-specimens"'), "BNH specimen evidence source must be registered");
assert.ok(sourceRegistry.includes("Global taxonomy or distribution alone does not establish occurrence in Bangladesh."), "global taxonomy must not be conflated with Bangladesh occurrence");
assert.ok(sourceRegistry.includes("Treat as a preliminary conference abstract"), "preliminary checklist totals must be qualified");

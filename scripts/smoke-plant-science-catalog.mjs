import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const data = read("../app/learn/plant-science/plants.ts");
const client = read("../app/learn/plant-science/PlantScienceClient.tsx");

const records = [...data.matchAll(/\{bn:"([^"]*)",en:"([^"]*)",scientific:"([^"]*)",family:"([^"]*)",group:"([^"]*)",clue:"([^"]*)"\}/g)];
const scientificNames = records.map((record) => record[3].trim().toLowerCase());
const slugs = scientificNames.map((name) => name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
const duplicateNames = scientificNames.filter((name, index) => scientificNames.indexOf(name) !== index);
const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);

assert.equal(records.length, 1905, "catalogue record count changed; update the reviewed baseline intentionally");
assert.equal(new Set(scientificNames).size, records.length, "scientific-name exact duplicates detected");
assert.equal(duplicateNames.length, 0);
assert.equal(duplicateSlugs.length, 0, "scientific-name URL slug collisions detected");
assert.ok(records.every((record) => record.slice(1).every((value) => value.trim().length > 0)), "every record must have names, family, group and source note");
assert.ok(records.every((record) => /^[A-Z][a-z-]+\s+[a-z][a-z-]+/.test(record[3])), "scientific name should have at least genus and epithet");
assert.ok(data.includes('taxonomicReviewStatus: "pending"'), "unreviewed taxonomic status must remain explicit");
assert.ok(client.includes('from "./plants"'), "interactive page must consume the shared catalogue module");

console.log(`Plant-science catalogue checks passed: ${records.length} records, ${new Set(scientificNames).size} unique exact names, no slug collisions.`);

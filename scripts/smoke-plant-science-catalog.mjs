import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/learn/plant-science/page.tsx", "utf8");
const lines = source.split("\n").filter((line) => /^\s*\{bn:/.test(line));
const entries = lines.map((line, index) => {
  const match = line.match(/^\s*\{bn:("(?:\\.|[^"\\])*"),en:("(?:\\.|[^"\\])*"),scientific:("(?:\\.|[^"\\])*"),family:("(?:\\.|[^"\\])*"),group:("(?:\\.|[^"\\])*"),clue:("(?:\\.|[^"\\])*")\},?$/);
  assert.ok(match, `Plant record ${index + 1} should follow the complete catalog schema`);
  return {
    bn: JSON.parse(match[1]),
    en: JSON.parse(match[2]),
    scientific: JSON.parse(match[3]),
    family: JSON.parse(match[4]),
    group: JSON.parse(match[5]),
    clue: JSON.parse(match[6]),
  };
});

assert.equal(entries.length, 500, "Plant Science Academy must contain exactly 500 plants");
for (const field of ["bn", "en", "scientific", "family", "group", "clue"]) {
  assert.ok(entries.every((entry) => typeof entry[field] === "string" && entry[field].trim()), `Every plant must have a non-empty ${field}`);
}
const normalizedNames = entries.map((entry) => entry.scientific.trim().toLocaleLowerCase("en"));
assert.equal(new Set(normalizedNames).size, entries.length, "Scientific names must be unique");
const groups = new Set(entries.map((entry) => entry.group));
for (const expected of ["Cereal crop", "Pulse crop", "Oilseed crop", "Vegetable", "Fruit", "Spice", "Medicinal plant", "Mangrove tree", "Bamboo", "Grass and weed"]) {
  assert.ok(groups.has(expected), `Catalog should include Bangladesh-relevant ${expected} records`);
}
assert.ok(!entries.some((entry) => /mushroom|fungus|seaweed|microalga|lichen|moss/i.test(entry.group)), "The catalog should list plants, not fungi or algae");
console.log("Plant Science Academy catalog: 500 complete records, unique scientific names, Bangladesh-focused categories.");

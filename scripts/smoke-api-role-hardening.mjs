#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const reseller = readFileSync("app/api/reseller/links/route.ts", "utf8");
assert.match(reseller, /profile\?\.role !== "reseller"/, "reseller role must be checked before link creation");
assert.match(reseller, /UUID_PATTERN\.test\(productId\)/, "product ID must be validated as UUID");
assert.doesNotMatch(reseller, /error: error\.message/, "database details must not be exposed by reseller link API");

const farmer = readFileSync("app/api/farmer/products/route.ts", "utf8");
assert.match(farmer, /Farmer product creation failed/, "product insert failures must be logged server-side");
assert.match(farmer, /পণ্য সংরক্ষণ করা যায়নি/, "product insert failures must return safe localized message");
assert.doesNotMatch(farmer, /error: error\.message/, "database details must not be exposed by farmer product API");

console.log("API role and error disclosure regression checks passed.");

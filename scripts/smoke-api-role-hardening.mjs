#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const reseller = readFileSync("app/api/reseller/links/route.ts", "utf8");
assert.match(reseller, /profile\?\.role !== "reseller"/, "reseller role must be checked before link creation");
assert.match(reseller, /UUID_PATTERN\.test\(productId\)/, "product ID must be validated as UUID");
assert.doesNotMatch(reseller, /error: error\.message/, "database details must not be exposed by reseller link API");

const seller = readFileSync("app/api/seller/products/route.ts", "utf8");
assert.match(seller, /Seller marketplace product creation failed/, "seller product insert failures must be logged server-side");
assert.match(seller, /পণ্য সংরক্ষণ করা যায়নি/, "product insert failures must return safe localized message");
assert.match(seller, /from\("organizations"\)/, "business seller must be linked to a verified organization");
assert.match(seller, /checkModuleAccess\("marketplace", "create"/, "seller product creation must require an approved Marketplace module grant");
assert.doesNotMatch(seller, /user_role_memberships/, "self-selected signup roles must not authorize Marketplace product creation");
assert.doesNotMatch(seller, /error: error\.message/, "database details must not be exposed by seller product API");

const legacyFarmer = readFileSync("app/api/farmer/products/route.ts", "utf8");
assert.match(legacyFarmer, /status: 410/, "legacy farmer product endpoint must direct farmers to Sell Harvest");

console.log("API role and error disclosure regression checks passed.");

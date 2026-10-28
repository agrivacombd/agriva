#!/usr/bin/env node

/**
 * Ensure the live Marketplace never substitutes demo inventory for real data.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const page = readFileSync("app/marketplace/page.tsx", "utf8");
assert.match(page, /from\("products"\)/, "Marketplace must load real products from the database");
assert.match(page, /\.eq\("status", "active"\)/, "Marketplace must show only publicly active products");
assert.doesNotMatch(page, /moderation_status/, "Marketplace query must match the deployed products schema; moderation_status is not a products column");
assert.doesNotMatch(page, /MARKETPLACE_SAMPLE_PRODUCTS/, "Marketplace must not substitute sample inventory");
assert.doesNotMatch(page, /Preview catalogue/, "Marketplace must not label demo products as live inventory");
assert.match(page, /এখনো কোনো সক্রিয় ও অনুমোদিত পণ্য/, "Marketplace must show an honest empty state when no products exist");

console.log("Marketplace live-inventory regression checks passed.");

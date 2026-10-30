#!/usr/bin/env node
/**
 * Guard Sell My Harvest's no-approval publication contract.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync("components/marketplace/SellHarvestMarketplace.tsx", "utf8");
const adminPage = readFileSync("app/admin/harvest/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20261030150000_remove_harvest_admin_approval.sql", "utf8");

assert.match(page, /image_urls: imageUrls, status: "available"/, "New harvest listings must be inserted as available");
assert.doesNotMatch(page, /moderation_status|অ্যাডমিন অনুমোদন|অনুমোদনের অপেক্ষায়|অনুমোদনের জন্য/, "Public Sell My Harvest UI must not depend on admin approval");
assert.match(page, /পোস্ট প্রকাশিত হয়েছে! এখনই ক্রেতারা এটি দেখতে পারবেন।/, "Seller must be told the listing is immediately public");
assert.match(page, /if \(!mineOnly && item\.status !== "available"\)/, "Public feed visibility must depend only on seller availability");
assert.doesNotMatch(adminPage, /admin_moderate_harvest_listing|name="action"|অনুমোদন|প্রত্যাখ্যান/, "Admin harvest page must be read-only");
assert.match(migration, /moderation_status = 'approved'/, "Legacy listings must be normalized to the published compatibility state");
assert.match(migration, /USING \(status = 'available'\)/, "Public RLS must expose available listings without a moderation gate");
assert.match(migration, /DROP FUNCTION IF EXISTS public\.admin_moderate_harvest_listing/, "Legacy admin approval RPC must be removed");
console.log("Sell My Harvest immediate publication regression checks passed.");

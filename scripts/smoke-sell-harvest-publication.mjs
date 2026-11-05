#!/usr/bin/env node
/**
 * Guard Sell My Harvest's no-approval publication contract and admin moderation boundary.
 * Run against the current main baseline, including marketplace SEO checks.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync("components/marketplace/SellHarvestMarketplace.tsx", "utf8");
const adminPage = readFileSync("app/admin/harvest/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20261030183612_reconcile_harvest_immediate_publication.sql", "utf8");

assert.match(page, /image_urls: imageUrls, status: "available"/, "New harvest listings must be inserted as available");
assert.doesNotMatch(page, /moderation_status|অ্যাডমিন অনুমোদন|অনুমোদনের অপেক্ষায়|অনুমোদনের জন্য/, "Public Sell My Harvest UI must not depend on admin approval");
assert.match(page, /পোস্ট প্রকাশিত হয়েছে! এখনই ক্রেতারা এটি দেখতে পারবেন।/, "Seller must be told the listing is immediately public");
assert.match(page, /if \(!mineOnly && item\.status !== "available"\)/, "Public feed visibility must depend only on seller availability");
assert.match(adminPage, /requireAdminPage\("harvest\.read"\)/, "Admin harvest listing must require the shared read capability");
assert.match(adminPage, /requireAdminPage\("harvest\.moderate"\)/, "Harvest moderation action must require its own capability");
assert.match(adminPage, /admin_moderate_harvest_listing/, "Admin harvest page must use the audited moderation RPC");
assert.match(adminPage, /decision === "reject" && !note/, "Rejecting a harvest listing must require a reason");
assert.match(adminPage, /decision === "pause"/, "Admin must be able to pause an available listing");
assert.match(adminPage, /decision === "approve"/, "Admin must be able to resume an eligible paused listing");
assert.match(adminPage, /listing\.status === "sold_out"/, "Admin UI must prevent sold-out listing reactivation");
assert.match(migration, /moderation_status = 'approved'/, "Legacy listings must be normalized to the published compatibility state");
assert.match(migration, /USING \(status = 'available'\)/, "Public RLS must expose available listings without a moderation gate");
assert.ok(migration.includes("IF NOT NEW.contact_phone_public") && migration.includes("NEW.contact_phone := NULL"), "Immediate publication must preserve phone consent privacy");
assert.ok(migration.includes("private.is_admin()"), "Harvest admin policies must use the Production private admin helper");
assert.match(migration, /IF NOT private\.is_admin\(\)/, "Only admins may change moderation state; farmers publish immediately");
assert.match(migration, /CREATE OR REPLACE FUNCTION private\.admin_moderate_harvest_listing/, "Legacy admin UI must retain a compatible visibility RPC");
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.admin_moderate_harvest_listing/, "Public RPC must forward to the compatibility visibility implementation");
assert.match(migration, /harvest_listing\.visibility_changed/, "Admin visibility changes must remain audited");
const ownerUpdatePolicy = migration.split("CREATE POLICY harvest_listings_owner_status_update")[1] ?? "";
assert.match(ownerUpdatePolicy, /moderation_status = 'approved'/, "Owners must not republish listings rejected by admins");
console.log("Sell My Harvest immediate publication and admin moderation regression checks passed.");

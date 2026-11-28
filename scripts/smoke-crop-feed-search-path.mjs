#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const origin = readFileSync("supabase/migrations/20261113020000_crop_feed_stable_slugs.sql", "utf8");
const hardening = readFileSync("supabase/migrations/20261128000000_harden_crop_feed_make_slug_search_path.sql", "utf8");

assert.match(origin, /create or replace function public\.crop_feed_make_slug\s*\(p_crop text,p_disease text,p_id uuid\)/i);
assert.doesNotMatch(origin, /security\s+definer/i);
assert.match(hardening, /alter function public\.crop_feed_make_slug\(text,\s*text,\s*uuid\)/i);
assert.match(hardening, /set search_path = pg_catalog,\s*public,\s*pg_temp/i);
assert.doesNotMatch(hardening, /drop\s+function|security\s+definer|grant\s+execute|revoke\s+execute/i);
console.log("AGRIVA crop-feed slug search_path hardening regression checks passed.");

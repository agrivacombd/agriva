import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261027240000_green_living_platform.sql", "utf8");
const gardenPage = readFileSync("app/garden/page.tsx", "utf8");
const gardenClient = readFileSync("app/garden/GardenClient.tsx", "utf8");
const impactPage = readFileSync("app/impact/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");

for (const table of ["garden_plants", "garden_care_tasks", "garden_activity_logs"]) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}`, "i"), `${table} table must exist`);
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"), `${table} must enable RLS`);
  assert.match(migration, new RegExp(`Owners manage their ${table === "garden_plants" ? "garden plants" : table === "garden_care_tasks" ? "garden care tasks" : "garden activity logs"}`, "i"));
}
assert.match(migration, /constraint garden_plants_id_owner_key unique \(id, owner_id\)/i, "ownership-safe child foreign keys need a composite unique key");
assert.match(migration, /foreign key \(plant_id, owner_id\)/i, "garden tasks/logs must bind child records to the plant owner");
assert.match(migration, /create or replace function public\.get_green_impact_metrics\(\)/i);
assert.match(migration, /security definer[\s\S]*set search_path = ''/i, "aggregate RPC must have a safe search path");
assert.match(migration, /revoke all on function public\.get_green_impact_metrics\(\) from public/i);
assert.match(migration, /grant execute on function public\.get_green_impact_metrics\(\) to anon, authenticated/i);
assert.match(migration, /returns table \([\s\S]*approved_exchange_listings[\s\S]*active_marketplace_products[\s\S]*completed_exchange_requests/i);
assert.match(gardenPage, /redirect\("\/login\?next=%2Fgarden"\)/, "garden page must require authentication");
assert.match(gardenPage, /robots: \{ index: false, follow: true \}/, "private garden must not be indexed");
assert.match(gardenClient, /garden_plants/);
assert.match(gardenClient, /garden_care_tasks/);
assert.match(gardenClient, /completed_at/);
assert.match(gardenClient, /aria-live|role="status"/, "user feedback should be accessible");
assert.match(impactPage, /canonical: "\/impact"/);
assert.match(impactPage, /get_green_impact_metrics/);
assert.match(impactPage, /No inflated impact claims|যাচাইযোগ্য planting record/i);
assert.match(sitemap, /\$\{base\}\/impact/, "public impact page must be in the sitemap");
assert.match(robots, /"\/impact"/, "public impact page must be crawlable");
assert.match(robots, /"\/garden"/, "private garden must be excluded from crawling");
assert.match(dashboard, /href="\/garden"/, "dashboard must expose Personal Garden");
assert.match(dashboard, /href="\/impact"/, "dashboard must expose Green Impact");

console.log("Green Living platform schema, privacy, and SEO smoke tests passed.");

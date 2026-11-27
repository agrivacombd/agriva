import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/20261127040000_marketplace_engagement_notifications.sql");
const center = read("../components/notifications/NotificationCenter.tsx");
const inbox = read("../app/notifications/page.tsx");
const dashboard = read("../app/dashboard/page.tsx");
const harvest = read("../components/marketplace/SellHarvestMarketplace.tsx");
const wholesaler = read("../app/wholesaler/apply/page.tsx");

for (const table of [
  "notifications", "notification_preferences", "push_subscriptions",
  "harvest_listing_inquiries", "bulk_wholesaler_applications",
]) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`), `missing ${table} table`);
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must enable RLS`);
  assert.match(migration, new RegExp(`revoke all on public\\.${table} from anon, authenticated`), `${table} must start with least-privilege grants`);
}

assert.match(migration, /on public\.notifications\(user_id, dedupe_key\) where dedupe_key is not null/);
assert.match(migration, /for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/);
assert.match(migration, /grant update\(read_at\) on public\.notifications to authenticated/);
assert.match(migration, /create schema if not exists private/);
assert.match(migration, /alter publication supabase_realtime add table public\.notifications/);
assert.match(migration, /trg_notify_matching_harvest_demands/);
assert.match(migration, /trg_notify_matching_buyer_demands/);
assert.match(migration, /trg_notify_buyer_demand_response/);
assert.match(migration, /trg_notify_harvest_inquiry/);
assert.match(migration, /trg_notify_bulk_invitation/);
assert.match(migration, /trg_notify_bulk_quote_approved/);
assert.match(migration, /trg_sync_wholesaler_application_approval/);
assert.match(migration, /revoke all on function private\./);
assert.doesNotMatch(migration, /create or replace function public\.[\s\S]{0,300}?security definer/i);

assert.match(center, /postgres_changes/);
assert.match(center, /filter: `user_id=eq\.\$\{userId\}`/);
assert.match(center, /\.eq\("user_id", user\.id\)/);
assert.match(center, /\.update\(\{ read_at: readAt \}\)/);
assert.match(inbox, /postgres_changes/);
assert.match(dashboard, /<NotificationCenter \/>/);
assert.match(dashboard, /\/wholesaler\/apply/);
assert.match(harvest, /harvest_listing_inquiries/);
assert.match(harvest, /trackInquiry\(item, "phone"\)/);
assert.match(harvest, /trackInquiry\(item, "whatsapp"\)/);
assert.match(wholesaler, /status: "pending"/);
assert.doesNotMatch(wholesaler, /status: "approved"/);

console.log("Marketplace engagement schema, RLS, matching triggers, notification inbox and wholesaler approval smoke checks passed.");

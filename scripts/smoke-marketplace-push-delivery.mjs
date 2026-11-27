import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [migration, worker, providerTests, subscribe, unsubscribe, validation, serviceWorker, preferences] = await Promise.all([
  read("supabase/migrations/20261127050000_marketplace_web_push_delivery.sql"),
  read("supabase/functions/push-delivery/index.ts"),
  read("supabase/functions/push-delivery/index.test.ts"),
  read("app/api/push/subscribe/route.ts"),
  read("app/api/push/unsubscribe/route.ts"),
  read("lib/push/validation.ts"),
  read("public/sw.js"),
  read("app/notifications/preferences/page.tsx"),
]);

assert.match(migration, /create table if not exists public\.push_delivery_queue/i);
assert.match(migration, /alter table public\.push_delivery_queue enable row level security/i);
assert.match(migration, /revoke all on public\.push_subscriptions from anon, authenticated/i);
assert.match(migration, /for update skip locked/i);
assert.match(migration, /attempt_count >= 5/i);
assert.match(migration, /\* \* \* \* \*/);
assert.match(migration, /vault\.decrypted_secrets/i);

assert.match(worker, /setVapidDetails/);
assert.match(worker, /sendNotification/);
assert.match(worker, /statusCode === 404 \|\| statusCode === 410/);
assert.match(worker, /claim_push_delivery_batch/);
assert.match(worker, /complete_push_delivery/);
assert.match(worker, /PUSH_DISPATCH_SECRET/);
assert.match(worker, /createPushDeliveryHandler/);
assert.match(worker, /if \(import\.meta\.main\) Deno\.serve\(handler\)/);
assert.match(providerTests, /successful send removes expired 410 endpoint/i);
assert.match(providerTests, /transient provider failure schedules a retry/i);
assert.match(providerTests, /all 404\/410 endpoints are removed/i);
assert.match(providerTests, /invalid dispatch secret/i);

assert.match(subscribe, /sessionClient\.auth\.getUser\(\)/);
assert.match(subscribe, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(subscribe, /isAllowedPushEndpoint\(endpoint\)/);
assert.match(unsubscribe, /sessionClient\.auth\.getUser\(\)/);
assert.match(unsubscribe, /eq\("user_id", user\.id\)/);
assert.match(validation, /url\.protocol !== "https:"/);
assert.match(validation, /fcm\.googleapis\.com/);
assert.match(validation, /push\.services\.mozilla\.com/);

assert.match(preferences, /Notification\.requestPermission\(\)/);
assert.match(preferences, /onClick=\{\(\) => void togglePush\(\)\}/);
assert.match(serviceWorker, /addEventListener\("push"/);
assert.match(serviceWorker, /addEventListener\("notificationclick"/);
assert.match(serviceWorker, /candidate\.origin === self\.location\.origin/);

console.log("Marketplace Web Push delivery security and opt-in smoke checks passed.");

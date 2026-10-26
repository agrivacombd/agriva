import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261027000000_green_exchange.sql", "utf8");
const board = readFileSync("app/green-exchange/board/board-client.tsx", "utf8");
const page = readFileSync("app/green-exchange/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const adminPage = readFileSync("app/admin/green-exchange/page.tsx", "utf8");

assert.match(migration, /alter table public\.green_exchange_listings enable row level security/i);
assert.match(migration, /alter table public\.green_exchange_requests enable row level security/i);
assert.equal(migration.split("as $\nbegin").length - 1, 3, "SQL function bodies must use valid dollar quoting");
assert.equal(migration.split("\n$;\n").length - 1, 3, "SQL function bodies must close dollar quotes");
assert.match(migration, /moderation_status = 'pending'/i, "new user listings must start pending");
assert.match(migration, /revoke all on function public\.admin_moderate_green_exchange_listing\(uuid, text\) from public, anon/i);
assert.match(migration, /where p\.id = auth\.uid\(\) and p\.role = 'admin'/i, "moderation RPC must verify trusted profile role");
assert.match(migration, /revoke all on function public\.respond_green_exchange_request\(uuid, text, text\) from public, anon/i);
assert.match(migration, /l\.owner_id = auth\.uid\(\)/i, "only listing owner may respond to a request");
assert.match(migration, /r\.status = 'pending'/i, "responses must only transition pending requests");
assert.match(board, /moderation_status", "approved"/);
assert.match(board, /green_exchange_requests/);
assert.match(board, /respond_green_exchange_request/);
assert.match(adminPage, /admin_moderate_green_exchange_listing/);
assert.ok(adminPage.includes('profile?.role !== "admin"'), "moderation UI must check the server-side admin role");
assert.match(adminPage, /moderation_status/);
assert.match(board, /বিনিময়ের অনুরোধ দিন/);
assert.match(board, /ব্যক্তিগত ফোন নম্বর বা বাড়ির ঠিকানা পোস্টে লিখবেন না/);
assert.match(page, /FAQPage/);
assert.match(page, /canonical: "\/green-exchange"/);
assert.match(sitemap, /\$\{base\}\/green-exchange/);
assert.match(sitemap, /\\u0980-\\u09ff/, "Bengali listing slugs must be indexable");
assert.match(sitemap, /exchangeListings\.map/);

console.log("Green Exchange security and route smoke tests passed.");

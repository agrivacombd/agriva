import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const sql = read("supabase/migrations/20261113233000_product_behavior_rankings.sql");
const api = read("app/api/product-rank/events/route.ts");
const tracking = read("lib/marketplace/product-rank-tracking.ts");
const core = read("components/marketplace/MarketplaceCore.tsx");
const market = read("app/marketplace/page.tsx");
const plant = read("app/plant-market/page.tsx");
const category = read("app/marketplace/category/[categorySlug]/page.tsx");
const subcategory = read("app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx");
const marketDetail = read("app/marketplace/[productId]/page.tsx");
const plantDetail = read("app/plant-market/[slug]/page.tsx");

for (const fragment of [
  "public.product_rank_events", "create or replace function public.record_product_rank_events",
  "create or replace function public.get_ranked_marketplace_products",
  "create or replace function public.get_ranked_plant_market_products",
  "create or replace function public.prune_product_rank_events",
  "security invoker", "security definer", "status in ('delivered', 'completed')",
  "o.status in ('delivered', 'completed')", "payment_status not in ('failed', 'refunded')",
  "p.marketplace_channel = 'marketplace'", "p.deleted_at is null",
  "where p.status = 'active'", "where market = 'plant-market'",
  "occurred_on >= current_date - 29", "on conflict do nothing",
  "from public.marketplace_orders", "from public.plant_market_orders",
  "from public.plant_market_order_items",
]) assert.ok(sql.includes(fragment), "Missing ranking SQL contract: " + fragment);

assert.match(sql,/revoke all on public\.product_rank_events from public, anon, authenticated;/i);
assert.match(sql,/revoke all on function public\.record_product_rank_events\(text, jsonb, text\)[\s\S]*?from public, anon, authenticated;/i);
assert.match(sql,/grant execute on function public\.record_product_rank_events\(text, jsonb, text\) to service_role;/i);
assert.match(sql,/returns table \([\s\S]*?id uuid, name text, slug text,[\s\S]*?created_at timestamptz/);
assert.doesNotMatch(sql,/returns setof public\.(products|plant_market_products)/i,"Public RPC must not leak private product fields");
assert.match(sql,/primary key \(market, product_id, event_type, viewer_hash, occurred_on\)/);
assert.match(sql,/42 \* ln/,"Completed orders have the highest ranking weight");
assert.match(sql,/greatest\(0::numeric, least\(8::numeric/,"New product exploration is capped");
assert.match(sql,/p\.stock > 0/,"Stock availability influences visibility");
assert.match(api,/SUPABASE_SERVICE_ROLE_KEY/);
assert.match(api,/createHmac\("sha256", key\)/);
assert.match(api,/p_events: events, p_viewer_hash: viewerHash/);
assert.match(api,/payload\.events\.length > 32/);
assert.match(api,/sec-gpc/);
assert.match(api,/request\.headers\.get\("dnt"\)/);
assert.doesNotMatch(api,/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
assert.match(tracking,/keepalive: true/);
assert.match(tracking,/ProductRankEvent = "impression" \| "click"/);
assert.match(core,/IntersectionObserver/);
assert.match(core,/threshold: 0\.5/);
assert.match(core,/data-rank-product-id/);
assert.match(core,/trackProductRankEvents\(productHrefPrefix/);
assert.match(core,/useState<SortOption>\("recommended"\)/);
assert.match(core,/value="newest"/,"Newest must remain available to shoppers");
for (const [label,source,func] of [
  ["market",market,"get_ranked_marketplace_products"],
  ["plant",plant,"get_ranked_plant_market_products"],
  ["category",category,"get_ranked_marketplace_products"],
  ["subcategory",subcategory,"get_ranked_marketplace_products"],
]) assert.ok(source.includes(func),label+" must query ranked listings");
assert.match(marketDetail,/ProductClickTracker market="marketplace" productId=\{product\.id\}/);
assert.match(plantDetail,/ProductClickTracker market="plant-market" productId=\{product\.id\}/);
console.log("Product behaviour ranking and anti-abuse source checks passed.");

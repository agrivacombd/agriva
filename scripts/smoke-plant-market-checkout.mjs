import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261102161752_plant_market_checkout_and_order_lifecycle.sql");
const guestCheckoutMigration = read("supabase/migrations/20261102161707_secure_guest_checkout_identity.sql");
const marketplaceCheckoutMigration = read("supabase/migrations/20261102161719_atomic_marketplace_cart_checkout.sql");
const foreignKeyIndexesMigration = read("supabase/migrations/20261102162807_marketplace_plant_market_fk_indexes.sql");
const cartApi = read("app/api/plant-market/cart/route.ts");
const checkoutApi = read("app/api/plant-market/checkout/route.ts");
const productPage = read("app/plant-market/[slug]/page.tsx");
const cartPage = read("app/plant-market/cart/page.tsx");
const checkoutPage = read("app/plant-market/checkout/page.tsx");
const cartClient = read("components/plant-market/PlantMarketCartClient.tsx");
const checkoutClient = read("components/plant-market/PlantMarketCheckoutClient.tsx");
const sellerOrders = read("app/plant-seller/orders/page.tsx");
const buyerOrders = read("app/plant-market/orders/page.tsx");
const sellerDashboard = read("app/plant-seller/products/page.tsx");
const sql = migration.toLowerCase();
const must = (condition, message) => assert.ok(condition, message);

const checkoutTablePosition = marketplaceCheckoutMigration.indexOf("create table if not exists public.marketplace_checkouts");
const guestTriggerPosition = marketplaceCheckoutMigration.indexOf("create trigger marketplace_checkout_require_guest_buyer");
must(checkoutTablePosition >= 0 && guestTriggerPosition > checkoutTablePosition,
  "Guest buyer trigger must be installed only after marketplace_checkouts exists");
must(!guestCheckoutMigration.includes("public.marketplace_checkouts"),
  "Guest identity migration must not reference a checkout table created by a later migration");
for (const index of [
  "cod_collection_events_collected_by_idx",
  "plant_market_cart_items_product_id_idx",
  "plant_market_order_items_product_id_idx",
]) must(foreignKeyIndexesMigration.includes(index), "Missing foreign-key performance index: " + index);

for (const table of [
  "plant_market_carts",
  "plant_market_cart_items",
  "plant_market_checkouts",
  "plant_market_orders",
  "plant_market_order_items",
]) must(sql.includes("create table if not exists public." + table), "Missing Plant Market table: " + table);

for (const fragment of [
  "plant_market_add_to_cart",
  "plant_market_finalize_checkout",
  "plant_market_set_order_status",
  "pg_advisory_xact_lock",
  "for update of pm",
  "unique(buyer_id,idempotency_key)",
  "set stock=pm.stock-ci.quantity",
  "as $pm$",
  "site_settings where key='cod_enabled' and value='true'",
  "active verified plant market seller access required",
  "revoke all on function public.plant_market_finalize_checkout(jsonb,text) from public,anon",
  "grant execute on function public.plant_market_finalize_checkout(jsonb,text) to authenticated",
  "invalid order status transition",
  "agriva.plant_market_inventory_adjustment",
  "guard_plant_market_product_write",
  "plant_market_cart_item_owner_delete",
]) must(sql.includes(fragment), "Missing SQL safety invariant: " + fragment);

must(!sql.includes("commit;\n then raise exception"), "Migration contains SQL after COMMIT");
must(!sql.includes("marketplace_orders") && !sql.includes("marketplace_checkouts")
  && !sql.includes("public.carts") && !sql.includes("public.cart_items"),
  "Plant Market checkout must not reuse Marketplace cart/order tables");

must(cartApi.includes("plant_market_add_to_cart") && cartApi.includes("plant_market_cart_items") && cartApi.includes("items:data??[]"),
  "Plant Market cart API is not wired to its own tables/RPC or hides unavailable items");
must(checkoutApi.includes("plant_market_finalize_checkout") && checkoutApi.includes("cod_enabled"),
  "Plant Market checkout API is missing its atomic RPC or COD guard");
must(productPage.includes("PlantMarketAddToCart"), "Product page is not connected to Plant Market cart");
must(cartPage.includes("PlantMarketCartClient"), "Plant Market cart page is missing its client");
must(checkoutPage.includes("PlantMarketCheckoutClient"), "Plant Market checkout page is missing its client");
must(cartClient.includes("অর্ডারযোগ্য নয়") && cartClient.includes("PlantMarketCheckoutClient") === false,
  "Unavailable cart products must remain visible and removable");
must(checkoutClient.includes("items.some(item=>item.plant_market_products?.status!==\"active\")"),
  "Checkout must be blocked when an unavailable product remains in the cart");
must(sellerOrders.includes("plant_market_set_order_status") && sellerOrders.includes("plant_market_orders"),
  "Plant Seller order management is not wired to Plant Market orders");
must(buyerOrders.includes('.eq("buyer_id",user.id)'), "Buyer order history is not scoped to the authenticated buyer");
must(sellerDashboard.includes("/plant-seller/orders"), "Plant Seller dashboard has no orders link");

console.log("Plant Market checkout lifecycle static regression checks passed.");

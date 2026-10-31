import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261031120000_separate_marketplace_and_plant_market.sql", "utf8");
const marketplaceApi = readFileSync("app/api/seller/products/route.ts", "utf8");
const marketplacePage = readFileSync("app/seller/products/new/page.tsx", "utf8");
const marketplaceCore = readFileSync("components/marketplace/MarketplaceCore.tsx", "utf8");

assert.match(page, /from\("plant_market_products"\)/, "Plant Market must use its isolated catalogue");
assert.match(page, /\.eq\("status", "active"\)/, "only active approved plant products should appear");
assert.doesNotMatch(page, /from\("products"\)|isPlantProduct|plantTerms/, "Plant Market must not keyword-filter Marketplace inventory");
assert.match(page, /productHrefPrefix="\/plant-market"/, "Plant Market products must link to their own detail route");
assert.match(page, /plant-market\/\$\{encodeURIComponent\(product\.slug\)\}/, "Plant Market ItemList URLs must use Plant Market detail routes");
assert.match(home, /href="\/plant-market"/, "home navigation must expose Plant Market");
assert.match(sitemap, /\$\{base\}\/plant-market/, "Plant Market must be in the sitemap");
assert.match(robots, /"\/plant-market"/, "Plant Market must be crawlable");
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.plant_market_products/, "Plant Market must have a separate product table");
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.marketplace_seller_permissions/, "Marketplace must have a separate seller permission table");
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.plant_seller_permissions/, "Plant Market must have a separate seller permission table");
assert.match(marketplaceApi, /from\("marketplace_seller_permissions"\)/, "Marketplace product API must check Marketplace approval");
assert.match(marketplacePage, /from\("marketplace_seller_permissions"\)/, "Marketplace product form must check Marketplace approval");
assert.match(marketplaceCore, /productHrefPrefix/, "shared catalogue UI must support market-specific detail routes");

console.log("Separate Marketplace and Plant Market smoke checks passed.");

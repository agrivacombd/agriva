import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");

assert.match(page, /from\("products"\)/, "Plant Market must use real product inventory");
assert.match(page, /\.eq\("status", "active"\)/, "only active products should appear");
assert.match(page, /\.eq\("status", "active"\)/, "only publicly active products should appear");
assert.doesNotMatch(page, /moderation_status|category_slug|subcategory_slug/, "queries must match the deployed products schema");
assert.match(page, /filter\(isPlantProduct\)/, "Plant Market must filter plant and gardening products");
assert.match(page, /এখনো কোনো গাছ বা বাগান-সম্পর্কিত পণ্য/, "empty catalogue must be explained honestly");
assert.match(page, /\/green-exchange\/board/, "empty state should link to Green Exchange");
assert.match(page, /canonical: "\/plant-market"/, "Plant Market must have canonical metadata");
assert.match(home, /href="\/plant-market"/, "home navigation must expose Plant Market");
assert.match(sitemap, /\$\{base\}\/plant-market/, "Plant Market must be in the sitemap");
assert.match(robots, /"\/plant-market"/, "Plant Market must be crawlable");

const marketplaceCore = readFileSync("components/marketplace/MarketplaceCore.tsx", "utf8");
assert.match(page, /categoryMode="available"/, "Plant Market categories must reflect products actually available");
assert.match(marketplaceCore, /price-low/, "Product sorting must support ascending price");
assert.match(marketplaceCore, /price-high/, "Product sorting must support descending price");
assert.match(marketplaceCore, /stockOnly/, "Customers must be able to filter in-stock products");
assert.match(marketplaceCore, /aria-pressed/, "Category selection must expose accessible pressed state");

console.log("Plant Market live-inventory and SEO smoke checks passed.");

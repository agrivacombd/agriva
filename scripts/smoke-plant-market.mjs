import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");

assert.match(page, /from\("products"\)/, "Plant Market must use real product inventory");
assert.match(page, /\.eq\("status", "active"\)/, "only active products should appear");
assert.match(page, /\.eq\("status", "active"\)/, "only publicly active products should appear");
assert.match(page, /select\("id,name,slug,category,category_slug,subcategory_slug,description,price,stock"\)/, "Plant Market must query the deployed taxonomy columns");
assert.match(page, /product.category_slug === "plants-gardening"/, "Plant Market must classify explicit plant taxonomy products");
assert.match(page, /filter\(isPlantProduct\)/, "Plant Market must filter plant and gardening products");
assert.match(page, /category_slug === "plants-gardening"/, "Plant Market must use stable database taxonomy rather than name-only matching");
assert.match(page, /এখনো কোনো গাছ বা বাগান-সম্পর্কিত পণ্য/, "empty catalogue must be explained honestly");
assert.match(page, /\/green-exchange\/board/, "empty state should link to Green Exchange");
assert.match(page, /canonical: "\/plant-market"/, "Plant Market must have canonical metadata");
assert.match(page, /href="\/seller\/products\/new"/, "Plant Market must link sellers to product submission");
assert.match(page, /পণ্য থেকে কেনাকাটা—যেভাবে কাজ করে/, "Plant Market must explain the customer journey");
assert.match(page, /\/marketplace\/পণ্যের-slug/, "Plant Market must explain canonical product landing pages");
assert.match(page, /checkout-এ যান/, "Plant Market must guide buyers to checkout");

assert.match(home, /href="\/plant-market"/, "home navigation must expose Plant Market");
assert.match(sitemap, /\$\{base\}\/plant-market/, "Plant Market must be in the sitemap");
assert.match(robots, /"\/plant-market"/, "Plant Market must be crawlable");

console.log("Plant Market live-inventory and SEO smoke checks passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");

assert.match(page, /from\("products"\)/, "Plant Market must use real product inventory");
assert.match(page, /\.eq\("status", "active"\)/, "only active products should appear");
assert.match(page, /\.eq\("moderation_status", "approved"\)/, "only approved products should appear");
assert.match(page, /filter\(isPlantProduct\)/, "Plant Market must filter plant and gardening products");
assert.match(page, /এখনো কোনো গাছ বা বাগান-সম্পর্কিত পণ্য/, "empty catalogue must be explained honestly");
assert.match(page, /\/green-exchange\/board/, "empty state should link to Green Exchange");
assert.match(page, /canonical: "\/plant-market"/, "Plant Market must have canonical metadata");
assert.match(home, /href="\/plant-market"/, "home navigation must expose Plant Market");
assert.match(sitemap, /\$\{base\}\/plant-market/, "Plant Market must be in the sitemap");
assert.match(robots, /"\/plant-market"/, "Plant Market must be crawlable");

console.log("Plant Market live-inventory and SEO smoke checks passed.");

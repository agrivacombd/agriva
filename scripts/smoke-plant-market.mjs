import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const analytics = readFileSync("lib/analytics.ts", "utf8");

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
assert.match(page, /image_url/, "Plant Market cards must receive product images");
assert.match(page, /availableCategoriesOnly/, "Plant Market should show only categories with live products");

const detail = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const purchase = readFileSync("components/marketplace/CheckoutButton.tsx", "utf8");
assert.match(detail, /CheckoutButton productId=\{product\.id\}/, "Product details must expose the purchase component");
assert.match(purchase, /\.from\("carts"\)/, "Product detail must find or create the buyer's active cart");
assert.match(purchase, /\.from\("cart_items"\)/, "Product detail must add the selected product to cart_items");
assert.match(purchase, /router\.push\("\/cart"\)/, "Successful add-to-cart must open the cart");
assert.match(purchase, /\/login\?next=%2Fcart/, "Unauthenticated buyers must be able to resume the cart flow after login");
assert.match(purchase, /fetch\("\/api\/checkout"/, "Direct COD purchase must retain the existing checkout API");
assert.match(analytics, /"add_to_cart"/, "Analytics must accept the add-to-cart event");

console.log("Plant Market inventory, discovery, cart, checkout and SEO smoke checks passed.");

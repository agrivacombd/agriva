import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const storePage = read("../app/store/[storeId]/page.tsx");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const sitemap = read("../app/sitemap.ts");
const merchantFeed = read("../app/api/merchant-center/route.ts");
const schemaPlan = read("../docs/product-schema-mismatch-safe-resolution.md");

const wholesalePattern = /wholesale_price|product_wholesale_prices|wholesalePrice|wholesale_price_tiers/i;

assert.ok(storePage.includes('.select("id,name,slug,category,description,price,stock")'), "public store must select only public retail product fields");
assert.ok(!wholesalePattern.test(storePage), "public store source must not reference wholesale prices");
assert.ok(!wholesalePattern.test(productPage), "public product page/schema/metadata must not reference wholesale prices");
assert.ok(!wholesalePattern.test(merchantFeed), "public Merchant Center feed must not reference wholesale prices");

assert.ok(productPage.includes("price: Number(product.price)"), "Product/Offer schema must use retail product price");
assert.ok(merchantFeed.includes("p.price"), "Merchant Center feed must use retail product price");

// Keep approval guards until the canonical publication source is resolved.
assert.ok(storePage.includes('.eq("moderation_status", "approved")'), "storefront must retain approval guard");
assert.ok(productPage.includes('.eq("moderation_status", "approved")'), "product detail must retain approval guard");
assert.ok(sitemap.includes('.eq("moderation_status", "approved")'), "sitemap must retain approval guard");
assert.ok(schemaPlan.includes("Do not drop approval filters"), "schema plan must prohibit bypassing approval checks");
assert.ok(schemaPlan.includes("Do not add `moderation_status` with a permissive default"), "schema plan must prohibit permissive approval backfill");

console.log("Public retail-pricing and schema-mismatch guard checks passed.");

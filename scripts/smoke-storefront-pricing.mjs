import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const storePage = read("../app/store/[storeId]/page.tsx");
const productPage = read("../app/marketplace/[productId]/page.tsx");
const sitemap = read("../app/sitemap.ts");
const merchantFeed = read("../app/api/merchant-center/route.ts");

// Public storefronts select only the retail product fields. Wholesale prices
// must never be loaded into public page data, even if B2B tables are added.
assert.ok(
  storePage.includes('.select("id,name,slug,category,description,price,stock")'),
  "public store must select only the public retail product fields",
);
assert.ok(!/wholesale_price|product_wholesale_prices|wholesalePrice/i.test(storePage),
  "public store source must not query or serialize wholesale price data");
assert.ok(storePage.includes('.eq("status", "active")') &&
  storePage.includes('.eq("moderation_status", "approved")'),
  "public store must fail closed to active and approved products");
assert.ok(storePage.includes("alternates: { canonical: `/store/${storeId}` }"),
  "store SEO metadata must have a canonical URL");

// Product structured data and merchant feed must be driven by the public
// retail price only; private wholesale pricing must not be added to SEO feeds.
assert.ok(productPage.includes('price: Number(product.price || 0)'),
  "Product/Offer structured data must use the retail product price");
assert.ok(!/wholesale_price|product_wholesale_prices|wholesalePrice/i.test(productPage),
  "public product page/metadata must not reference wholesale price data");
assert.ok(merchantFeed.includes("p.price") && !/wholesale_price|product_wholesale_prices|wholesalePrice/i.test(merchantFeed),
  "merchant SEO feed must use retail pricing only");
assert.ok(sitemap.includes('.eq("status", "active")') &&
  sitemap.includes('.eq("moderation_status", "approved")'),
  "product sitemap must include only active, approved products");

console.log("Storefront pricing isolation checks passed.");

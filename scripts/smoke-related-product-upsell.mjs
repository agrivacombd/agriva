import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const page = read("app/marketplace/[productId]/page.tsx");
const upsell = read("components/marketplace/RelatedProductUpsell.tsx");
const gallery = read("components/marketplace/ProductImageGallery.tsx");
const cartHelper = read("lib/marketplace/cart-auth.ts");

assert.match(page, /<RelatedProductUpsell/, "Related Products must render on detail page");
assert.match(page, /<RelatedProductUpsell[\\s\\S]*?compact/, "Cross-sell should use compact cards under the gallery");
assert.match(page, /md:col-start-1 md:row-start-2/, "Desktop cross-sell stays under product photos");
assert.match(page, /md:col-start-2 md:row-span-2/, "Purchase column keeps its own space on tablet and desktop");
assert.doesNotMatch(page, /md:h-\\[560px\\]/, "Gallery should not force a blank 560px image area");
assert.match(gallery, /aspect-square/, "Product photo should use a responsive square");
assert.match(upsell, /products\\.slice\\(0, 2\\)/, "Only two sales-focused related products should fill the left column");
assert.match(upsell, /repeat\\(auto-fit, minmax\\(min\\(100%, 15rem\\), 1fr\\)\\)/, "Compact cards should follow container width");

assert.ok(page.indexOf("<RelatedProductUpsell") < page.indexOf('id="product-details"'),
  "Cross-sell must appear after main purchase and before detailed information and FAQ");
assert.ok(page.indexOf("<RelatedProductUpsell") < page.indexOf('>সাধারণ জিজ্ঞাসা<'),
  "Recommendations must precede FAQ");
assert.match(page, /\.eq\("marketplace_channel", "marketplace"\)/);
assert.match(page, /\.eq\("status", "active"\)/);
assert.match(page, /\.neq\("id", product.id\)/);
assert.match(page, /\.gt\("stock", 0\)/);
assert.match(page, /product.subcategory_slug/, "Same subcategory should rank higher");
assert.match(upsell, /grid-cols-2 gap-3 lg:grid-cols-4/, "Mobile and desktop cards");
assert.match(upsell, /কার্টে যোগ করুন/, "Related cards must have Add to Cart");
assert.match(upsell, /updateQuantity/, "Related cards must have adjustable quantity");
assert.match(upsell, /resolveMarketplaceCartUser\(\)/, "Use existing session classifier");
assert.match(upsell, /rpc\("add_marketplace_cart_item"/, "Use authoritative server cart RPC");
assert.match(upsell, /p_quantity: requestedQuantity/, "Do not silently reset quantity");
assert.match(upsell, /new Event\(CART_UPDATED_EVENT\)/, "Update site-wide cart badge");
assert.match(upsell, /MarketplaceAuthModal/, "Guest shoppers must have login-first flow");
assert.match(upsell, /relatedAddToCart/, "Guest purchase intent must be restored once");
assert.match(upsell, /url.searchParams.delete\("relatedAddToCart"\)/, "Remove intent to prevent double add");
assert.match(upsell, /trackAnalyticsEvent\("add_to_cart"/, "Track consent-safe standard analytics");
assert.match(upsell, /trackMetaEvent\("AddToCart"/, "Track consent-gated Meta event");
assert.match(upsell, /role=\{notice.kind === "error" \? "alert" : "status"\}/, "Accessible result feedback");
assert.match(cartHelper, /getUser\(\)/, "RPC flow must verify actual logged-in user");
console.log("Related Products purchase-placement and cart regressions passed.");

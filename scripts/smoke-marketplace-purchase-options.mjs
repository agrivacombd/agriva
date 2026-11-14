import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/marketplace/[productId]/page.tsx");
const purchase = read("../components/marketplace/CheckoutButton.tsx");
const route = read("../app/api/checkout/route.ts");
const cartRoute = read("../app/api/checkout/cart/route.ts");
const catalogue = read("../components/marketplace/MarketplaceCore.tsx");
const cart = read("../app/cart/page.tsx");
const checkout = read("../app/checkout/page.tsx");
const migration = read("../supabase/migrations/20261102161719_atomic_marketplace_cart_checkout.sql");

for (const required of ["productSlug={product.slug}", "unitPrice={Number(product.price)}", "stock={Number(product.stock ?? 0)}", "unitLabel={unitLabel || \"টি\"}"]) {
  assert.ok(page.includes(required), "Product page must pass its actual " + required);
}
assert.ok(page.includes("!hasRealPrice || !hasStock"), "Unavailable products should not be purchasable");

for (const fragment of [
  "const CHOICES = [1, 2, 3, 5, 10]",
  "Math.min(100, Math.max(0, Math.floor(Number(stock) || 0)))",
  "setQuantity(Math.min(maxQuantity, Math.max(1, value)))",
  "unitPrice * quantity",
  "aria-pressed={quantity === value}",
  "quantity >= maxQuantity",
  "p_quantity: quantity",
  "quantity,",
  "paymentMethod: \"cod\"",
  "ফোনে অর্ডার করুন",
  "কার্টে যোগ করুন",
  "এখনই অর্ডার করুন",
  "সরাসরি ক্যাশ অন ডেলিভারি অর্ডার",
]) {
  assert.ok(purchase.includes(fragment), "Missing purchase-options contract: " + fragment);
}
for (const src of [purchase, cart, checkout]) {
  assert.ok(src.includes('import { createSupabaseBrowserClient } from "@/lib/supabase/browser"'), "Purchase, cart and checkout must use the same SSR cookie auth as login");
  assert.ok(!src.includes('from "@/lib/supabase/client"'), "Legacy localStorage auth must not be used in checkout");
}
for (const fragment of ["fullAddress: form.fullAddress.trim()", 'setField("fullAddress"', "minLength={8}"]) {
  assert.ok(checkout.includes(fragment), "Checkout must expose a single validated address input: " + fragment);
}
for (const removed of ['setField("unionOrArea"', 'setField("villageRoadHouse"', 'setField("landmark"', 'setField("postalCode"']) {
  assert.ok(!checkout.includes(removed), "Legacy form field is still visible: " + removed);
}
assert.ok(cartRoute.includes("isSimpleAddress ? upazila : legacyArea"), "Server should derive legacy area from an actual selected location");
assert.ok(cartRoute.includes("isSimpleAddress ? rawFullAddress : legacyStreet"), "Server must preserve the user-entered full address");
assert.ok(cartRoute.includes("p_idempotency_key: idempotencyKey"), "Idempotency protection must remain present");
assert.ok(catalogue.includes("recordListingClick(); onAddToCart();") && catalogue.includes("কার্টে যোগ করুন"), "Marketplace cards must provide an actual Add to Cart button");
assert.ok(catalogue.includes('productHrefPrefix === "/marketplace" && inStock'), "Marketplace cards must use Add to Cart, not Buy Now");
assert.ok(catalogue.includes('productHrefPrefix === "/plant-market" ? "BUY NOW" : "বিস্তারিত দেখুন"'), "Plant Market must retain its existing navigation behavior");
assert.ok(catalogue.includes("recordListingClick(); onAddToCart();"), "Add to Cart must retain listing-click ranking signals");
assert.ok(catalogue.includes('rpc("add_marketplace_cart_item"') && catalogue.includes("p_quantity: 1"), "Card purchase uses the server-validated cart RPC");
assert.ok(catalogue.includes('createSupabaseBrowserClient') && catalogue.includes("auth.getUser()"), "Card purchase must share cookie-based login authentication");
assert.ok(catalogue.includes("showStickyCart") && catalogue.includes('href="/checkout"'), "Added products must expose persistent checkout navigation");
assert.ok(catalogue.includes('href="/cart"') && catalogue.includes("cartSummary.units"), "Floating bar shows real cart count and cart navigation");
assert.ok(catalogue.includes("cartNeedsLogin") && catalogue.includes("setCartError"), "Unauthenticated and failed additions must not appear successful");
assert.ok(catalogue.includes('productHrefPrefix !== "/marketplace"'), "Plant Market is not allowed to call Marketplace cart RPC");
assert.ok(page.includes("relatedProducts") && page.includes('.eq("marketplace_channel", "marketplace")'), "Related product cards must show published marketplace items only");
assert.ok(purchase.includes('window.location.hash === "#product-direct-cod"'), "Buy Now link should expand the COD form");
assert.ok(purchase.includes('role="region" aria-label="কার্টে যোগ করা পণ্যের চেকআউট"'), "Product detail should show persistent cart success bar");
assert.ok(purchase.includes('href="/checkout"'), "Product detail sticky bar should navigate to checkout");
assert.ok(purchase.includes('setCartAdded(false)') && purchase.includes('aria-label="কার্ট বার বন্ধ করুন"'), "Sticky bar should be dismissible");

assert.ok(!purchase.includes("p_quantity: 1"), "Cart selection must never be silently reset to one");
assert.ok(!purchase.includes("quantity: 1"), "Buy Now selection must never be silently reset to one");
for (const required of [
  'select("id,name,slug,image_url,unit,price,stock,status")',
  "item.image_url",
  "item.slug",
  "unitLabel",
  "item.qty + 1",
  "item.qty - 1",
  "item.price * item.qty",
  "পণ্যের মোট মূল্য",
  "ডেলিভারি চার্জ",
  "Checkout-এ যাচাই করুন",
  "প্রযোজ্য নয়",
  "invalidCart",
]) {
  assert.ok(cart.includes(required), "Cart UX must show real catalogue data and safe totals: " + required);
}
assert.ok(!cart.includes("৳ 100") && !cart.includes("৳100") && !cart.includes("650"), "Cart must not fabricate image-reference delivery or discount values");

assert.ok(route.includes("Number.isSafeInteger(quantity)") && route.includes("quantity > 100"), "API must validate quantity bounds");
assert.ok(route.includes("p_quantity: quantity"), "API must forward the chosen quantity to the secure RPC");
assert.ok(migration.includes("next_quantity > least(product_row.stock, 100)"), "Cart RPC must enforce live stock and max quantity");
console.log("Marketplace product purchase-options contracts passed.");

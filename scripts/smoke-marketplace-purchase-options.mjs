import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/marketplace/[productId]/page.tsx");
const purchase = read("../components/marketplace/CheckoutButton.tsx");
const route = read("../app/api/checkout/route.ts");
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
assert.ok(!purchase.includes("p_quantity: 1"), "Cart selection must never be silently reset to one");
assert.ok(!purchase.includes("quantity: 1"), "Buy Now selection must never be silently reset to one");
assert.ok(route.includes("Number.isSafeInteger(quantity)") && route.includes("quantity > 100"), "API must validate quantity bounds");
assert.ok(route.includes("p_quantity: quantity"), "API must forward the chosen quantity to the secure RPC");
assert.ok(migration.includes("next_quantity > least(product_row.stock, 100)"), "Cart RPC must enforce live stock and max quantity");
console.log("Marketplace product purchase-options contracts passed.");

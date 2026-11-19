import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const header = read("../components/site/HeaderCartLink.tsx");
const auth = read("../lib/marketplace/cart-auth.ts");

assert.ok(header.includes("getExistingMarketplaceCartUser"), "Global cart badge must only read an existing session");
assert.ok(!header.includes("resolveMarketplaceCartUser"), "Global cart badge must never provision guest users");
assert.ok(auth.includes("export async function getExistingMarketplaceCartUser"), "Non-provisioning lookup must be exported");
const lookup = auth.slice(auth.indexOf("export async function getExistingMarketplaceCartUser"));
assert.ok(lookup.includes("getSession()"), "Lookup must inspect current session");
assert.ok(lookup.includes("if (!sessionData.session?.user || sessionError) return { supabase, user: null }"), "No session must return null without creating an account");
assert.ok(!lookup.includes("signInAnonymously"), "Non-provisioning lookup must not create anonymous Auth users");
assert.ok(auth.includes("signInAnonymously"), "Explicit guest cart flow must retain guest identity provisioning");

const cartPage = read("../app/cart/page.tsx");
const checkoutPage = read("../app/checkout/page.tsx");
for (const [name, source] of [["cart page", cartPage], ["checkout page", checkoutPage]]) {
  assert.ok(source.includes("getExistingMarketplaceCartUser"), `${name} must only read an existing session on page load`);
  assert.ok(!source.includes("resolveMarketplaceCartUser"), `${name} must not provision anonymous users just by opening the page`);
}
console.log("Guest Auth provisioning boundaries passed.");

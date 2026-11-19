import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/marketplace/[productId]/page.tsx");
const purchase = read("../components/marketplace/CheckoutButton.tsx");
const route = read("../app/api/checkout/route.ts");
const cartRoute = read("../app/api/checkout/cart/route.ts");
const catalogue = read("../components/marketplace/MarketplaceCore.tsx");
const storefront = read("../app/marketplace/page.tsx");
const cart = read("../app/cart/page.tsx");
const checkout = read("../app/checkout/page.tsx");
const migration = read("../supabase/migrations/20261102161719_atomic_marketplace_cart_checkout.sql");
const divisionHelper = read("../lib/bangladesh-division.ts");

for (const required of ["productSlug={product.slug}", "unitPrice={Number(product.price)}", "stock={Number(product.stock ?? 0)}", "shippingClass={product.shipping_class ?? null}"]) {
  assert.ok(page.includes(required), "Product page must pass its actual " + required);
}
assert.ok(page.includes("!hasRealPrice || !hasStock"), "Unavailable products should not be purchasable");
for (const selector of ["min-[375px]:py-5", "sm:py-10", "lg:py-14", "text-[clamp(1.35rem,5.5vw,1.75rem)]", "sm:hidden", "hidden sm:inline", 'href="#catalogue"', 'href="#marketplace-product-list"', "scroll-mt-24"]) {
  assert.ok(storefront.includes(selector), "Marketplace banner responsive/mobile fast-navigation contract: " + selector);
}
assert.ok(catalogue.includes('id="marketplace-product-list"'), "Mobile product shortcut must target the real catalogue list");

for (const fragment of [
  "const CHOICES = [1, 2, 3, 5, 10]",
  "Math.min(100, Math.max(0, Math.floor(Number(stock) || 0)))",
  "setQuantity(Math.min(maxQuantity, Math.max(1, value)))",
  "unitPrice * quantity",
  "aria-pressed={quantity === value && !customQuantitySelected && !customQuantityOpen}",
  "const [customQuantityOpen, setCustomQuantityOpen] = useState(false)",
  "const [customQuantityInput, setCustomQuantityInput] = useState(\"1\")",
  "normalizeQuantityDigits(customQuantityInput)",
  "void addToCart(requested)",
  "প্রয়োগ করে কার্টে যোগ করুন",
  'type="text" inputMode="numeric"',
  "Custom{customQuantitySelected",
  "inputMode=\"numeric\"",
  "requested > maxQuantity",
  "setQuantity(requested)",
  "quantity >= maxQuantity",
  "p_quantity: requestedQuantity",
  "quantity,",
  "paymentMethod: \"cod\"",
  "ফোনে অর্ডারের সহায়তা নিন",
  "কার্টে যোগ করুন",
  "ক্যাশ অন ডেলিভারিতে অর্ডার নিশ্চিত করুন",
  "সরাসরি ক্যাশ অন ডেলিভারি অর্ডার",
]) {
  assert.ok(purchase.includes(fragment), "Missing purchase-options contract: " + fragment);
}
for (const src of [cart, checkout]) {
  assert.ok(src.includes('import { createSupabaseBrowserClient } from "@/lib/supabase/browser"'), "Cart and checkout must use the cookie-based auth client");
  assert.ok(!src.includes('from "@/lib/supabase/client"'), "Legacy localStorage auth must not be used in checkout");
}
assert.ok(purchase.includes("const requested = /^[0-9]{1,3}$/.test(input) ? Number(input) : 0;"), "Custom quantity accepts only integral limits after digit normalization");
assert.ok(purchase.includes(".replace(/[০-৯]/g, digit =>"), "Bangla numeral keyboard input must be normalized");
assert.ok(purchase.includes("void addToCart(requested);"), "Custom apply must add the selected quantity without stale React state");
assert.ok(purchase.includes("resolveMarketplaceCartUser"), "Detail purchase must use the shared guest-safe cart auth helper");
for (const fragment of ["fullAddress: form.fullAddress.trim()", 'setField("fullAddress"', "maxLength={250}"]) {
  assert.ok(checkout.includes(fragment), "Checkout must expose a single validated address input: " + fragment);
}
for (const removed of ['setField("unionOrArea"', 'setField("villageRoadHouse"', 'setField("landmark"', 'setField("postalCode"']) {
  assert.ok(!checkout.includes(removed), "Legacy form field is still visible: " + removed);
}
for (const fragment of [
  'lg:grid-cols-[minmax(0,1fr)_minmax(350px,0.82fr)]',
  'id="agriva-checkout-form"',
  'form="agriva-checkout-form"',
  'sm:grid-cols-2',
  'item.image_url',
  'item.unit',
  'changeQuantity(item, item.quantity + 1)',
  'changeQuantity(item, item.quantity - 1)',
  'void remove(item)',
  'subtotal',
  'invalidCart',
  'idempotencyKeyRef.current = ""',
  'checkoutDisabled',
  'ডিসকাউন্ট',
  'ডেলিভারি চার্জ',
  'কার্টে ফিরে যান',
]) {
  assert.ok(checkout.includes(fragment), "Responsive checkout must preserve cart controls and safe values: " + fragment);
}
assert.ok(checkout.includes("order-2 min-w-0 space-y-5") && checkout.includes("order-1 min-w-0"),
  "Mobile should show item summary before the delivery address form");
assert.ok(checkout.includes('select("id,product_id,quantity,unit_price")'),
  "Checkout must operate on actual cart item IDs");
assert.ok(checkout.includes('select("id,name,slug,image_url,unit,shipping_class,shipping_weight_grams,price,stock,status")'),
  "Checkout must use current catalogue price, stock and images");
assert.ok(!checkout.includes('৳১০০') && !checkout.includes('৳100') && !checkout.includes('৳৬৫০'),
  "Checkout must not invent shipping fees or discounts");

assert.ok(!checkout.includes('label="বিভাগ *"') && !checkout.includes('form.division'), "Checkout must not ask for division");
assert.ok(!checkout.includes("form.deliveryInstructions") && !checkout.includes("ডেলিভারির অতিরিক্ত নির্দেশনা"), "Checkout must not ask for optional delivery instructions");
assert.ok(cartRoute.includes('getBangladeshDivisionForDistrict(district)'), "Server must derive division from district");
assert.ok(divisionHelper.includes("[5, 10, 13, 16]") && divisionHelper.includes('return "ময়মনসিংহ"'), "Mymensingh district group must be handled separately");
assert.ok(divisionHelper.includes('return "ঢাকা"') && divisionHelper.includes('return "চট্টগ্রাম"'), "Bangladesh division derivation must cover the country");

const header = read("../components/site/SiteChrome.tsx");
const headerCart = read("../components/site/HeaderCartLink.tsx");
const authModal = read("../components/marketplace/MarketplaceAuthModal.tsx");
const phoneOtp = read("../components/auth/PhoneOtpAuth.tsx");
const loginPage = read("../app/login/page.tsx");
const signupPage = read("../app/signup/page.tsx");
const signupExperience = read("../components/auth/SignupExperience.tsx");
for (const part of ["<HeaderCartLink english={english} />", 'href="/cart"']) {
  assert.ok(part === 'href="/cart"' ? headerCart.includes(part) : header.includes(part), "Header must expose the cart");
}
assert.ok(headerCart.includes("CART_UPDATED_EVENT") && headerCart.includes("cart_items"), "Header cart count should use real cart rows and update on changes");
assert.ok(catalogue.includes("resolveMarketplaceCartUser") && catalogue.includes("MarketplaceAuthModal"), "Guest card purchase must create/use an anonymous buyer session");
assert.ok(purchase.includes("resolveMarketplaceCartUser"), "Guest product purchase must use the anonymous buyer session helper");
const cartAuth = read("../lib/marketplace/cart-auth.ts");
assert.ok(cartAuth.includes("auth.getSession()") && cartAuth.includes("auth.getUser()"), "Check existing cookie session before verifying the logged-in user");
assert.ok(cartAuth.indexOf("auth.getSession()") < cartAuth.indexOf("auth.getUser()"), "Guest session check must happen before the remote auth request");
assert.ok(cartAuth.includes("auth.signInAnonymously()"), "Visitors must receive a buyer-only anonymous session without a login prompt");
assert.ok(cartAuth.includes("sessionData.session.user.is_anonymous"), "Existing anonymous sessions must be reused");
assert.ok(cartAuth.includes("auth.getUser()"), "Regular authenticated sessions must still be verified remotely");
assert.ok(!cartAuth.includes("user: null"), "A visitor must not be returned as an unauthenticated cart user");
assert.ok(cart.includes("resolveMarketplaceCartUser"), "Cart page must create a guest session when opened directly");
assert.ok(checkout.includes("resolveMarketplaceCartUser"), "Checkout page must create a guest session when opened directly");
assert.ok(checkout.includes("Guest Checkout: SMS OTP ছাড়াই অর্ডার করতে পারবেন"), "Guest checkout must clearly explain OTP is not required");
assert.ok(!catalogue.includes("কার্টে যোগ করা যায়নি। আপনার লগইন ও ইন্টারনেট সংযোগ যাচাই করুন।"), "No login should not appear as cart network failure");
assert.ok(purchase.includes('searchParams.get("addToCart")') && purchase.includes('searchParams.delete("addToCart")'), "Return-to-product cart intent must be one-time");
assert.ok(authModal.includes('useState<"login" | "signup">("login")'), "Login must be the default popup");
assert.ok(authModal.includes('PhoneOtpAuth') && authModal.includes("SignupExperience"), "Popup must offer email, phone, signup");
const oauthButtons = read("../components/auth/SocialAuthButtons.tsx");
const oauthCallback = read("../app/auth/callback/route.ts");
const socialProfile = read("../lib/auth/social-profile.ts");
const authRedirect = read("../lib/auth/safe-next.ts");
assert.ok(authModal.includes("SocialAuthButtons") && loginPage.includes("SocialAuthButtons") && signupExperience.includes("SocialAuthButtons"),
  "Google/Facebook OAuth must be available in popup, login and signup");
assert.ok(oauthButtons.includes('continueWith("google")') && oauthButtons.includes('continueWith("facebook")'),
  "Both Google and Facebook sign-in actions must be offered");
assert.ok(oauthButtons.includes("signInWithOAuth") && oauthButtons.includes("skipBrowserRedirect: true"),
  "Provider authentication must use Supabase OAuth with controlled browser redirect");
assert.ok(oauthButtons.includes('new URL("/auth/callback", window.location.origin)') &&
  oauthButtons.includes("safeAuthNextPath(returnTo"),
  "OAuth callback must return to the intended product with a safe relative path");
assert.ok(authRedirect.includes('value.startsWith("//")') &&
  authRedirect.includes('value.includes("\\\\")'),
  "External or unsafe OAuth return locations must be rejected");
assert.ok(oauthCallback.includes("exchangeCodeForSession(code)") &&
  oauthCallback.includes("fillMissingSocialProfileName(supabase, data.user)"),
  "Provider identity must be exchanged and profile name enriched server-side");
assert.ok(socialProfile.includes('item.provider === "google" || item.provider === "facebook"') &&
  socialProfile.includes('textField(verifiedProviderData, "full_name")') &&
  socialProfile.includes('textField(verifiedProviderData, "name")'),
  "Name must be sourced from Google/Facebook identity metadata");
assert.ok(socialProfile.includes('.eq("id", user.id)') &&
  socialProfile.includes('.or("full_name.is.null,full_name.eq.")'),
  "Social name autofill must not overwrite an existing AGRIVA display name");
assert.ok(!socialProfile.includes("selected_roles") && !socialProfile.includes("updateUser("),
  "Social display name autofill must not change account permissions or identity claims");
assert.ok(authModal.includes("window.location.assign(returnTo)"), "Authentication should restore the selected product");
assert.ok(phoneOtp.includes("signInWithOtp") && phoneOtp.includes("verifyOtp"), "Phone must authenticate with verified SMS OTP");
assert.ok(phoneOtp.includes('shouldCreateUser: mode === "signup"'), "Phone sign-in must not create unknown accounts");
assert.ok(loginPage.includes('method === "phone"') && signupExperience.includes('method === "phone"'), "Full login and signup pages must also offer phone");
assert.ok(signupPage.includes("returnTo"), "Signup must preserve selected product return path");

assert.ok(cartRoute.includes("isSimpleAddress ? upazila : (legacyArea || upazila)"), "Server should derive legacy area from an actual selected location");
assert.ok(cartRoute.includes("isSimpleAddress ? [rawFullAddress] : [legacyArea, legacyStreet]"), "Server must preserve the user-entered full address");
assert.ok(cartRoute.includes("p_idempotency_key: idempotencyKey"), "Idempotency protection must remain present");
assert.ok(catalogue.includes("recordListingClick(); onAddToCart();") && catalogue.includes("Add to Cart"), "Marketplace cards must provide an actual Add to Cart button");
assert.ok(catalogue.includes('productHrefPrefix === "/marketplace" ? (') && catalogue.includes('href={detailHref + "#product-direct-cod"}'), "Marketplace cards must present real add-to-cart and buy-now actions");
assert.ok(catalogue.includes('const detailHref = productHrefPrefix + "/" + product.slug;') && catalogue.includes('productHrefPrefix === "/marketplace" ? ('), "Plant Market must navigate to its own product details without promising an instant purchase");
assert.ok(catalogue.includes("recordListingClick(); onAddToCart();"), "Add to Cart must retain listing-click ranking signals");
assert.ok(catalogue.includes('rpc("add_marketplace_cart_item"') && catalogue.includes("p_quantity: 1"), "Card purchase uses the server-validated cart RPC");
assert.ok(catalogue.includes('resolveMarketplaceCartUser()'), "Card purchase must distinguish guests from authenticated users");
assert.ok(catalogue.includes("showStickyCart") && catalogue.includes('href="/checkout"') && catalogue.includes("setCartBarDismissed(true)"), "Added products must expose dismissible persistent COD checkout navigation");
assert.ok(catalogue.includes('href="/cart"') && catalogue.includes("cartSummary.units"), "Floating bar shows real cart count and cart navigation");
assert.ok(catalogue.includes("cartNeedsLogin") && catalogue.includes("setCartError"), "Unauthenticated and failed additions must not appear successful");
assert.ok(catalogue.includes('productHrefPrefix !== "/marketplace"'), "Plant Market is not allowed to call Marketplace cart RPC");
assert.ok(page.includes("relatedProducts") && page.includes('.eq("marketplace_channel", "marketplace")'), "Related product cards must show published marketplace items only");
assert.ok(purchase.includes('url.hash === "#product-direct-cod"') && purchase.includes('url.searchParams.get("buyQty")'), "Buy Now links should expand the COD form and preserve quantity");
assert.ok(purchase.includes('role="region" aria-label="কার্টে যোগ করা পণ্যের চেকআউট"'), "Product detail should show persistent cart success bar");
assert.ok(purchase.includes('href="/checkout"') && purchase.includes("COD অর্ডার নিশ্চিত করতে যান"), "Product detail sticky bar should navigate to dedicated COD checkout");
assert.ok(purchase.includes('setCartAdded(false)') && purchase.includes('aria-label="কার্ট বার বন্ধ করুন"'), "Sticky bar should be dismissible");

assert.ok(!purchase.includes("p_quantity: 1"), "Cart selection must never be silently reset to one");
assert.ok(!purchase.includes("quantity: 1"), "Buy Now selection must never be silently reset to one");
for (const required of [
  'select("id,name,slug,image_url,unit,shipping_class,shipping_weight_grams,price,stock,status")',
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

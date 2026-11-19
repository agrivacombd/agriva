import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const hook = read("supabase/functions/send-sms/index.ts");
const sms = read("lib/sms/one9.ts");
const reset = read("app/forgot-password/page.tsx");
const checkout = read("app/api/checkout/cart/route.ts");
const directCheckout = read("app/api/checkout/route.ts");
const plantCheckout = read("app/api/plant-market/checkout/route.ts");
const adminOrders = read("app/admin/orders/page.tsx");
const sellerOrders = read("app/seller/orders/page.tsx");
const plantSellerOrders = read("app/plant-seller/orders/page.tsx");
const env = read(".env.example");

assert.match(hook, /standardwebhooks/);
assert.match(hook, /webhook\.verify\(rawBody/);
assert.match(hook, /SEND_SMS_HOOK_SECRET/);
assert.match(hook, /ONE9_SMS_API_KEY/);
assert.match(hook, /sender_id: "AGRIVA"/);
assert.match(hook, /event\.sms\?\.otp/);
assert.doesNotMatch(hook, /console\.(log|info)\([^\n]*(otp|phone|apiKey)/i);
assert.match(sms, /process\.env\.ONE9_SMS_API_KEY/);
assert.doesNotMatch(sms, /NEXT_PUBLIC_ONE9/);
assert.match(reset, /shouldCreateUser: false/);
assert.match(reset, /verifyOtp\(/);
assert.match(reset, /type: "sms"/);
assert.match(checkout, /orderConfirmationMessage/);
assert.match(checkout, /!checkout\.idempotentReplay/);
assert.match(directCheckout, /orderConfirmationMessage/);
assert.match(plantCheckout, /!data\.replayed/);
for (const page of [adminOrders, sellerOrders, plantSellerOrders]) {
  assert.match(page, /orderStatusMessage/);
  assert.match(page, /sendAgrivaSms/);
}
assert.match(env, /^ONE9_SMS_API_KEY=$/m);
console.log("One9 SMS Auth Hook, phone OTP recovery, and COD order notification contracts passed.");

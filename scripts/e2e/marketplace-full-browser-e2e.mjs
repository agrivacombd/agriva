import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seededPassword = process.env.E2E_SEEDED_PASSWORD;
const buyerEmail = process.env.E2E_BUYER_EMAIL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const sellerEmail = process.env.E2E_SELLER_EMAIL;
const productId = process.env.E2E_PRODUCT_ID;

for (const [key, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: supabaseURL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  E2E_SEEDED_PASSWORD: seededPassword,
  E2E_BUYER_EMAIL: buyerEmail,
  E2E_ADMIN_EMAIL: adminEmail,
  E2E_SELLER_EMAIL: sellerEmail,
  E2E_PRODUCT_ID: productId,
})) {
  if (!value) throw new Error(`Missing required E2E setting: ${key}`);
}

const db = createClient(supabaseURL, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const browser = await chromium.launch({ headless: true });
const pageErrors = [];
const contexts = [];
const check = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log("PASS " + message);
};

function trackErrors(page, label) {
  page.on("pageerror", (error) => pageErrors.push(`${label}: ${error.message}`));
}

async function signIn(page, email, password) {
  await page.goto("/login");
  await page.getByRole("button", { name: "শুধু প্রয়োজনীয়", exact: true }).click({ timeout: 10_000 }).catch(() => {});
  const languageButton = page.getByRole("button", { name: "English", exact: true });
  if (await languageButton.count()) await languageButton.click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 30_000 });
}

async function newContext(label) {
  const context = await browser.newContext({ baseURL });
  contexts.push(context);
  const page = await context.newPage();
  trackErrors(page, label);
  return { context, page };
}

try {
  const readinessDeadline = Date.now() + 90_000;
  let appReady = false;
  while (Date.now() < readinessDeadline) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        appReady = true;
        break;
      }
    } catch {
      // Next.js is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  check(appReady, "local Next.js application is ready");

  // 1. Exercise the real public signup form, profile trigger, then password login.
  const buyer = await newContext("buyer-auth");
  await buyer.page.goto("/signup");
  await buyer.page.getByRole("button", { name: "শুধু প্রয়োজনীয়", exact: true }).click({ timeout: 10_000 }).catch(() => {});
  const signupLanguage = buyer.page.getByRole("button", { name: "English", exact: true });
  if (await signupLanguage.count()) await signupLanguage.click();
  await buyer.page.getByLabel("Your name").fill("AGRIVA E2E Buyer");
  await buyer.page.getByLabel("Email address").fill(buyerEmail);
  await buyer.page.getByLabel("Password").fill(seededPassword);
  await buyer.page.locator('input[type="checkbox"]').check();
  await buyer.page.getByRole("button", { name: "Create account", exact: true }).click();
  await buyer.page.waitForURL((url) => url.pathname !== "/signup", { timeout: 30_000 });

  const { data: users, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (usersError) throw usersError;
  const buyerUser = users.users.find((user) => user.email?.toLowerCase() === buyerEmail.toLowerCase());
  check(Boolean(buyerUser), "signup created a real, confirmed Supabase Auth user");

  const { data: buyerProfile, error: profileError } = await db
    .from("profiles").select("id,role").eq("id", buyerUser.id).single();
  if (profileError) throw profileError;
  check(buyerProfile.role === "farmer", "Auth signup trigger created the buyer profile without granting admin");

  await buyer.context.clearCookies();
  await buyer.page.goto("/");
  await buyer.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await buyer.context.clearCookies();
  await signIn(buyer.page, buyerEmail, seededPassword);
  check(new URL(buyer.page.url()).pathname !== "/login", "buyer can sign in with email and password");

  // A normal authenticated user must not enter the admin console.
  await buyer.page.goto("/admin");
  await buyer.page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 30_000 });
  check(true, "non-admin user is redirected away from /admin");

  // 2. Place a real COD order against the isolated, seeded product.
  await buyer.page.goto("/marketplace/agriva-e2e-cod-product");
  await buyer.page.getByRole("heading", { name: "AGRIVA E2E COD Test Product" }).waitFor({ state: "visible" });
  await buyer.page.getByRole("button", { name: "Buy Now", exact: true }).first().click();
  const codForm = buyer.page.locator("#direct-cod-form");
  await codForm.waitFor({ state: "visible" });
  await codForm.locator('input[autocomplete="name"]').fill("AGRIVA E2E Buyer");
  await codForm.locator('input[autocomplete="tel"]').fill("01712345678");
  const addressSelects = codForm.locator("select");
  await addressSelects.nth(0).selectOption({ index: 1 });
  await buyer.page.waitForFunction(() => {
    const selects = document.querySelectorAll("#direct-cod-form select");
    return selects.length === 2 && selects[1].options.length > 1;
  });
  await addressSelects.nth(1).selectOption({ index: 1 });
  await codForm.getByRole("button", { name: "ক্যাশ অন ডেলিভারিতে অর্ডার নিশ্চিত করুন" }).click();
  await buyer.page.getByRole("status").filter({ hasText: "অর্ডার নিশ্চিত হয়েছে" }).waitFor({ state: "visible", timeout: 30_000 });

  const { data: orders, error: orderReadError } = await db
    .from("marketplace_orders")
    .select("id,buyer_id,farmer_id,product_id,quantity,unit_price,delivery_fee,total_amount,payment_method,payment_status,status,seller_organization_id")
    .eq("buyer_id", buyerUser.id)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (orderReadError) throw orderReadError;
  const order = orders?.[0];
  check(Boolean(order), "COD checkout created a Marketplace order in the isolated database");
  check(order.payment_method === "cod" && order.payment_status === "pending", "COD order persisted with pending collection status");
  check(order.status === "processing" && order.quantity === 1, "COD order entered processing with the requested quantity");
  check(Number(order.delivery_fee) === 70 && Number(order.total_amount) === 190, "server-calculated packet delivery fee and COD total are correct");
  check(Boolean(order.seller_organization_id), "checkout snapshotted the verified seller organization");

  const { data: afterCheckout, error: stockReadError } = await db
    .from("products").select("stock").eq("id", productId).single();
  if (stockReadError) throw stockReadError;
  check(Number(afterCheckout.stock) === 7, "COD checkout decremented inventory exactly once");

  // 3. Seller submits a new draft through the actual seller UI and cancels the COD order.
  const seller = await newContext("seller-workflow");
  await signIn(seller.page, sellerEmail, seededPassword);
  await seller.page.goto("/seller/products/new");
  await seller.page.getByRole("heading", { name: "ব্যবসার পণ্য যোগ করুন" }).waitFor({ state: "visible" });
  const submittedSlug = "e2e-seller-submission-" + (process.env.GITHUB_RUN_ID || "local");
  await seller.page.locator("label").filter({ hasText: "পণ্যের নাম" }).locator("input").first().fill("AGRIVA E2E Seller Submission");
  await seller.page.locator("label").filter({ hasText: "Product URL Slug" }).locator("input").first().fill(submittedSlug);
  await seller.page.locator("label").filter({ hasText: "প্রতি এককের মূল্য" }).locator("input").first().fill("99");
  await seller.page.locator("label").filter({ hasText: "স্টক (একক অনুযায়ী)" }).locator("input").first().fill("5");
  await seller.page.getByRole("button", { name: "SEO details-সহ পর্যালোচনার জন্য জমা দিন" }).click();
  await seller.page.getByRole("status").filter({ hasText: "পণ্যটি অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে" }).waitFor({ state: "visible", timeout: 30_000 });

  const { data: submittedProduct, error: submittedProductError } = await db
    .from("products").select("id,farmer_id,status,seller_organization_id")
    .eq("slug", submittedSlug).single();
  if (submittedProductError) throw submittedProductError;
  check(submittedProduct.farmer_id === (await db.auth.admin.listUsers({ page: 1, perPage: 100 })).data.users.find((user) => user.email?.toLowerCase() === sellerEmail.toLowerCase())?.id,
    "seller submission is bound to the authenticated seller");
  check(submittedProduct.status === "draft", "seller submission remains a draft pending admin moderation");

  await seller.page.goto("/seller/orders");
  const orderCard = seller.page.locator("article").filter({ hasText: "AGRIVA E2E COD Test Product" }).first();
  await orderCard.waitFor({ state: "visible", timeout: 30_000 });
  await orderCard.locator('select[name="status"]').selectOption("cancelled");
  await orderCard.getByRole("button", { name: "আপডেট করুন" }).click();
  await seller.page.waitForURL((url) => url.pathname === "/seller/orders" && url.searchParams.get("notice") === "saved", { timeout: 30_000 });

  const { data: cancelledOrder, error: cancelledReadError } = await db
    .from("marketplace_orders").select("status").eq("id", order.id).single();
  if (cancelledReadError) throw cancelledReadError;
  check(cancelledOrder.status === "cancelled", "seller-authorized cancellation completed through the order status RPC");

  // Retry the same transition through a real authenticated seller client to prove idempotency.
  const sellerClient = createClient(supabaseURL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: sellerLoginError } = await sellerClient.auth.signInWithPassword({
    email: sellerEmail, password: seededPassword,
  });
  if (sellerLoginError) throw sellerLoginError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await sellerClient.rpc("set_marketplace_order_status", {
      p_order_id: order.id, p_status: "cancelled",
    });
    if (error) throw error;
  }
  const { data: afterCancel, error: afterCancelError } = await db
    .from("products").select("stock").eq("id", productId).single();
  if (afterCancelError) throw afterCancelError;
  check(Number(afterCancel.stock) === 8, "cancellation restored stock once; repeated cancellation did not double-restock");

  // 4. Test positive admin access with a separate seeded, test-only admin identity.
  const admin = await newContext("admin-authorization");
  await signIn(admin.page, adminEmail, seededPassword);
  await admin.page.goto("/admin");
  await admin.page.getByRole("heading", { name: "Admin Dashboard" }).waitFor({ state: "visible", timeout: 30_000 });
  check(true, "test-only admin can access the admin console");

  if (pageErrors.length) throw new Error("Uncaught browser errors:\n" + pageErrors.join("\n"));
  console.log("\nAll isolated Marketplace full browser E2E checks passed.");
} finally {
  await Promise.all(contexts.map((context) => context.close()));
  await browser.close();
}

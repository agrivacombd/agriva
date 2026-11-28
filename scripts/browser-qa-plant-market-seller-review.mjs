import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.AGRIVA_QA_ADMIN_EMAIL;
const adminPassword = process.env.AGRIVA_QA_ADMIN_PASSWORD;
const adminId = process.env.AGRIVA_QA_ADMIN_USER_ID;
const nurseryAppId = process.env.AGRIVA_QA_PLANT_NURSERY_APP_ID;
const nurseryUserId = process.env.AGRIVA_QA_PLANT_NURSERY_USER_ID;
const growerAppId = process.env.AGRIVA_QA_PLANT_GROWER_APP_ID;
const growerUserId = process.env.AGRIVA_QA_PLANT_GROWER_USER_ID;

for (const [name, value] of Object.entries({
  supabaseUrl, serviceKey, adminEmail, adminPassword, adminId,
  nurseryAppId, nurseryUserId, growerAppId, growerUserId,
})) assert.ok(value, `${name} is required for authenticated seller-review browser QA`);

async function serviceRead(path) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const text = await response.text();
  assert.equal(response.status, 200, `Service verification query failed: ${path} — ${text}`);
  return text ? JSON.parse(text) : null;
}

const browser = await chromium.launch({ headless: true });
const results = [];
const pageErrors = [];
await mkdir("test-results/plant-market-seller-review", { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/login?next=%2Fadmin%2Fplant-market-applications`, { waitUntil: "domcontentloaded" });
  const consentDialog = page.getByRole("dialog", { name: "কুকি ও গোপনীয়তা পছন্দ" });
  await consentDialog.waitFor({ state: "visible", timeout: 10000 });
  await consentDialog.getByRole("button", { name: "শুধু প্রয়োজনীয়", exact: true }).click();
  await consentDialog.waitFor({ state: "hidden" });
  await page.getByLabel("ইমেইল ঠিকানা").fill(adminEmail);
  await page.locator('input[autocomplete="current-password"]').fill(adminPassword);
  await page.getByRole("button", { name: "লগইন করুন", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15000 });

  const route = "/admin/plant-market-applications";
  await page.goto(`${baseUrl}${route}?status=pending&category=nursery_owner`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Plant Market seller verification" }).waitFor();
  await page.getByRole("heading", { name: "Nursery & plant seller checks" }).waitFor();
  await page.getByText("Synthetic Green Nursery", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("Synthetic Plant Grower", { exact: true }).count(), 0, "Nursery category filter must exclude plant growers");
  await page.getByText("Nursery name & location").waitFor();
  await page.getByText("Seller policy consent").waitFor();
  await page.getByText("Application history (1 events)").waitFor();
  await page.getByRole("link", { name: /Nursery \/ plant photos/ }).waitFor();
  results.push({ test: "authenticated Plant Market queue renders nursery application, checklist, lifecycle history and private evidence link", status: "passed" });

  await page.goto(`${baseUrl}${route}?status=pending&category=plant_grower`, { waitUntil: "domcontentloaded" });
  await page.getByText("Synthetic Plant Grower", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("Synthetic Green Nursery", { exact: true }).count(), 0, "Plant grower category filter must exclude nursery owners");
  results.push({ test: "Plant Market category filter isolates plant growers from nursery owners", status: "passed" });

  const widths = [390, 768, 1024, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.document <= dimensions.viewport + 1, `Plant Market review workspace overflows at ${width}px: ${JSON.stringify(dimensions)}`);
    await page.screenshot({
      path: `test-results/plant-market-seller-review/plant-market-review-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    results.push({ test: `Plant Market review responsive layout at ${width}px`, status: "passed", ...dimensions });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/command-center`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open admin navigation" }).click();
  const nav = page.getByRole("dialog", { name: "Admin navigation" });
  await nav.getByRole("textbox", { name: "Search admin pages" }).fill("Plant Market verification");
  await nav.locator('a[href="/admin/plant-market-applications"]').waitFor({ state: "visible" });
  await nav.locator('a[href="/admin/plant-market-applications"]').click();
  await page.getByRole("heading", { name: "Plant Market seller verification" }).waitFor();
  results.push({ test: "mobile Admin navigation search opens the dedicated Plant Market verification workspace", status: "passed" });

  await page.goto(`${baseUrl}${route}?status=pending&category=nursery_owner`, { waitUntil: "domcontentloaded" });
  const nurseryCard = page.locator("article").filter({ hasText: "Synthetic Green Nursery" });
  await nurseryCard.getByRole("button", { name: "Approve & grant access" }).waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await nurseryCard.getByRole("button", { name: "Approve & grant access" }).click();
  await nurseryCard.waitFor({ state: "detached", timeout: 15000 });
  await page.goto(`${baseUrl}${route}?status=approved&category=nursery_owner`, { waitUntil: "domcontentloaded" });
  await page.getByText("Synthetic Green Nursery", { exact: true }).first().waitFor();
  await page.getByText("approved", { exact: true }).waitFor();
  results.push({ test: "Admin confirms and approves a Plant Market nursery application", status: "passed" });

  const nurseryRows = await serviceRead(`/rest/v1/module_access_applications?id=eq.${nurseryAppId}&select=id,user_id,module,status,reviewed_by,review_note`);
  assert.equal(nurseryRows.length, 1);
  assert.equal(nurseryRows[0].status, "approved");
  assert.equal(nurseryRows[0].module, "plant_market");
  assert.equal(nurseryRows[0].reviewed_by, adminId);
  const nurseryGrants = await serviceRead(`/rest/v1/user_module_grants?user_id=eq.${nurseryUserId}&module=eq.plant_market&select=permission,status,scope_type,scope_id`);
  assert.deepEqual(new Set(nurseryGrants.filter((grant) => grant.status === "active").map((grant) => grant.permission)), new Set(["read", "create"]));
  assert.ok(nurseryGrants.filter((grant) => grant.status === "active").every((grant) => grant.scope_type === "global" && grant.scope_id === null), "Plant Market grants must remain global");
  const nurseryProfile = await serviceRead(`/rest/v1/gardener_profiles?user_id=eq.${nurseryUserId}&select=verification_status,district`);
  assert.equal(nurseryProfile[0]?.verification_status, "verified");
  const nurseryEvents = await serviceRead(`/rest/v1/module_access_application_events?application_id=eq.${nurseryAppId}&select=event_type,note`);
  assert.ok(nurseryEvents.some((event) => event.event_type === "approved"), "Approval must create a lifecycle event");
  results.push({ test: "approved nursery receives verified gardener profile, global read/create grants and approval audit event", status: "passed" });

  await page.goto(`${baseUrl}${route}?status=pending&category=plant_grower`, { waitUntil: "domcontentloaded" });
  const growerCard = page.locator("article").filter({ hasText: "Synthetic Plant Grower" });
  await growerCard.getByRole("textbox", { name: "Review note" }).fill("Synthetic review rejected: supplier provenance evidence is incomplete.");
  page.once("dialog", (dialog) => dialog.accept());
  await growerCard.getByRole("button", { name: "Reject" }).click();
  await growerCard.waitFor({ state: "detached", timeout: 15000 });
  await page.goto(`${baseUrl}${route}?status=rejected&category=plant_grower`, { waitUntil: "domcontentloaded" });
  await page.getByText("Synthetic Plant Grower", { exact: true }).first().waitFor();
  results.push({ test: "Admin rejects a Plant Market grower application with a mandatory review note", status: "passed" });

  const growerRows = await serviceRead(`/rest/v1/module_access_applications?id=eq.${growerAppId}&select=id,user_id,module,status,reviewed_by,review_note`);
  assert.equal(growerRows.length, 1);
  assert.equal(growerRows[0].status, "rejected");
  assert.equal(growerRows[0].module, "plant_market");
  assert.equal(growerRows[0].reviewed_by, adminId);
  assert.match(growerRows[0].review_note || "", /supplier provenance evidence is incomplete/);
  const growerGrants = await serviceRead(`/rest/v1/user_module_grants?user_id=eq.${growerUserId}&module=eq.plant_market&select=permission,status`);
  assert.equal(growerGrants.filter((grant) => grant.status === "active").length, 0, "Rejected applicant must not receive active module grants");
  const growerProfile = await serviceRead(`/rest/v1/gardener_profiles?user_id=eq.${growerUserId}&select=verification_status`);
  assert.equal(growerProfile[0]?.verification_status, "rejected");
  const growerEvents = await serviceRead(`/rest/v1/module_access_application_events?application_id=eq.${growerAppId}&select=event_type,note`);
  assert.ok(growerEvents.some((event) => event.event_type === "rejected" && /supplier provenance/.test(event.note || "")), "Rejection must create a note-bearing lifecycle event");
  results.push({ test: "rejected grower receives rejected profile, no seller grant and note-bearing audit event", status: "passed" });

  assert.deepEqual(pageErrors, [], `Uncaught browser runtime errors: ${pageErrors.join("; ")}`);
  results.push({ test: "no uncaught browser runtime errors", status: "passed" });
  console.log(JSON.stringify({ status: "passed", results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", results, error: error?.stack ?? String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}

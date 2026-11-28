import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import axe from "axe-core";
import { chromium } from "playwright";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir("test-results", { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const publicDemandResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/rest/v1/buyer_demands") && response.request().method() === "GET",
  );
  const publicDemandPage = await page.goto(`${baseUrl}/buyer-demands`, { waitUntil: "domcontentloaded" });
  assert.equal(publicDemandPage?.status(), 200, "Public buyer demand board should render");
  const publicDemandResponse = await publicDemandResponsePromise;
  assert.equal(publicDemandResponse.status(), 200, "Public buyer demand PostgREST read should succeed");
  const publicSelect = new URL(publicDemandResponse.url()).searchParams.get("select") ?? "";
  assert.ok(!publicSelect.split(",").includes("contact_phone"), `Public board requested private contact_phone: ${publicSelect}`);
  const publicBoardText = await page.locator("body").innerText();
  assert.ok(!publicBoardText.includes("01700000000"), "Public buyer demand board leaked the synthetic private phone");
  results.push({ test: "public buyer demand browser query omits contact_phone and renders no private phone", status: "passed" });

  const loginResponse = await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  assert.equal(loginResponse?.status(), 200, "Login page should render successfully");
  await page.getByRole("heading", { name: /আপনার AGRIVA অ্যাকাউন্টে লগইন করুন|sign in to your agriva account/i }).waitFor();
  const consentDialog = page.getByRole("dialog", { name: "কুকি ও গোপনীয়তা পছন্দ" });
  if (await consentDialog.count()) {
    await consentDialog.getByRole("button", { name: "শুধু প্রয়োজনীয়", exact: true }).click();
    await consentDialog.waitFor({ state: "hidden" });
  }
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
  const mobileLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(mobileLayout.document <= mobileLayout.viewport + 1, `Login page overflows mobile viewport: ${JSON.stringify(mobileLayout)}`);
  results.push({ test: "login page renders at mobile width without horizontal overflow", status: "passed", ...mobileLayout });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: "test-results/login-desktop.png", fullPage: true });
  const desktopLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(desktopLayout.document <= desktopLayout.viewport + 1, `Login page overflows desktop viewport: ${JSON.stringify(desktopLayout)}`);
  results.push({ test: "login page renders at desktop width without horizontal overflow", status: "passed", ...desktopLayout });

  for (const path of ["/admin", "/admin/demand-intelligence"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 });
    assert.equal(new URL(page.url()).pathname, "/login", `${path} must redirect unauthenticated visitors to login`);
    results.push({ test: `${path} redirects unauthenticated browser to /login`, status: "passed", httpStatus: response?.status() ?? null });
  }


  const adminEmail = process.env.AGRIVA_QA_ADMIN_EMAIL;
  const adminPassword = process.env.AGRIVA_QA_ADMIN_PASSWORD;
  assert.ok(adminEmail && adminPassword, "Synthetic admin credentials must be provisioned by the isolated Supabase fixture");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/login?next=%2Fadmin%2Fcommand-center`, { waitUntil: "networkidle" });
  await page.getByLabel("ইমেইল ঠিকানা").fill(adminEmail);
  await page.locator('input[autocomplete="current-password"]').fill(adminPassword);
  await page.getByRole("button", { name: "লগইন করুন", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15_000 });
  await page.goto(`${baseUrl}/admin/command-center`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Business Command Center" }).waitFor();

  const assertNoHorizontalOverflow = async (label) => {
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.document <= dimensions.viewport + 1, `${label} admin layout overflows: ${JSON.stringify(dimensions)}`);
    results.push({ test: `${label} Admin Command Center has no horizontal overflow`, status: "passed", ...dimensions });
  };

  await assertNoHorizontalOverflow("mobile 390px");
  await page.screenshot({ path: "test-results/admin-command-center-mobile.png", fullPage: true });
  const openMenu = page.getByRole("button", { name: "Open admin navigation" });
  await openMenu.waitFor({ state: "visible" });
  await openMenu.click();
  const mobileNavigation = page.getByRole("dialog", { name: "Admin navigation" });
  await mobileNavigation.waitFor({ state: "visible" });
  const navigationSearch = page.getByRole("textbox", { name: "Search admin pages" });
  await navigationSearch.fill("Seller applications");
  await mobileNavigation.locator('a[href="/admin/seller-applications"]').waitFor({ state: "visible" });
  await navigationSearch.fill("Plant Market verification");
  await mobileNavigation.locator('a[href="/admin/plant-market-applications"]').waitFor({ state: "visible" });
  await navigationSearch.fill("");
  await mobileNavigation.getByRole("complementary").getByRole("button", { name: "Close navigation" }).click();
  results.push({ test: "mobile admin drawer opens, page search filters links, and drawer closes", status: "passed" });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(100);
  await assertNoHorizontalOverflow("tablet 768px");
  await page.screenshot({ path: "test-results/admin-command-center-tablet.png", fullPage: true });
  await page.getByRole("button", { name: "Open admin navigation" }).waitFor({ state: "visible" });
  results.push({ test: "tablet navigation uses mobile drawer breakpoint", status: "passed" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(100);
  await assertNoHorizontalOverflow("desktop 1440px");
  await page.screenshot({ path: "test-results/admin-command-center-desktop.png", fullPage: true });
  await page.getByRole("navigation", { name: "Admin navigation" }).waitFor({ state: "visible" });
  await page.getByRole("textbox", { name: "Search admin pages" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Open admin navigation" }).waitFor({ state: "hidden" });
  results.push({ test: "desktop sidebar and navigation search are visible at 1440px", status: "passed" });


  // Authenticated Admin route smoke + responsive overflow matrix.
  // A route may redirect when the synthetic role lacks a delegated capability;
  // server failures are never accepted as an expected permission boundary.
  const adminRoutes = [
    "/admin", "/admin/command-center", "/admin/access-control", "/admin/ai-content",
    "/admin/articles", "/admin/articles/11111111-1111-4111-8111-111111111111",
    "/admin/audit", "/admin/categories", "/admin/content-drafts", "/admin/content-studio",
    "/admin/custom-orders", "/admin/demand-intelligence", "/admin/finance",
    "/admin/green-exchange", "/admin/growth-intelligence", "/admin/harvest",
    "/admin/identity-verification", "/admin/jobs", "/admin/opportunities",
    "/admin/plant-market-applications",
    "/admin/orders", "/admin/plant-market-products", "/admin/products", "/admin/reports",
    "/admin/search-intelligence", "/admin/search-intelligence/opportunities",
    "/admin/seed-information", "/admin/seller-applications", "/admin/seo",
    "/admin/seo-pages", "/admin/settings", "/admin/transport", "/admin/users",
  ];
  const responsiveWidths = [390, 768, 1024, 1440];
  const routeResults = [];
  const accessibilityAudits = [];
  for (const route of adminRoutes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const status = response?.status() ?? 0;
    assert.ok(status < 500, `Authenticated Admin route returned server error: ${route} (${status})`);
    const landedPath = new URL(page.url()).pathname;
    const redirected = landedPath !== route;
    if (!redirected && status !== 404) {
      const routeSlug = (route.startsWith("/admin/") ? route.slice(7) : "overview").replaceAll("/", "-") || "overview";
      for (const width of responsiveWidths) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
        if (width === 390) await page.addScriptTag({ content: axe.source });
        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
        }));
        assert.ok(dimensions.document <= dimensions.viewport + 1, `${route} overflows at ${width}px: ${JSON.stringify(dimensions)}`);
        await page.screenshot({
          path: `test-results/admin-route-matrix/${routeSlug}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
        if (width === 390 || width === 1440) {
          const audit = await page.evaluate(async () => {
            const result = await window.axe.run(document, {
              runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
            });
            return {
              violations: result.violations.map((violation) => ({
                id: violation.id, impact: violation.impact, help: violation.help,
                nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
              })),
              passes: result.passes.length, incomplete: result.incomplete.length,
            };
          });
          accessibilityAudits.push({ route, width, ...audit });
        }
      }
    }
    routeResults.push({ route, status, landedPath, permissionRedirect: redirected });
  }
  const expectedCanonicalRedirect = "/admin/articles/11111111-1111-4111-8111-111111111111";
  const expectedCapabilityGatedRoutes = new Set(["/admin/access-control", "/admin/finance"]);
  const unexpectedPermissionRedirects = routeResults.filter(item => item.permissionRedirect && item.route !== expectedCanonicalRedirect && !expectedCapabilityGatedRoutes.has(item.route));
  const missingCapabilityRedirects = routeResults.filter(item => expectedCapabilityGatedRoutes.has(item.route) && !item.permissionRedirect);
  assert.deepEqual(unexpectedPermissionRedirects, [], `Unexpected Admin route permission redirects: ${JSON.stringify(unexpectedPermissionRedirects)}`);
  assert.deepEqual(missingCapabilityRedirects, [], `Capability-gated Admin routes failed to enforce access: ${JSON.stringify(missingCapabilityRedirects)}`);
  results.push({
    test: "authenticated Admin route matrix and 390/768/1024/1440 responsive overflow",
    status: "passed",
    routes: routeResults.length,
    responsiveWidths,
    permissionRedirects: routeResults.filter(item => item.permissionRedirect).map(item => item.route),
    routeResults,
  });
  await page.setViewportSize({ width: 1440, height: 900 });

  const apiResult = await page.evaluate(async (base) => {
    const response = await fetch(`${base}/api/buyer-demands/convert-to-rfq`, {
      method: "POST",
      credentials: "omit",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        demandId: "11111111-1111-4111-8111-111111111111",
        buyerType: "individual",
        visibility: "private",
        quoteDeadline: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    return { status: response.status, body: await response.json() };
  }, baseUrl);
  assert.ok([401, 403].includes(apiResult.status), `Unauthenticated browser API request must be rejected: ${JSON.stringify(apiResult)}`);
  results.push({ test: "RFQ conversion API rejects unauthenticated browser request", status: "passed", httpStatus: apiResult.status });

  await writeFile("test-results/admin-wcag-audit.json", JSON.stringify(accessibilityAudits, null, 2));
  const violationCount = accessibilityAudits.reduce((total, audit) => total + audit.violations.length, 0);
  results.push({ test: "automated axe WCAG 2.2 AA audit artifact generated for authenticated Admin routes at 390px and 1440px", status: "completed", audits: accessibilityAudits.length, violations: violationCount });
  assert.deepEqual(pageErrors, [], `Browser runtime errors: ${pageErrors.join("; ")}`);
  results.push({ test: "no uncaught browser runtime errors", status: "passed" });

  console.log(JSON.stringify({ status: "passed", results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", results, error: error?.stack ?? String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}

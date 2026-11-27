import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir("test-results", { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const loginResponse = await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  assert.equal(loginResponse?.status(), 200, "Login page should render successfully");
  await page.getByRole("heading", { name: /আপনার AGRIVA অ্যাকাউন্টে লগইন করুন|sign in to your agriva account/i }).waitFor();
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

  const apiResult = await page.evaluate(async (base) => {
    const response = await fetch(`${base}/api/buyer-demands/convert-to-rfq`, {
      method: "POST",
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
  assert.equal(apiResult.status, 401, `Unauthenticated browser API request must return 401: ${JSON.stringify(apiResult)}`);
  results.push({ test: "RFQ conversion API rejects unauthenticated browser request", status: "passed", httpStatus: apiResult.status });

  assert.deepEqual(pageErrors, [], `Browser runtime errors: ${pageErrors.join("; ")}`);
  results.push({ test: "no uncaught browser runtime errors", status: "passed" });

  console.log(JSON.stringify({ status: "passed", results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", results, error: error?.stack ?? String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}

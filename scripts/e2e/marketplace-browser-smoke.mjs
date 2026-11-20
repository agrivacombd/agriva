import { chromium } from "playwright";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const routes = ["/", "/marketplace", "/login"];
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  const readinessDeadline = Date.now() + 90_000;
  let ready = false;
  while (Date.now() < readinessDeadline) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The Next.js server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  if (!ready) throw new Error(`Application did not become ready at ${baseURL}`);

  for (const route of routes) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    try {
      const response = await page.goto(new URL(route, baseURL).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      if (!response || response.status() >= 400) {
        throw new Error(`HTTP response ${response?.status() ?? "missing"}`);
      }
      await page.locator("body").waitFor({ state: "visible" });
      const bodyText = await page.locator("body").innerText();
      if (!bodyText.trim()) throw new Error("Page rendered an empty body");
      if (pageErrors.length) throw new Error(pageErrors.join(" | "));
      console.log(`PASS ${route} (HTTP ${response.status()})`);
    } catch (error) {
      failures.push(`${route}: ${error.message}`);
      console.error(`FAIL ${route}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("\nBrowser E2E failures:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nAll isolated Marketplace browser route checks passed.");
}

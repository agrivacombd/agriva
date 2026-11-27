import { test, expect } from "@playwright/test";

const password = "AGRIVA-E2E-Only-2026!";
const personas = [
  { name: "Farmer", email: "e2e-farmer@example.test", expected: /স্বাগতম, E2E Farmer/i },
  { name: "Buyer", email: "e2e-buyer@example.test", expected: /স্বাগতম, E2E Buyer/i },
  { name: "Wholesaler applicant", email: "e2e-wholesaler@example.test", expected: /স্বাগতম, E2E Wholesaler Applicant/i },
];

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("ইমেইল ঠিকানা").fill(email);
  await page.getByLabel("পাসওয়ার্ড", { exact: true }).fill(password);
  await page.getByRole("button", { name: "লগইন করুন" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
}

for (const persona of personas) {
  test(`${persona.name}: authenticated dashboard and notification inbox`, async ({ page }) => {
    await signIn(page, persona.email);
    await expect(page.getByRole("heading", { name: persona.expected })).toBeVisible();

    await page.getByRole("button", { name: /নোটিফিকেশন/ }).click();
    await expect(page.getByText("এখনো কোনো নোটিফিকেশন নেই")).toBeVisible();
    await page.getByRole("link", { name: "সব নোটিফিকেশন" }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole("heading", { name: "নোটিফিকেশন" })).toBeVisible();
  });

  test(`${persona.name}: notification preferences load and save`, async ({ page }) => {
    await signIn(page, persona.email);
    await page.goto("/notifications/preferences");
    await expect(page.getByRole("heading", { name: "নোটিফিকেশন পছন্দ" })).toBeVisible();
    const digest = page.getByRole("checkbox", { name: /সাপ্তাহিক সারাংশ/ });
    await expect(digest).toBeVisible();
    await digest.check();
    await page.getByRole("button", { name: "পছন্দ সংরক্ষণ করুন" }).click();
    await expect(page.getByRole("status")).toContainText("সংরক্ষণ হয়েছে");
  });
}

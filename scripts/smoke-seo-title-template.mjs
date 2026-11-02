import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("app/layout.tsx", "utf8");
assert.match(layout, /template:\s*"%s \| AGRIVA"/, "The global title template should add the brand exactly once");

const pages = [
  "app/about-us/page.tsx",
  "app/contact-us/page.tsx",
  "app/contact/page.tsx",
  "app/marketplace/page.tsx",
  "app/jobs/page.tsx",
  "app/weather/page.tsx",
  "app/market-prices/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/terms-of-service/page.tsx",
  "app/sell-harvest/page.tsx",
  "app/buyer-demands/page.tsx",
];

for (const path of pages) {
  const source = readFileSync(path, "utf8");
  const metadata = source.match(/export const metadata[\s\S]*?\n};/);
  assert.ok(metadata, `${path} should export page metadata`);
  const title = metadata[0].match(/title:\s*["'`]([^"'`]+)["'`]/);
  assert.ok(title, `${path} should define a static title`);
  assert.doesNotMatch(title[1], /AGRIVA/i, `${path} should rely on the global brand suffix`);
}

console.log("SEO title template checks passed.");

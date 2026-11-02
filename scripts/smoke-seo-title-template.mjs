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
  "app/plant-market/cart/page.tsx",
  "app/plant-market/checkout/page.tsx",
  "app/plant-market/orders/page.tsx",
  "app/orders/page.tsx",
  "app/marketplace/buy/page.tsx",
  "app/en/soil-fertilizer/page.tsx",
];

for (const path of pages) {
  const source = readFileSync(path, "utf8");
  const metadata = source.match(/export const metadata[\\s\\S]*?};/);
  assert.ok(metadata, `${path} should export page metadata`);
  const title = metadata[0].match(/title:\s*["'`]([^"'`]+)["'`]/);
  assert.ok(title, `${path} should define a static title`);
  assert.doesNotMatch(title[1], /AGRIVA/i, `${path} should rely on the global brand suffix`);
}

console.log("SEO title template checks passed.");

const plantProduct = readFileSync("app/plant-market/[slug]/page.tsx", "utf8");
assert.doesNotMatch(plantProduct.match(/return \{title:[^}]+\}/)?.[0] ?? "", /AGRIVA/i, "Plant Market product title should rely on the global suffix");
const marketplaceProduct = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
assert.match(marketplaceProduct, /const title = name[\s\S]*?const socialTitle = title \+ " \| AGRIVA"/, "Marketplace metadata title and social title should be separated");
const jobSeo = readFileSync("lib/jobs/seo.ts", "utf8");
assert.match(jobSeo, /const title = `\$\{job\.title\} — \$\{location\}`/);
assert.match(jobSeo, /const socialTitle = `\$\{title\} \| AGRIVA Jobs`/);
const greenExchange = readFileSync("app/green-exchange/[slug]/page.tsx", "utf8");
assert.doesNotMatch(greenExchange.match(/title:\s*`[^`]+`/)?.[0] ?? "", /AGRIVA/i, "Green Exchange listing title should rely on the global suffix");
const lesson = readFileSync("app/learn/[slug]/page.tsx", "utf8");
assert.doesNotMatch(lesson.match(/if \(!lesson\)[\s\S]*?return \{ title: "[^"]+"/)?.[0] ?? "", /AGRIVA/i, "Lesson fallback title should rely on the global suffix");
const jobPage = readFileSync("app/jobs/[slug]/page.tsx", "utf8");
assert.doesNotMatch(jobPage.match(/: \{title:"[^"]+"/)?.[0] ?? "", /AGRIVA/i, "Job fallback title should rely on the global suffix");

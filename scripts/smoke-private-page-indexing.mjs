#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const paths = ["login", "signup", "checkout", "cart", "orders", "forgot-password", "reset-password", "profile", "dashboard", "admin"];
for (const name of paths) {
  const layout = read(`app/${name}/layout.tsx`);
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/,
    `/${name} should not be indexed`);
}
const demand = read("app/buyer-demands/page.tsx");
assert.match(demand, /title:\s*"ক্রেতার চাহিদা"/,
  "Buyer Demands should inherit the shared AGRIVA title suffix only once");
assert.doesNotMatch(demand, /title:\s*"ক্রেতার চাহিদা \| AGRIVA"/,
  "Avoid duplicate brand in the HTML document title");
for (const path of ["app/about-us/page.tsx", "app/contact-us/page.tsx", "app/market-prices/page.tsx", "app/sell-harvest/page.tsx", "app/sell-on-marketplace/page.tsx", "app/jobs/page.tsx"]) {
  const source = read(path);
  const title = source.match(/export const metadata[^]*?\\btitle:\\s*"([^"]+)"/)?.[1];
  assert.ok(title, `Expected a static page metadata title in ${path}`);
  assert.doesNotMatch(title, /AGRIVA/i,
    `${path} should inherit AGRIVA once via the root title template`);
}
console.log("Public SEO title and private route indexing regression checks passed.");

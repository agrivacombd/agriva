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
console.log("Public SEO title and private route indexing regression checks passed.");

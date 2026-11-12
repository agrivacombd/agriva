import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const links = readFileSync("lib/seo/internal-links.ts","utf8");
const keyword = readFileSync("app/api/admin/seo/keywords/route.ts","utf8");
const article = readFileSync("app/api/admin/article/generate/route.ts","utf8");
assert.match(links, /suggestSeoInternalLinks/);
for (const path of ["/marketplace", "/plant-market", "/tools/seed-rate-calculator", "/tools/fertilizer-calculator", "/tools/crop-disease-assistant", "/learn"]) {
  assert.ok(links.includes(path), "Missing AGRIVA feature: "+path);
}
assert.match(links, /filter\(x => x.score > 0\)/);
assert.match(keyword, /internalLinkSuggestions: suggestSeoInternalLinks\(topic\)/);
assert.match(article, /internalLinkSuggestions: internalLinks, seoAudit, requiresHumanReview: true/);
assert.doesNotMatch(article, /status: "published"/);
console.log("SEO internal-link catalogue and editorial review contracts passed");

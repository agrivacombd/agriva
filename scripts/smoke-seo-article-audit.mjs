import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const audit = readFileSync("lib/seo/article-audit.ts", "utf8");
const route = readFileSync("app/api/admin/seo/audit/route.ts", "utf8");
const generate = readFileSync("app/api/admin/article/generate/route.ts", "utf8");
for (const name of ["title-length","title-keyword","description-length","description-keyword",
  "article-title","structure-h2","structure-hierarchy","content-depth","keyword-intro",
  "keyword-heading","internal-links","internal-relevance","link-anchor","link-format"]) {
  assert.ok(audit.includes('"' + name + '"'), "Missing SEO audit: " + name);
}
assert.match(audit, /requiresHumanReview: true/);
assert.match(route, /requireAdminApi\("content.read"\)/);
assert.match(route, /auditSeoArticle\(/);
assert.match(generate, /seoAudit = auditSeoArticle\(/);
assert.match(generate, /seoAudit, requiresHumanReview: true/);
assert.doesNotMatch(route, /\.update\(|\.insert\(/);
console.log("SEO audit API, quality checks and editorial safeguards passed");

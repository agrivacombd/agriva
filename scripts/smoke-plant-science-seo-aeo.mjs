import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/learn/plant-science/page.tsx");
const client = read("../app/learn/plant-science/PlantScienceClient.tsx");
const faqs = read("../app/learn/plant-science/faqs.ts");
const layout = read("../app/layout.tsx");
const robots = read("../app/robots.ts");
const sitemap = read("../app/sitemap.ts");

assert.ok(page.includes('title: "বাংলাদেশের উদ্ভিদ তালিকা ও বৈজ্ঞানিক নাম"'));
assert.ok(page.includes("alternates: { canonical: pageUrl }"));
assert.ok(page.includes("openGraph:") && page.includes("twitter:"));
assert.ok(page.includes('"@type": "CollectionPage"'));
assert.ok(page.includes('"@type": "FAQPage"'));
assert.ok(page.includes('"@type": "BreadcrumbList"'));
assert.ok(page.includes("JSON.stringify(structuredData).replace(/</g"), "JSON-LD must escape less-than characters");
assert.ok(client.includes('aria-labelledby="plant-science-faq"'));
assert.ok(client.includes("plantScienceFaqs.map"));
assert.equal((faqs.match(/question:/g) ?? []).length, 5, "five evidence-aware FAQs should be available to users and structured data");
assert.ok(faqs.includes("ক্যাটালগে থাকা মানেই কোনো প্রজাতি বাংলাদেশের দেশজ"));
assert.ok(faqs.includes("অনুমান করে স্থানীয় নাম যোগ না করে"));
assert.ok(layout.includes('"@type": "Organization"') && layout.includes("#organization"));
assert.ok(layout.includes('"@type": "WebSite"') && layout.includes("#website"));
assert.ok(robots.includes('userAgent: "OAI-SearchBot"'));
const oai = robots.slice(robots.indexOf('userAgent: "OAI-SearchBot"'), robots.indexOf('userAgent: "*'));
for (const path of ["/admin/", "/seller/", "/dashboard/", "/api/", "/auth/", "/orders", "/farms"]) {
  assert.ok(oai.includes(path), `OAI-SearchBot must not crawl private path ${path}`);
}
assert.ok(sitemap.includes('${base}/learn/plant-science'));
console.log("Plant Science SEO/AEO regression checks passed.");

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const layout = read("../app/layout.tsx");
const home = read("../app/page.tsx");
const buyer = read("../components/marketplace/BuyerDemandBoard.tsx");
const cvPage = read("../app/jobs/cv-builder/page.tsx");
const cvClient = read("../components/jobs/CVBuilderClient.tsx");
const cvStorage = read("../lib/jobs/cv/storage.ts");

assert.ok(layout.includes("organizationJsonLd") && layout.includes("#organization"));
assert.equal((home.match(/"@type": "Organization"/g) ?? []).length, 0, "homepage must reuse root Organization entity");
assert.ok(home.includes("publisher: { \"@id\": `${siteUrl}/#organization` }"));
assert.ok(layout.includes('url: "/branding/agriva-brand-social-share-1200x630.png"') &&
  layout.includes('width: 1200') && layout.includes('height: 630'),
  "SEO requires actual 1200x630 AGRIVA social preview metadata");
assert.ok(layout.includes('images: ["/branding/agriva-brand-social-share-1200x630.png"]'),
  "Twitter meta must reuse real branded social image");
assert.ok(!existsSync(new URL("../app/opengraph-image.tsx", import.meta.url)) &&
  !existsSync(new URL("../app/twitter-image.tsx", import.meta.url)),
  "Old Next metadata image routes must not override the new social previews");
assert.ok(!cvPage.includes("\"use client\"") && cvPage.includes("<h1") && cvPage.includes("<CVBuilderClient />"));
assert.ok(cvClient.includes("\"use client\"") && cvClient.includes("loadCV(window.localStorage)"));
assert.ok(cvStorage.includes("CV_STORAGE_KEY") && cvStorage.includes("storage.getItem(CV_STORAGE_KEY)"), "CV data must retain the established browser storage key through the storage adapter");
assert.ok(buyer.includes("const [loadError, setLoadError] = useState(false)"));
assert.ok(buyer.includes("সাময়িক সংযোগ বা ডেটা অ্যাক্সেস সমস্যার কারণে তালিকা লোড হয়নি"));
assert.ok(buyer.includes("loadError ? (") && buyer.includes("void loadBoard()"));
console.log("Phase 1 SEO regression checks passed.");
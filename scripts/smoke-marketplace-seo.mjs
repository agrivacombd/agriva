#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const product = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const category = readFileSync("app/marketplace/category/[categorySlug]/page.tsx", "utf8");
const subcategory = readFileSync("app/marketplace/category/[categorySlug]/[subcategorySlug]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const indexability = readFileSync("lib/marketplace/indexability.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");
const searchLayout = readFileSync("app/search/layout.tsx", "utf8");
const rootLayout = readFileSync("app/layout.tsx", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");
const englishLayout = readFileSync("app/en/layout.tsx", "utf8");
const siteChrome = readFileSync("components/site/SiteChrome.tsx", "utf8");

assert.match(product, /export async function generateMetadata/, "Product page needs unique metadata");
assert.match(product, /alternates:\s*\{\s*canonical:\s*`\/marketplace\/\$\{product\.slug\}`\s*\}/, "Product page needs a slug-based canonical");
assert.match(product, /redirect\(`\/marketplace\/\$\{product\.slug\}`\)/, "Product ID aliases must redirect to the canonical slug URL");
assert.match(product, /"@type": "Product"/, "Product detail needs Product structured data");
assert.match(product, /priceCurrency: "BDT"/, "Offer schema must use BDT");
assert.match(product, /product\.image_url/, "Product image should be exposed in the page and metadata");
assert.match(product, /\.eq\("status", "active"\)/, "Product detail must only return active products");
assert.doesNotMatch(product, /moderation_status/, "Products use status='active' as the public publishing gate");

for (const [label, source] of [["marketplace", marketplace], ["category", category], ["subcategory", subcategory]]) {
  assert.match(source, /\.eq\("status", "active"\)/, `${label} must only list active products`);
  assert.doesNotMatch(source, /moderation_status/, `${label} must use the deployed products schema`);
}
assert.match(sitemap, /from\("products"\)\.select\("slug,updated_at,category,category_slug,subcategory_slug"\)\.eq\("status", "active"\)/, "Product sitemap must use the deployed products schema and exclude non-active products");
assert.match(sitemap, /from\("green_exchange_listings"\)\.select\("slug,updated_at"\)\.eq\("status", "active"\)\.eq\("moderation_status", "approved"\)/, "Green Exchange sitemap must only expose approved active listings");
assert.match(indexability, /\.eq\("status", "active"\)/, "Category indexability must use public active inventory");
assert.doesNotMatch(indexability, /moderation_status/, "Category indexability must use the deployed products schema");

assert.doesNotMatch(sitemap, /lastModified:\s*now/, "Static sitemap entries must not pretend to have changed on every request");

assert.match(sitemap, /const SITEMAP_PAGE_SIZE = 1000/, "Sitemap database reads must use bounded pages");
assert.match(sitemap, /async function fetchAllSitemapRows/, "Sitemap queries must fetch every page instead of silently truncating results");
assert.match(sitemap, /export const dynamic = "force-dynamic"/, "Sitemap route must run at request time rather than fetching Supabase during static build");
assert.match(sitemap, /offset \+= SITEMAP_PAGE_SIZE/, "Sitemap pagination must advance until the final partial page");
assert.match(sitemap, /if \(error\) throw new Error\(`Sitemap query failed:/, "Sitemap query failures must not silently publish incomplete URL sets");
assert.match(sitemap, /\.order\("slug", \{ ascending: true \}\)\.range\(from, to\)/, "Sitemap pagination must use deterministic ordering");
assert.doesNotMatch(sitemap, /\.limit\((?:5000|2000)\)/, "Sitemap queries must not retain the previous hard result caps");

assert.match(sitemap, /\.\.\.\(product\.updated_at \? \{ lastModified: new Date\(product\.updated_at\) \} : \{\}\)/, "Product sitemap lastModified must reflect the real updated_at value only");
assert.match(sitemap, /\.\.\.\(job\.updated_at \? \{ lastModified: new Date\(job\.updated_at\) \} : \{\}\)/, "Job sitemap lastModified must reflect the real updated_at value only");

assert.match(searchLayout, /index:\s*false/, "Internal search results must be noindex");
assert.match(searchLayout, /follow:\s*true/, "Internal search links should remain crawlable");
assert.doesNotMatch(robots, /"\/search"/, "Robots must allow crawlers to read the search page noindex directive");

assert.match(rootLayout, /const requestHeaders = await headers\(\)/, "Root layout must read locale from request headers");
assert.match(rootLayout, /<html lang=\{locale\}>/, "Document language must be server-rendered for each locale");
assert.match(middleware, /request\.headers\.set\("x-agriva-locale", locale\)/, "Middleware must pass the route locale to the root layout");
assert.match(middleware, /request\.nextUrl\.pathname === "\/en" \|\| request\.nextUrl\.pathname\.startsWith\("\/en\/"\)/, "Middleware must identify English routes");
assert.match(siteChrome, /document\.documentElement\.lang = english \? "en" : "bn"/, "Client-side route transitions must keep document language in sync");
assert.match(englishLayout, /twitter:\s*\{[\s\S]*title: "AGRIVA \| Digital Agriculture Platform"/, "English routes must not inherit Bangla Twitter metadata");


// Shared root Open Graph metadata must not force every route to advertise the homepage URL.
assert.match(rootLayout, /openGraph:\s*\{[\s\S]*siteName: "AGRIVA"/, "Root layout should keep shared Open Graph defaults");
assert.doesNotMatch(rootLayout, /openGraph:\s*\{[^}]*url:/, "Root Open Graph URL must not be inherited as the homepage URL on every route");

// Explicit Bangla-English equivalents must publish reciprocal, self-referencing hreflang metadata.
const banglaHome = readFileSync("app/page.tsx", "utf8");
const englishHome = readFileSync("app/en/page.tsx", "utf8");
const banglaCalculators = readFileSync("app/agriculture-calculators/page.tsx", "utf8");
const englishCalculators = readFileSync("app/en/agriculture-calculators/page.tsx", "utf8");
for (const [label, source, self, alternate] of [
  ["Bangla homepage", banglaHome, "/", "/en"],
  ["English homepage", englishHome, "/en", "/"],
  ["Bangla calculator directory", banglaCalculators, "/agriculture-calculators", "/en/agriculture-calculators"],
  ["English calculator directory", englishCalculators, "/en/agriculture-calculators", "/agriculture-calculators"],
]) {
  assert.ok(source.includes("canonical: `" + self + "`") || source.includes('canonical: "' + self + '"'), `${label} must declare its self canonical`);
  assert.match(source, /languages:\\s*\\{/, `${label} must declare language alternates`);
  assert.ok(source.includes(alternate), `${label} must reference its paired locale route`);
}

console.log("Marketplace SEO and locale language regression checks passed.");

#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const get = path => readFileSync(path, "utf8");
const layout = get("app/layout.tsx");
const manifest = get("app/manifest.ts");
const header = get("components/site/SiteChrome.tsx");
const reusable = get("components/BrandLogo.tsx");
const prompt = get("app/pwa-register.tsx");
const pack = JSON.parse(get("package.json"));
assert.equal(existsSync("app/opengraph-image.tsx"), false,
  "Root file-based OG metadata would override the optimized static AGRIVA image");
assert.equal(existsSync("app/twitter-image.tsx"), false,
  "Legacy Twitter metadata route would override static branded social preview or import removed OG routes");
assert.equal(existsSync("app/icon.svg"), false,
  "Root Next.js favicon route would override the official generated favicon");

for (const src of [header, reusable]) {
  assert.ok(src.includes("/branding/agriva-agriculture-brand-logo.svg"), "Both site headers must use the original wordmark");
  assert.ok(src.includes("width={640}") && src.includes("height={158}"), "Intrinsic width/height prevent logo CLS");
  assert.ok(src.includes('alt="AGRIVA'), "Site logo requires descriptive alt text");
}
assert.ok(header.includes("priority") && header.includes("sizes="), "Header logo must load early at appropriate sizes");
assert.ok(layout.includes('"@type": "ImageObject"') && layout.includes('width: 640, height: 158'), "Organization schema must contain explicit logo dimensions");
assert.ok(layout.includes('/branding/agriva-agriculture-brand-logo.svg'), "SEO logo must match visible site wordmark");
assert.ok(layout.includes('/branding/agriva-apple-touch-180.png'), "iOS needs PNG apple-touch icon");
assert.ok(layout.includes('/branding/agriva-favicon-32.png'), "Browser favicon must be PNG");
assert.ok(prompt.includes('/branding/agriva-app-icon-192.png'), "PWA install dialog must display the real AGRIVA brand");
assert.ok(layout.includes('url: "/branding/agriva-brand-social-share-1200x630.png"') &&
  layout.includes("width: 1200") && layout.includes("height: 630") &&
  layout.includes('images: ["/branding/agriva-brand-social-share-1200x630.png"]'),
  "Home Open Graph and Twitter cards must use a large crawlable brand image");
assert.ok(manifest.includes('purpose: "maskable"'), "Android maskable icon is required");
for (const size of ["192", "512"]) {
  assert.ok(manifest.includes(`agriva-app-icon-${size}.png`) && manifest.includes(`sizes: "${size}x${size}"`), "PWA requires correct PNG " + size);
}
assert.ok(pack.scripts.prebuild?.includes("generate-agriva-brand-assets") && pack.scripts.predev?.includes("generate-agriva-brand-assets"), "Asset generation must run on build and dev");

const branding = "public/branding/";
for (const source of ["agriva-original-mark.svg", "agriva-agriculture-brand-logo.svg"]) {
  assert.ok(existsSync(branding + source), "Official source missing: " + source);
}
const fullLogo = await sharp(branding + "agriva-agriculture-brand-logo.svg").metadata();
assert.equal(fullLogo.width, 640);
assert.equal(fullLogo.height, 158);
assert.equal(fullLogo.format, "svg");
const assets = [
  ["agriva-app-icon-192.png", 192],
  ["agriva-app-icon-512.png", 512],
  ["agriva-app-maskable-512.png", 512],
  ["agriva-apple-touch-180.png", 180],
  ["agriva-favicon-32.png", 32],
  ["agriva-google-oauth-120.png", 120],
];
for (const [file, expected] of assets) {
  assert.ok(existsSync(branding + file), "Missing generated icon: " + file);
  const info = await sharp(branding + file).metadata();
  assert.equal(info.width, expected, file + " width mismatch");
  assert.equal(info.height, expected, file + " height mismatch");
  assert.equal(info.format, "png", file + " must use PNG for compatibility");
}
const og = await sharp(branding + "agriva-brand-social-share-1200x630.png").metadata();
assert.equal(og.width, 1200);
assert.equal(og.height, 630);
assert.equal(og.format, "png");
console.log("Official AGRIVA logo, PWA sizes, Apple icon and SEO metadata verified.");

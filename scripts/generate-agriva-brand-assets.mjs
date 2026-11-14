#!/usr/bin/env node
/**
 * Source artwork is cropped from the original owner-supplied AGRIVA PNG.
 * Preserve its colors and shapes; build platform-specific icon dimensions
 * using sharp (already a runtime dependency) without AI redrawing.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dir = fileURLToPath(new URL("../public/branding/", import.meta.url));
const source = join(dir, "agriva-original-mark.svg");
await mkdir(dir, { recursive: true });

const png = { compressionLevel: 9, palette: true, quality: 100, effort: 10 };
const tasks = [
  ["agriva-app-icon-192.png", 192],
  ["agriva-app-icon-512.png", 512],
  ["agriva-apple-touch-180.png", 180],
  ["agriva-favicon-32.png", 32],
];

for (const [name, pixels] of tasks) {
  await sharp(source).resize(pixels, pixels, { fit: "contain" }).png(png).toFile(join(dir, name));
}

// The Google OAuth review logo must include the AGRIVA wordmark, not just
// a generic letter A. Stack the same official A mark and site wordmark.
const oauthMark = await sharp(source)
  .extract({ left: 80, top: 56, width: 355, height: 266 })
  .resize(110, 80, { fit: "contain" })
  .png()
  .toBuffer();
const oauthText = await sharp(join(dir, "agriva-agriculture-brand-logo.svg"))
  .extract({ left: 200, top: 43, width: 440, height: 107 })
  .resize(116, 30, { fit: "contain" })
  .png()
  .toBuffer();
await sharp({
  create: { width: 120, height: 120, channels: 4, background: "#ffffff" },
})
  .composite([
    { input: oauthMark, left: 5, top: 3 },
    { input: oauthText, left: 2, top: 87 },
  ])
  .png(png)
  .toFile(join(dir, "agriva-google-oauth-120.png"));

// Android adaptive/maskable icons must reserve a central safe zone.
await sharp(source)
  .resize(410, 410, { fit: "contain" })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#ffffff" })
  .png(png)
  .toFile(join(dir, "agriva-app-maskable-512.png"));


// An actual 1200×630 raster preview improves appearance of shared home-page
// links on social networks; it does not change product-specific OG images.
const hero = await sharp(join(dir, "agriva-agriculture-brand-logo.svg"))
  .resize({ width: 920, withoutEnlargement: false })
  .png()
  .toBuffer({ resolveWithObject: true });
await sharp({
  create: {
    width: 1200, height: 630, channels: 4,
    background: { r: 246, g: 250, b: 247, alpha: 1 },
  },
})
  .composite([{
    input: hero.data,
    left: Math.floor((1200 - hero.info.width) / 2),
    top: Math.floor((630 - hero.info.height) / 2),
  }])
  .png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 })
  .toFile(join(dir, "agriva-brand-social-share-1200x630.png"));

console.log("Generated official AGRIVA favicon, PWA, Apple and OAuth icons.");

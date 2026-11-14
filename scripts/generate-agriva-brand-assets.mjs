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
const source = join(dir, "agriva-original-mark.webp");
await mkdir(dir, { recursive: true });

const png = { compressionLevel: 9, palette: true, quality: 100, effort: 10 };
const tasks = [
  ["agriva-app-icon-192.png", 192],
  ["agriva-app-icon-512.png", 512],
  ["agriva-apple-touch-180.png", 180],
  ["agriva-favicon-32.png", 32],
  ["agriva-google-oauth-120.png", 120],
];

for (const [name, pixels] of tasks) {
  await sharp(source).resize(pixels, pixels, { fit: "contain" }).png(png).toFile(join(dir, name));
}

// Android adaptive/maskable icons must reserve a central safe zone.
await sharp(source)
  .resize(410, 410, { fit: "contain" })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#ffffff" })
  .png(png)
  .toFile(join(dir, "agriva-app-maskable-512.png"));

console.log("Generated official AGRIVA favicon, PWA, Apple and OAuth icons.");

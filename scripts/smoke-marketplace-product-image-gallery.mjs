import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync("components/seller/SellerProductForm.tsx", "utf8");
const api = readFileSync("app/api/seller/products/route.ts", "utf8");
const detail = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const gallery = readFileSync("components/marketplace/ProductImageGallery.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20261105140000_marketplace_product_image_gallery.sql", "utf8");

assert.match(form, /const MAX_IMAGES = 4/);
assert.match(form, /multiple accept="image\/jpeg,image\/png,image\/webp"/);
assert.doesNotMatch(form, /MAX_IMAGE_SIZE|file\.size\s*>/);
assert.match(form, /image_urls: imageUrls/);
assert.match(api, /imageUrls\.length > 4/);
assert.match(api, /image_urls: imageUrls/);
assert.match(detail, /image_urls\?: string\[\] \| null/);
assert.match(detail, /<ProductImageGallery[\s\S]*images=\{galleryImages\}/);
assert.match(gallery, /images\.map\(\(src, index\) =>/);
assert.match(gallery, /images\.length > 1/);
assert.match(gallery, /finishSwipe/, "Mobile gallery supports horizontal swipe");
assert.match(gallery, /showImage\(dx < 0 \? 1 : -1\)/, "Swipe navigates correctly");
assert.match(gallery, /ArrowRight/, "Lightbox supports keyboard navigation");
assert.match(gallery, /ArrowLeft/, "Lightbox supports keyboard navigation in both directions");
assert.match(gallery, /document\.body\.style\.overflow = "hidden"/, "Lightbox locks background scroll");
assert.match(gallery, /focusReturn\?\.focus\(\)/, "Lightbox restores focus on close");
assert.match(gallery, /activeIndex \+ 1/, "Gallery provides an image counter");
assert.match(migration, /add column if not exists image_urls text\[\]/);
assert.match(migration, /check \(cardinality\(image_urls\) <= 4\)/);
assert.match(migration, /set file_size_limit = null/);

console.log("Marketplace four-image upload smoke checks passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const createForm = readFileSync("components/admin/AdminCreateProductForm.tsx", "utf8");
const createImageField = readFileSync("components/admin/AdminProductImageField.tsx", "utf8");
const editImageField = readFileSync("components/admin/AdminProductImages.tsx", "utf8");
const adminPage = readFileSync("app/admin/products/page.tsx", "utf8");
const adminApi = readFileSync("app/api/admin/products/route.ts", "utf8");
const imageApi = readFileSync("app/api/admin/products/images/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261105130000_admin_product_image_gallery.sql", "utf8");

assert.match(createForm, /AdminProductImageField/);
assert.match(createForm, /image_urls: imageUrls/);
assert.match(createImageField, /const MAX_IMAGES = 4/);
assert.match(createImageField, /multiple accept="image\\/jpeg,image\\/png,image\\/webp"/);
assert.match(createImageField, /name="image_urls"/);
assert.doesNotMatch(createImageField, /MAX_IMAGE_SIZE|file\\.size\\s*>/);
assert.match(adminPage, /AdminProductImages productId/);
assert.match(editImageField, /const MAX_IMAGES = 4/);
assert.match(editImageField, /admin\\/products\\/images/);
assert.match(adminApi, /imageUrls\\.length > 4/);
assert.match(adminApi, /admin_update_product_images/);
assert.match(imageApi, /admin_update_product_images/);
assert.match(migration, /CREATE OR REPLACE FUNCTION public\\.admin_update_product_images/);
assert.match(migration, /cardinality\\(urls\\) > 4/);
assert.match(migration, /admin_audit_log/);

console.log("Admin four-image product gallery smoke checks passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const createForm = readFileSync("components/admin/AdminCreateProductForm.tsx", "utf8");
const imageField = readFileSync("components/admin/AdminProductImageField.tsx", "utf8");
const adminPage = readFileSync("app/admin/products/page.tsx", "utf8");
const adminApi = readFileSync("app/api/admin/products/route.ts", "utf8");

assert.match(createForm, /AdminProductImageField/);
assert.match(createForm, /image_urls: imageUrls/);
assert.match(imageField, /const MAX_IMAGES = 4/);
assert.match(imageField, /multiple accept="image\/jpeg,image\/png,image\/webp"/);
assert.match(imageField, /name="image_urls"/);
assert.doesNotMatch(imageField, /MAX_IMAGE_SIZE|file\.size\s*>/);
assert.match(adminPage, /AdminProductImageField initialImages/);
assert.match(adminPage, /image_urls: imageUrls/);
assert.match(adminApi, /imageUrls\.length > 4/);
assert.match(adminApi, /image_urls: imageUrls/);
assert.match(adminApi, /product-images/);

console.log("Admin four-image product gallery smoke checks passed.");

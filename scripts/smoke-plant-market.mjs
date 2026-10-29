import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/plant-market/page.tsx", "utf8");
const productPage = readFileSync("app/marketplace/[productId]/page.tsx", "utf8");
const form = readFileSync("components/seller/SellerProductForm.tsx", "utf8");
const core = readFileSync("components/marketplace/MarketplaceCore.tsx", "utf8");
const api = readFileSync("app/api/seller/products/route.ts", "utf8");
const home = readFileSync("app/home-client.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const robots = readFileSync("app/robots.ts", "utf8");

assert.match(page, /from\("products"\)/, "Plant Market must use real product inventory");
assert.match(page, /\.eq\("status", "active"\)/, "only active products should appear");
assert.match(page, /\.eq\("category_slug", PLANT_CATEGORY\)/, "Plant Market must query stable plant taxonomy directly");
assert.match(page, /\.is\("category_slug", null\)/, "Plant Market must preserve a legacy-listing fallback");
assert.match(page, /if \(product\.category_slug\) return product\.category_slug === PLANT_CATEGORY/, "stable taxonomy must prevent false-positive text matches");
assert.match(page, /plantSubcategories/, "Plant Market must render SEO-friendly subcategory links");
assert.match(page, /CollectionPage/, "Plant Market landing must describe its page type in JSON-LD");
assert.match(page, /ItemList/, "Plant Market must expose its product list as structured data");
assert.match(page, /BreadcrumbList/, "Plant Market must expose breadcrumb structured data");
assert.match(page, /title: \{ absolute: "গাছ, চারা ও বাগান সামগ্রী বাংলাদেশ \| AGRIVA Plant Market" \}/, "Plant Market must set an absolute SEO title without duplicating the root title template");
assert.match(page, /FAQ|সাধারণ প্রশ্ন/, "Plant Market must answer buyer questions on-page");
assert.match(page, /canonical: "\/plant-market"/, "Plant Market must have canonical metadata");
assert.match(page, /href="\/seller\/products\/new"/, "Plant Market must link sellers to product submission");
assert.match(page, /Grow More, Earn More/i, "Plant Market must include the grow-and-earn campaign");
assert.match(page, /বাগান আপনার শখ, গাছ হতে পারে বাড়তি আয়ের সুযোগ/, "campaign must encourage hobby gardeners without guaranteeing income");
assert.match(page, /বিক্রি বা আয়ের নিশ্চয়তা নেই/, "campaign must not promise guaranteed earnings");
assert.match(page, /checkout-এ অর্ডার নিশ্চিত করুন/, "Plant Market must explain the buyer journey");

assert.match(productPage, /generateMetadata/, "product pages must generate per-product metadata");
assert.match(productPage, /alternates: \{ canonical: canonicalPath \}/, "product pages must self-canonicalize");
assert.match(productPage, /"@type": "Product"/, "product detail must include Product JSON-LD when rich-result essentials exist");
assert.match(productPage, /"@type": "BreadcrumbList"/, "product detail must include breadcrumb JSON-LD");
assert.match(productPage, /hasProductRichResultData = hasRealPrice && hasRealImage && product\.stock !== null/, "Product JSON-LD must be gated on real price, image and known availability");
assert.match(productPage, /robots: \{ index: false, follow: false \}/, "sample product pages must not be indexed");

assert.match(form, /Google search preview/, "seller form must show a live SEO preview");
assert.match(form, /required=\{isPlantListing\}/, "plant listings must require a product image");
assert.match(form, /descriptionText.length < MIN_PLANT_DESCRIPTION_LENGTH/, "client must explain when a plant description is too short");
assert.ok(core.includes("product.image_url"), "marketplace product cards must use uploaded product images");
assert.match(form, /MIN_PLANT_DESCRIPTION_LENGTH = 80/, "plant listings must have useful descriptions");
assert.match(form, /স্বয়ংক্রিয় SEO/, "form must explain SEO metadata is generated automatically");
assert.match(api, /isPlantListing && !imageUrl/, "API must enforce a plant image, not only the client");
assert.match(api, /description\.length < MIN_PLANT_DESCRIPTION_LENGTH/, "API must enforce a minimum plant description");

assert.match(home, /href="\/plant-market"/, "home navigation must expose Plant Market");
assert.match(sitemap, /\$\{base\}\/plant-market/, "Plant Market must be in the sitemap");
assert.match(sitemap, /\$\{base\}\/marketplace\/\$\{product\.slug\}/, "product detail URLs must be included in sitemap");
assert.match(robots, /"\/plant-market"/, "Plant Market must be crawlable");

console.log("Plant Market SEO landing, structured data, and seller upload checks passed.");

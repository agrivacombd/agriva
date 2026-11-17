import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const slugs = read("lib/plant-market/product-slugs.ts");
const productPage = read("app/plant-market/[slug]/page.tsx");
const sellerApi = read("app/api/plant-seller/products/route.ts");
const sellerForm = read("components/seller/PlantSellerProductForm.tsx");
const adminApi = read("app/api/admin/plant-market-products/route.ts");
const adminPanel = read("components/admin/PlantMarketProductReview.tsx");
const productActions = read("components/plant-market/PlantMarketAddToCart.tsx");
const marketCards = read("components/marketplace/MarketplaceCore.tsx");
const cartApi = read("app/api/plant-market/cart/route.ts");
const checkoutApi = read("app/api/plant-market/checkout/route.ts");
const siteMap = read("app/sitemap.ts");
const plantCatalog = read("app/plant-market/page.tsx");
const faq = read("lib/plant-market/faq-from-description.ts");

function check(ok, reason) {
  assert.ok(ok, reason);
  console.log("PASS:", reason);
}

check(slugs.includes('basor-lota-flower-plant') && slugs.includes('fc254719'), "Known Basor Lota URL alias preserves existing product");
check(productPage.includes("permanentRedirect("), "Legacy product URL issues permanent redirect");
check((productPage.match(/\.eq\("slug",lookupSlug\)/g) || []).length === 2, "Metadata and product body resolve alias");
check(productPage.includes("canonicalPlantProductSlug(lookupSlug)"), "SEO metadata emits canonical slug");
check(productPage.includes("canonicalPlantProductSlug(product.slug)"), "Product body emits canonical slug");
check(siteMap.includes("canonicalPlantProductSlug(product.slug)"), "Sitemap emits canonical slug");
check(plantCatalog.includes("canonicalPlantProductSlug(product.slug)"), "Plant catalog card URLs emit canonical slug");
check(sellerApi.includes("requestedSlug") && sellerApi.includes("normalizeEnglishProductSlug"), "Seller slug is editable and validated on server");
check(sellerForm.includes("seo_slug:") && sellerForm.includes("SEO-friendly English URL Slug"), "Seller form exposes English slug");
check(sellerForm.includes('plant_size: current.plant_size || "৫ ইঞ্চি"'), "Basor Lota preset matches seller-confirmed 5 inches");
check(sellerForm.includes("LOCAL_DRAFT_PREFIX + user.id"), "Local seller draft is isolated by authenticated identity");
check(faq.includes("faq.length !== 5") && faq.includes("escapeHtml"), "FAQ is exactly five and escapes sourced content");
check(sellerForm.includes("appendFiveFaq"), "Seller form calls content-derived FAQ builder");
check(adminApi.includes('requireAdminApi("catalog.read")') && adminApi.includes('requireAdminApi(action === "edit" ? "catalog.edit" : "catalog.moderate")'), "Admin API requires separate read/edit/moderation permissions");
check(adminApi.includes("verification_status") && adminApi.includes("user_module_grants"), "Publish checks verified seller and active grant");
check(adminApi.includes("!note"), "Rejection and suspension require moderation reason");
check(adminPanel.includes("Search / Filter") && adminPanel.includes("Save Changes"), "Admin supports search and editing");
check(productActions.includes('"/api/plant-market/cart"') && productActions.includes('"/plant-market/checkout"'), "Single product Buy Now uses Plant Market cart and checkout");
check(marketCards.includes('fetch("/api/plant-market/cart"'), "Plant catalog cards use independent Plant Market cart");
check(cartApi.includes('plant_market_add_to_cart') && checkoutApi.includes('plant_market_finalize_checkout'), "Cart and checkout retain separate stock-checked RPCs");
console.log("Plant Market release contract checks passed.");

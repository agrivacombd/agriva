/**
 * Stable SEO aliases for already-published Plant Market products.
 * Preserve the original database slug, so existing carts/orders/product relations stay intact.
 * Once the database is migrated, remove the alias only after verifying 301 redirects.
 */
export const BASOR_LOTA_LEGACY_SLUG = "ব-সরলত-ফ-ল-র-চ-র-fc254719";
export const BASOR_LOTA_SEO_SLUG = "basor-lota-flower-plant";

export function resolvePlantProductSlug(requested: string): string {
  return requested === BASOR_LOTA_SEO_SLUG ? BASOR_LOTA_LEGACY_SLUG : requested;
}

export function canonicalPlantProductSlug(databaseSlug: string): string {
  return databaseSlug === BASOR_LOTA_LEGACY_SLUG ? BASOR_LOTA_SEO_SLUG : databaseSlug;
}

/** ASCII-only public slug for new submissions; rejected if untrusted or too long. */
export function normalizeEnglishProductSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90).replace(/-$/g, "");
}

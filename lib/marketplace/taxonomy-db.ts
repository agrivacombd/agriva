import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MARKETPLACE_CATEGORIES, getProductTaxonomy } from "@/lib/marketplace/taxonomy";

export type MarketplaceSubcategoryRecord = {
  slug: string;
  name: string;
  description: string;
};
export type MarketplaceCategoryRecord = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  subcategories: MarketplaceSubcategoryRecord[];
};

const fallbackIcon = (slug: string) =>
  MARKETPLACE_CATEGORIES.find((item) => item.slug === slug)?.icon ?? "🌿";

export async function getMarketplaceCategories(): Promise<MarketplaceCategoryRecord[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: categories, error: categoryError }, { data: subcategories, error: subcategoryError }] = await Promise.all([
      supabase.from("product_categories").select("slug,name,description,is_active,sort_order").eq("is_active", true).order("sort_order").order("name"),
      supabase.from("product_subcategories").select("category_slug,slug,name,description,is_active,sort_order").eq("is_active", true).order("sort_order").order("name"),
    ]);
    if (categoryError || subcategoryError || !categories) return MARKETPLACE_CATEGORIES as unknown as MarketplaceCategoryRecord[];
    return categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      icon: fallbackIcon(category.slug),
      subcategories: (subcategories ?? [])
        .filter((subcategory) => subcategory.category_slug === category.slug)
        .map((subcategory) => ({ slug: subcategory.slug, name: subcategory.name, description: subcategory.description ?? "" })),
    }));
  } catch {
    return MARKETPLACE_CATEGORIES as unknown as MarketplaceCategoryRecord[];
  }
}

export async function getMarketplaceCategory(slug: string): Promise<MarketplaceCategoryRecord | undefined> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: category, error } = await supabase.from("product_categories")
      .select("slug,name,description,is_active").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (error) return MARKETPLACE_CATEGORIES.find((item) => item.slug === slug) as unknown as MarketplaceCategoryRecord | undefined;
    if (!category) return undefined;
    const { data: subcategories, error: subcategoryError } = await supabase.from("product_subcategories")
      .select("slug,name,description").eq("category_slug", slug).eq("is_active", true).order("sort_order").order("name");
    if (subcategoryError) return undefined;
    return {
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      icon: fallbackIcon(category.slug),
      subcategories: (subcategories ?? []).map((item) => ({ slug: item.slug, name: item.name, description: item.description ?? "" })),
    };
  } catch {
    return MARKETPLACE_CATEGORIES.find((item) => item.slug === slug) as unknown as MarketplaceCategoryRecord | undefined;
  }
}

export async function getMarketplaceProductTaxonomy(value: string | null, categorySlug?: string | null, subcategorySlug?: string | null) {
  if (!categorySlug) return getProductTaxonomy(value);
  const category = await getMarketplaceCategory(categorySlug);
  if (!category) return undefined;
  const subcategory = subcategorySlug ? category.subcategories.find((item) => item.slug === subcategorySlug) : undefined;
  return { category, subcategory };
}

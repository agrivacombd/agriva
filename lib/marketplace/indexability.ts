import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategory, getSubcategory, matchesProductCategory, matchesSubcategory } from "@/lib/marketplace/taxonomy";

type ProductCategoryRecord = { category: string | null; category_slug?: string | null; subcategory_slug?: string | null };

/** null means the catalogue could not be checked; transient errors must not deindex valid pages. */
async function getActiveProductCategories(): Promise<ProductCategoryRecord[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products")
      .select("category,category_slug,subcategory_slug")
      .eq("status", "active")
      .limit(5000);
    if (error || !data) return null;
    return data as ProductCategoryRecord[];
  } catch {
    return null;
  }
}

export async function hasIndexableCategoryProducts(categorySlug: string): Promise<boolean | null> {
  const category = getCategory(categorySlug);
  if (!category) return false;
  const products = await getActiveProductCategories();
  if (!products) return null;
  return products.some((product) => matchesProductCategory(product.category, category, product.category_slug));
}

export async function hasIndexableSubcategoryProducts(categorySlug: string, subcategorySlug: string): Promise<boolean | null> {
  const category = getCategory(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);
  if (!category || !subcategory) return false;
  const products = await getActiveProductCategories();
  if (!products) return null;
  return products.some((product) => matchesSubcategory(product.category, category, subcategory, product.category_slug, product.subcategory_slug));
}

export const MARKETPLACE_CATEGORIES = [
  { slug: "seeds", name: "বীজ", description: "ধান, সবজি ও মৌসুমি ফসলের বীজ", icon: "🌱", match: ["বীজ", "seed", "seeds"], subcategories: [
    { slug: "rice-seeds", name: "ধানের বীজ", match: ["ধান", "rice"] },
    { slug: "vegetable-seeds", name: "সবজির বীজ", match: ["সবজি", "vegetable"] },
  ] },
  { slug: "fertilizer", name: "সার", description: "জৈব, রাসায়নিক ও মাটির পুষ্টি উপকরণ", icon: "🪴", match: ["সার", "fertilizer", "fertiliser"], subcategories: [
    { slug: "organic-fertilizer", name: "জৈব সার", match: ["জৈব", "organic"] },
    { slug: "chemical-fertilizer", name: "রাসায়নিক সার", match: ["রাসায়নিক", "chemical"] },
  ] },
  { slug: "crop-protection", name: "ফসল সুরক্ষা", description: "ফসলের রোগবালাই ও পোকা ব্যবস্থাপনার উপকরণ", icon: "🛡️", match: ["কীটনাশক", "ছত্রাকনাশক", "ফসল সুরক্ষা", "pesticide", "crop protection"], subcategories: [
    { slug: "pesticides", name: "কীটনাশক", match: ["কীটনাশক", "pesticide"] },
    { slug: "fungicides", name: "ছত্রাকনাশক", match: ["ছত্রাকনাশক", "fungicide"] },
  ] },
  { slug: "tools-equipment", name: "কৃষি যন্ত্রপাতি", description: "চাষাবাদ, সেচ ও ফসল সংগ্রহের যন্ত্র", icon: "🧰", match: ["যন্ত্র", "যন্ত্রপাতি", "equipment", "tools", "machinery"], subcategories: [
    { slug: "irrigation", name: "সেচ সরঞ্জাম", match: ["সেচ", "irrigation"] },
    { slug: "farm-tools", name: "চাষাবাদের সরঞ্জাম", match: ["সরঞ্জাম", "tools"] },
  ] },
  { slug: "produce", name: "তাজা কৃষিপণ্য", description: "ধান, শস্য, সবজি, ফল ও মৌসুমি উৎপাদন", icon: "🥬", match: ["শস্য", "সবজি", "ফল", "ধান", "produce", "vegetable", "fruit", "grain"], subcategories: [
    { slug: "vegetables", name: "সবজি", match: ["সবজি", "vegetable"] },
    { slug: "fruits", name: "ফল", match: ["ফল", "fruit"] },
    { slug: "grains", name: "শস্য ও ধান", match: ["শস্য", "ধান", "grain", "rice"] },
  ] },
  { slug: "animal-feed", name: "পশুখাদ্য", description: "গবাদিপশু ও পোলট্রির খাদ্য", icon: "🐄", match: ["পশুখাদ্য", "feed", "animal"], subcategories: [
    { slug: "poultry-feed", name: "পোলট্রি ফিড", match: ["পোলট্রি", "poultry"] },
    { slug: "cattle-feed", name: "গবাদিপশুর খাদ্য", match: ["গবাদিপশু", "cattle"] },
  ] },
] as const;

export function slugifyProductName(value: string) {
  return value.normalize("NFKC").trim().toLowerCase()
    .replace(/[^\\p{L}\\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function getCategory(slug: string) {
  return MARKETPLACE_CATEGORIES.find((category) => category.slug === slug);
}

export function getSubcategory(categorySlug: string, subcategorySlug: string) {
  const category = getCategory(categorySlug);
  return category?.subcategories.find((subcategory) => subcategory.slug === subcategorySlug);
}

export function matchesCategory(value: string | null, terms: readonly string[]) {
  const normalized = (value || "").toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term.toLocaleLowerCase()));
}

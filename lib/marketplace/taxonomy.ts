export const MARKETPLACE_CATEGORIES = [
  { slug: "seeds", name: "বীজ", description: "ধান, সবজি ও মৌসুমি ফসলের বীজ", icon: "🌱", match: ["বীজ", "seed", "seeds"], subcategories: [
    { slug: "rice-seeds", name: "ধানের বীজ", description: "ধান চাষের জন্য বীজের পণ্য ও সংশ্লিষ্ট তথ্য দেখুন।", match: ["ধান", "rice"] },
    { slug: "vegetable-seeds", name: "সবজির বীজ", description: "বিভিন্ন সবজি চাষের বীজের তালিকা ও পণ্যের বিবরণ দেখুন।", match: ["সবজি", "vegetable"] },
  ] },
  { slug: "fertilizer", name: "সার", description: "জৈব, রাসায়নিক ও মাটির পুষ্টি উপকরণ", icon: "🪴", match: ["সার", "fertilizer", "fertiliser"], subcategories: [
    { slug: "organic-fertilizer", name: "জৈব সার", description: "মাটির পরিচর্যা ও পুষ্টি ব্যবস্থাপনায় ব্যবহৃত জৈব সারের পণ্য দেখুন।", match: ["জৈব", "organic"] },
    { slug: "chemical-fertilizer", name: "রাসায়নিক সার", description: "ফসলের পুষ্টি ব্যবস্থাপনায় ব্যবহৃত রাসায়নিক সারের পণ্য ও তথ্য দেখুন।", match: ["রাসায়নিক", "chemical"] },
  ] },
  { slug: "crop-protection", name: "ফসল সুরক্ষা", description: "ফসলের রোগবালাই ও পোকা ব্যবস্থাপনার উপকরণ", icon: "🛡️", match: ["কীটনাশক", "ছত্রাকনাশক", "ফসল সুরক্ষা", "pesticide", "crop protection"], subcategories: [
    { slug: "pesticides", name: "কীটনাশক", description: "ফসলের পোকা ব্যবস্থাপনায় ব্যবহৃত কীটনাশকের পণ্য ও লেবেল-সংক্রান্ত তথ্য দেখুন।", match: ["কীটনাশক", "pesticide"] },
    { slug: "fungicides", name: "ছত্রাকনাশক", description: "ফসলের ছত্রাকজনিত রোগ ব্যবস্থাপনায় ব্যবহৃত পণ্যের তালিকা দেখুন।", match: ["ছত্রাকনাশক", "fungicide"] },
  ] },
  { slug: "tools-equipment", name: "কৃষি যন্ত্রপাতি", description: "চাষাবাদ, সেচ ও ফসল সংগ্রহের যন্ত্র", icon: "🧰", match: ["যন্ত্র", "যন্ত্রপাতি", "equipment", "tools", "machinery"], subcategories: [
    { slug: "irrigation", name: "সেচ সরঞ্জাম", description: "জমিতে পানি সরবরাহ ও সেচ ব্যবস্থাপনার সরঞ্জামের পণ্য দেখুন।", match: ["সেচ", "irrigation"] },
    { slug: "farm-tools", name: "চাষাবাদের সরঞ্জাম", description: "চাষাবাদ ও কৃষিকাজে ব্যবহৃত সরঞ্জামের পণ্য ও বিবরণ দেখুন।", match: ["সরঞ্জাম", "tools"] },
  ] },
  { slug: "produce", name: "তাজা কৃষিপণ্য", description: "ধান, শস্য, সবজি, ফল ও মৌসুমি উৎপাদন", icon: "🥬", match: ["শস্য", "সবজি", "ফল", "ধান", "produce", "vegetable", "fruit", "grain"], subcategories: [
    { slug: "vegetables", name: "সবজি", description: "তাজা সবজি ও উপলভ্য কৃষিপণ্যের তালিকা দেখুন।", match: ["সবজি", "vegetable"] },
    { slug: "fruits", name: "ফল", description: "মৌসুমি ফল ও উপলভ্য কৃষিপণ্যের তালিকা দেখুন।", match: ["ফল", "fruit"] },
    { slug: "grains", name: "শস্য ও ধান", description: "শস্য ও ধানজাত কৃষিপণ্যের তালিকা এবং পণ্যের বিবরণ দেখুন।", match: ["শস্য", "ধান", "grain", "rice"] },
  ] },
  { slug: "animal-feed", name: "পশুখাদ্য", description: "গবাদিপশু ও পোলট্রির খাদ্য", icon: "🐄", match: ["পশুখাদ্য", "feed", "animal"], subcategories: [
    { slug: "poultry-feed", name: "পোলট্রি ফিড", description: "পোলট্রি পালনে ব্যবহৃত ফিডের পণ্য ও প্যাকেটের তথ্য দেখুন।", match: ["পোলট্রি", "poultry"] },
    { slug: "cattle-feed", name: "গবাদিপশুর খাদ্য", description: "গবাদিপশুর খাদ্য পণ্য ও প্যাকেটের তথ্য দেখুন।", match: ["গবাদিপশু", "cattle"] },
  ] },
] as const;

export function slugifyProductName(value: string) {
  return value.normalize("NFKC").trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
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
  const normalized = (value || "").normalize("NFKC").toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term.normalize("NFKC").toLocaleLowerCase()));
}

export function getProductCategory(value: string | null) {
  const normalized = (value || "").normalize("NFKC").trim().toLocaleLowerCase();
  if (!normalized) return undefined;

  const exactCategory = MARKETPLACE_CATEGORIES.find((category) =>
    normalized === category.slug.toLocaleLowerCase() ||
    normalized === category.name.normalize("NFKC").toLocaleLowerCase()
  );
  if (exactCategory) return exactCategory;

  for (const category of MARKETPLACE_CATEGORIES) {
    const exactSubcategory = category.subcategories.find((subcategory) =>
      normalized === subcategory.slug.toLocaleLowerCase() ||
      normalized === subcategory.name.normalize("NFKC").toLocaleLowerCase()
    );
    if (exactSubcategory) return category;
  }

  // Prefer a category + subcategory term pair over a broad category keyword.
  // This prevents e.g. "ধানের বীজ" from being classified as both seeds and produce.
  for (const category of MARKETPLACE_CATEGORIES) {
    if (category.subcategories.some((subcategory) =>
      matchesCategory(value, category.match) && matchesCategory(value, subcategory.match)
    )) return category;
  }

  return MARKETPLACE_CATEGORIES.find((category) => matchesCategory(value, category.match));
}

export function matchesProductCategory(value: string | null, category: { slug: string; name: string }, categorySlug?: string | null) {
  if (categorySlug) return categorySlug === category.slug;
  const normalized = (value || "").normalize("NFKC").trim().toLocaleLowerCase();
  if (normalized === category.slug.toLocaleLowerCase() || normalized === category.name.normalize("NFKC").toLocaleLowerCase()) return true;
  return getProductCategory(value)?.slug === category.slug;
}

export function getProductTaxonomy(value: string | null, categorySlug?: string | null, subcategorySlug?: string | null) {
  if (categorySlug) {
    const category = getCategory(categorySlug);
    if (!category) return undefined;
    const subcategory = subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
    return { category, subcategory };
  }
  const normalized = (value || "").normalize("NFKC").trim().toLocaleLowerCase();
  if (!normalized) return undefined;

  for (const category of MARKETPLACE_CATEGORIES) {
    const exactSubcategory = category.subcategories.find((subcategory) =>
      normalized === subcategory.name.normalize("NFKC").toLocaleLowerCase() || normalized === subcategory.slug.toLocaleLowerCase()
    );
    if (exactSubcategory) return { category, subcategory: exactSubcategory };
  }

  for (const category of MARKETPLACE_CATEGORIES) {
    const matchedSubcategory = category.subcategories.find((subcategory) =>
      matchesCategory(value, category.match) && matchesCategory(value, subcategory.match)
    );
    if (matchedSubcategory) return { category, subcategory: matchedSubcategory };
  }

  const category = getProductCategory(value);
  return category ? { category, subcategory: undefined } : undefined;
}

export function matchesSubcategory(
  value: string | null,
  category: { slug: string; name: string },
  subcategory: { slug: string; name: string },
  categorySlug?: string | null,
  subcategorySlug?: string | null,
) {
  if (categorySlug || subcategorySlug) return categorySlug === category.slug && subcategorySlug === subcategory.slug;
  const taxonomy = getProductTaxonomy(value);
  return taxonomy?.category.slug === category.slug && taxonomy.subcategory?.slug === subcategory.slug;
}

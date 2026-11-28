export const MARKETPLACE_SELLER_CATEGORIES = [
  { value: "retailer", label: "খুচরা বিক্রেতা / দোকান", organizationType: "shop", description: "দোকান বা সরাসরি কৃষি উপকরণ বিক্রেতা" },
  { value: "wholesaler", label: "পাইকারি বিক্রেতা", organizationType: "company", description: "বাল্ক সরবরাহ ও পাইকারি বিক্রয়" },
  { value: "authorized_dealer", label: "অনুমোদিত ডিলার / ডিস্ট্রিবিউটর", organizationType: "dealer", description: "ব্র্যান্ড বা প্রস্তুতকারকের অনুমোদিত বিক্রেতা" },
  { value: "manufacturer", label: "উৎপাদক / ব্র্যান্ড", organizationType: "company", description: "নিজস্ব উৎপাদন বা ব্র্যান্ডের পণ্য" },
  { value: "cooperative", label: "সমবায় / কৃষক সংগঠন", organizationType: "cooperative", description: "সমবায় বা কৃষক সংগঠনের মাধ্যমে সরবরাহ" },
  { value: "agri_service_provider", label: "কৃষি সেবা প্রদানকারী", organizationType: "other", description: "কৃষি-সম্পর্কিত সেবা ও সমাধান" },
  { value: "other_business", label: "অন্যান্য ব্যবসা", organizationType: "other", description: "অন্যান্য বৈধ কৃষি ব্যবসা" },
] as const;

export const PLANT_MARKET_SELLER_CATEGORIES = [
  { value: "nursery_owner", label: "নার্সারি মালিক / পরিচালনাকারী", description: "নিজস্ব বা পরিচালিত নার্সারি থেকে গাছ ও চারা বিক্রি" },
  { value: "plant_grower", label: "গাছ উৎপাদক / চাষি", description: "নিজে গাছ উৎপাদন বা পরিচর্যা করেন" },
  { value: "fruit_sapling_grower", label: "ফলের চারা / কলম উৎপাদক", description: "ফলের চারা, কলম বা grafted plant উৎপাদন" },
  { value: "ornamental_plant_seller", label: "ফুল ও শোভাবর্ধক গাছ বিক্রেতা", description: "Indoor, outdoor ও ornamental plants" },
  { value: "seed_cutting_seller", label: "বীজ / কাটিং / চারা বিক্রেতা", description: "বীজ, কাটিং, seedlings ও propagation materials" },
  { value: "plant_reseller", label: "গাছের রিসেলার", description: "সরবরাহকারীর কাছ থেকে সংগ্রহ করে পুনরায় বিক্রি" },
  { value: "gardening_supplies", label: "বাগান ও গ্রোয়িং সামগ্রী", description: "টব, মাটি, কম্পোস্ট ও gardening supplies" },
  { value: "hobby_gardener", label: "ব্যক্তিগত / শখের বাগানপ্রেমী", description: "ছোট পরিসরে নিজস্ব গাছ ও চারা বিক্রি" },
] as const;

export const PLANT_GARDENING_TYPES = [
  { value: "indoor", label: "Indoor plants" },
  { value: "outdoor", label: "Outdoor / ornamental plants" },
  { value: "flowering", label: "Flowering plants" },
  { value: "fruit_saplings", label: "Fruit saplings / grafted plants" },
  { value: "vegetable_seedlings", label: "Vegetable / herb seedlings" },
  { value: "seeds_cuttings", label: "Seeds / bulbs / cuttings" },
  { value: "gardening_supplies", label: "Pots / soil / gardening supplies" },
] as const;

export const SELLER_EVIDENCE_TYPES = [
  { value: "identity_support", label: "পরিচয়ের সহায়ক প্রমাণ" },
  { value: "business_registration", label: "ব্যবসা / নিবন্ধন সংক্রান্ত" },
  { value: "dealer_authorization", label: "ডিলার অনুমোদন" },
  { value: "supplier_invoice", label: "সরবরাহকারী / ক্রয় প্রমাণ" },
  { value: "nursery_photos", label: "নার্সারি / গাছের ছবি" },
  { value: "nursery_registration", label: "নার্সারি নিবন্ধন" },
  { value: "product_license", label: "পণ্য-সংক্রান্ত অনুমোদন" },
  { value: "other", label: "অন্যান্য সহায়ক নথি" },
] as const;

export const OPERATING_MODELS = [
  { value: "own_grown", label: "নিজে উৎপাদন / চাষ করি" },
  { value: "mixed", label: "নিজে উৎপাদন করি এবং সংগ্রহও করি" },
  { value: "resale", label: "সরবরাহকারীর কাছ থেকে সংগ্রহ করে বিক্রি করি" },
  { value: "propagation", label: "বীজ / কাটিং / কলম থেকে চারা তৈরি করি" },
  { value: "supplies", label: "বাগান ও গ্রোয়িং সামগ্রী বিক্রি করি" },
] as const;

export type MarketplaceSellerCategory = (typeof MARKETPLACE_SELLER_CATEGORIES)[number]["value"];
export type PlantMarketSellerCategory = (typeof PLANT_MARKET_SELLER_CATEGORIES)[number]["value"];
export type SellerEvidenceType = (typeof SELLER_EVIDENCE_TYPES)[number]["value"];

export function isMarketplaceSellerCategory(value: unknown): value is MarketplaceSellerCategory {
  return MARKETPLACE_SELLER_CATEGORIES.some((item) => item.value === value);
}

export function isPlantMarketSellerCategory(value: unknown): value is PlantMarketSellerCategory {
  return PLANT_MARKET_SELLER_CATEGORIES.some((item) => item.value === value);
}

export function isSellerEvidenceType(value: unknown): value is SellerEvidenceType {
  return SELLER_EVIDENCE_TYPES.some((item) => item.value === value);
}

export function marketplaceOrganizationType(category: MarketplaceSellerCategory): string {
  return MARKETPLACE_SELLER_CATEGORIES.find((item) => item.value === category)!.organizationType;
}

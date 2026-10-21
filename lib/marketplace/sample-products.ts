import type { MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";

// Preview-only catalogue. Names, example prices and stock counts are illustrative,
// not real inventory or offers. Sample items cannot be purchased.
const previewNote = "নমুনা পণ্য: এই তালিকার মূল্য ও মজুত শুধু ডিজাইন প্রিভিউয়ের জন্য; বাস্তব বিক্রয়মূল্য বা স্টক নয়। অর্ডার করার আগে আসল পণ্যের তথ্য যোগ করতে হবে।";

export const MARKETPLACE_SAMPLE_PRODUCTS: MarketplaceProduct[] = [
  { id: "sample-01", slug: "black-rice-seed-sample", name: "ব্ল্যাক রাইস বীজ — নমুনা", category: "ধানের বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ কেজি। ${previewNote} প্রকৃত জাত, উৎস, অঙ্কুরোদ্গম, প্যাকেটের ওজন ও চাষের উপযোগিতা যাচাই না করে এই তথ্যের ভিত্তিতে সিদ্ধান্ত নেবেন না।`, price: 500, stock: 20 },
  { id: "sample-02", slug: "brri-dhan-89-seed-sample", name: "BRRI ধান ৮৯ — নমুনা", category: "ধানের বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ কেজি। ${previewNote} জাতের পরিচয় ও মৌসুমের উপযোগিতা আসল বিক্রেতার কাছ থেকে যাচাই করুন।`, price: 250, stock: 24 },
  { id: "sample-03", slug: "aman-rice-seed-sample", name: "আমন ধানের বীজ — নমুনা", category: "ধানের বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ কেজি। ${previewNote} বপনের সময় ও স্থানীয় উপযোগিতা কৃষি বিশেষজ্ঞের সঙ্গে যাচাই করুন।`, price: 180, stock: 30 },
  { id: "sample-04", slug: "hybrid-maize-seed-sample", name: "হাইব্রিড ভুট্টার বীজ — নমুনা", category: "ভুট্টার বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} প্রকৃত ব্র্যান্ড, প্যাকেটের ওজন ও জাতের তথ্য এখানে এখনো যোগ করা হয়নি।`, price: 650, stock: 16 },
  { id: "sample-05", slug: "tomato-seed-sample", name: "টমেটোর বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} জাত, বীজের সংখ্যা ও চাষের মৌসুম বিক্রির আগে নিশ্চিত করতে হবে।`, price: 120, stock: 45 },
  { id: "sample-06", slug: "chili-seed-sample", name: "মরিচের বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} অঙ্কুরোদ্গম ও জাতের বৈশিষ্ট্যের প্রকৃত তথ্য এখনো যোগ করা হয়নি।`, price: 90, stock: 40 },
  { id: "sample-07", slug: "cucumber-seed-sample", name: "শসার বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} প্রকৃত প্যাকেটের ওজন ও জাতের নাম বিক্রির আগে যোগ করুন।`, price: 100, stock: 35 },
  { id: "sample-08", slug: "eggplant-seed-sample", name: "বেগুনের বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} স্থানীয় চাষের উপযোগিতা ও জাতের তথ্য যাচাই করুন।`, price: 110, stock: 32 },
  { id: "sample-09", slug: "okra-seed-sample", name: "ঢেঁড়সের বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} মূল্য, প্যাকেটের পরিমাণ ও স্টক বাস্তব নয়।`, price: 85, stock: 38 },
  { id: "sample-10", slug: "pumpkin-seed-sample", name: "মিষ্টি কুমড়ার বীজ — নমুনা", category: "সবজির বীজ", description: `ডেমো তালিকা। উদাহরণ প্যাক: ১ প্যাকেট। ${previewNote} জাত ও প্যাকেটের প্রকৃত বিবরণ বিক্রির আগে যোগ করুন।`, price: 95, stock: 28 },
];

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC").trim().toLocaleLowerCase();
  } catch {
    return value.normalize("NFC").trim().toLocaleLowerCase();
  }
}

export function getSampleProduct(slug: string) {
  const normalized = normalizeSlug(slug);
  return MARKETPLACE_SAMPLE_PRODUCTS.find((product) => normalizeSlug(product.slug) === normalized || product.id === normalized) ?? null;
}

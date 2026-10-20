import type { MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";

export const MARKETPLACE_SAMPLE_PRODUCTS: MarketplaceProduct[] = [
  { id: "sample-01", slug: "brri-dhan-ধানের-বীজ", name: "BRRI ধান ৮৯ — নমুনা পণ্য", category: "ধানের বীজ", description: "ডেমো পণ্য: বোরো মৌসুমের ধানের বীজের জন্য নমুনা তালিকা। আসল জাত, উৎস ও অঙ্কুরোদ্গমের তথ্য বিক্রেতার কাছ থেকে যাচাই করুন।", price: 1250, stock: 24 },
  { id: "sample-02", slug: "hybrid-vegetable-seeds", name: "হাইব্রিড সবজি বীজ — নমুনা", category: "সবজির বীজ", description: "ডেমো পণ্য: মৌসুমি সবজি বীজের নমুনা তালিকা।", price: 380, stock: 50 },
  { id: "sample-03", slug: "organic-compost-fertilizer", name: "জৈব কম্পোস্ট সার — নমুনা", category: "জৈব সার", description: "ডেমো পণ্য: মাটির জৈব পদার্থ বাড়াতে কম্পোস্ট সারের নমুনা তালিকা।", price: 450, stock: 35 },
  { id: "sample-04", slug: "balanced-npk-fertilizer", name: "NPK সুষম সার — নমুনা", category: "রাসায়নিক সার", description: "ডেমো পণ্য: ফসলের পুষ্টি ব্যবস্থাপনার নমুনা তালিকা। ব্যবহার করার আগে মাটি পরীক্ষা ও লেবেল অনুসরণ করুন।", price: 980, stock: 18 },
  { id: "sample-05", slug: "crop-pest-control", name: "ফসল সুরক্ষা উপকরণ — নমুনা", category: "কীটনাশক", description: "ডেমো পণ্য: ফসল সুরক্ষা পণ্যের নমুনা তালিকা। অনুমোদিত পণ্য ও লেবেল নির্দেশনা যাচাই করা জরুরি।", price: 620, stock: 20 },
  { id: "sample-06", slug: "fungicide-for-crops", name: "ফসলের ছত্রাকনাশক — নমুনা", category: "ছত্রাকনাশক", description: "ডেমো পণ্য: রোগ ব্যবস্থাপনার জন্য ছত্রাকনাশক ক্যাটাগরির নমুনা তালিকা।", price: 540, stock: 15 },
  { id: "sample-07", slug: "drip-irrigation-kit", name: "ড্রিপ সেচ কিট — নমুনা", category: "সেচ সরঞ্জাম", description: "ডেমো পণ্য: পানি সাশ্রয়ী সেচ সরঞ্জামের নমুনা তালিকা।", price: 2750, stock: 8 },
  { id: "sample-08", slug: "hand-farm-tools-set", name: "হাতের কৃষি সরঞ্জাম সেট — নমুনা", category: "চাষাবাদের সরঞ্জাম", description: "ডেমো পণ্য: দৈনন্দিন কৃষিকাজের সরঞ্জামের নমুনা তালিকা।", price: 790, stock: 22 },
  { id: "sample-09", slug: "fresh-seasonal-vegetables", name: "মৌসুমি তাজা সবজি — নমুনা", category: "সবজি", description: "ডেমো পণ্য: স্থানীয় মৌসুমি উৎপাদনের নমুনা তালিকা। বাস্তব পণ্যের প্রাপ্যতা অঞ্চল ও মৌসুমভেদে পরিবর্তিত হবে।", price: 65, stock: 40 },
  { id: "sample-10", slug: "cattle-feed-bag", name: "গবাদিপশুর খাদ্য — নমুনা", category: "গবাদিপশুর খাদ্য", description: "ডেমো পণ্য: গবাদিপশুর খাদ্যের নমুনা তালিকা। আসল পণ্যের উপাদান ও ওজন যাচাই করুন।", price: 1350, stock: 12 },
];

export function getSampleProduct(slug: string) {
  return MARKETPLACE_SAMPLE_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

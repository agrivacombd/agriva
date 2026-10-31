import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  Bot,
  Search,
  Leaf,
  CloudSun,
  CalendarDays,
  Tractor,
  TrendingUp,
  BriefcaseBusiness,
  FileText,
  Sprout,
  Store,
  Truck,
  ShoppingBasket,
} from "lucide-react";

export type ToolCategoryId =
  | "calculators"
  | "ai"
  | "farm-management"
  | "farm-planning"
  | "market"
  | "career"
  | "green-living";

export type ToolStatus = "active" | "login-required" | "prototype";

export type ToolEntry = {
  id: string;
  href: string;
  category: ToolCategoryId;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  keywords: string[];
  icon: LucideIcon;
  status: ToolStatus;
  featured?: boolean;
};

export const toolCategories: {
  id: ToolCategoryId;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: LucideIcon;
}[] = [
  { id: "calculators", title: "কৃষি ক্যালকুলেটর", titleEn: "Agriculture Calculators", description: "সার, বীজ, খরচ ও ফসলের সম্ভাব্য লাভের হিসাব", descriptionEn: "Estimate inputs, production costs and crop returns.", icon: Calculator },
  { id: "ai", title: "AI কৃষি সহায়তা", titleEn: "AI Agriculture Tools", description: "কৃষি প্রশ্ন, স্মার্ট সার্চ ও রোগের প্রাথমিক বিশ্লেষণ", descriptionEn: "Ask agriculture questions, search smarter and review crop symptoms.", icon: Bot },
  { id: "farm-management", title: "খামার ব্যবস্থাপনা", titleEn: "Farm Management", description: "জমি, ফসলের মৌসুম ও দৈনন্দিন কাজের রেকর্ড", descriptionEn: "Manage farm, crop-cycle and activity records.", icon: Tractor },
  { id: "farm-planning", title: "ফসল পরিকল্পনা", titleEn: "Farm Planning", description: "আবহাওয়া ও মৌসুমভিত্তিক কৃষিকাজের পরিকল্পনা", descriptionEn: "Plan farm activities with weather and seasonal checklists.", icon: CalendarDays },
  { id: "market", title: "বাজার তথ্য", titleEn: "Market Intelligence", description: "সরকারি উৎস থেকে কৃষিপণ্যের বাজারদর যাচাই", descriptionEn: "Check agricultural market-price sources before selling.", icon: TrendingUp },
  { id: "career", title: "ক্যারিয়ার টুলস", titleEn: "Career Tools", description: "কৃষি খাতের চাকরি খুঁজুন ও CV তৈরি করুন", descriptionEn: "Find agriculture jobs and build a CV.", icon: BriefcaseBusiness },
  { id: "green-living", title: "গ্রিন লিভিং", titleEn: "Green Living", description: "নিজের গাছ ও বাগানের যত্নের রেকর্ড রাখুন", descriptionEn: "Keep a personal plant-care and garden record.", icon: Sprout },
];

export const tools: ToolEntry[] = [
  { id: "fertilizer", href: "/fertilizer-calculator", category: "calculators", title: "নিজের নির্ধারিত হারে সার হিসাব", titleEn: "Fertilizer Rate Calculator", description: "মাটি পরীক্ষা বা স্থানীয় সুপারিশ থেকে পাওয়া সারের হার দিয়ে জমির প্রয়োজনীয় পরিমাণ হিসাব করুন।", descriptionEn: "Estimate fertilizer quantities from a rate supplied by a soil test or local recommendation.", keywords: ["সার", "সারের পরিমাণ", "fertilizer", "fertilizer rate", "urea", "dap", "mop"], icon: Calculator, status: "active", featured: true },
  { id: "fertilizer-reference", href: "/tools/fertilizer-calculator", category: "calculators", title: "ফসলভিত্তিক সার রেফারেন্স হিসাব", titleEn: "Crop-based Fertilizer Reference Calculator", description: "নির্বাচিত ফসলের illustrative reference rate দিয়ে আনুমানিক পরিমাণ দেখুন; প্রয়োগের আগে মাটি পরীক্ষা ও স্থানীয় সুপারিশ যাচাই করুন।", descriptionEn: "Estimate quantities from illustrative crop reference rates; verify soil-test results and local recommendations before application.", keywords: ["সার হিসাব", "ফসলভিত্তিক সার", "fertilizer reference rate", "crop fertilizer calculator"], icon: Leaf, status: "active" },
  { id: "seed-rate", href: "/seed-rate-calculator", category: "calculators", title: "নিজের নির্ধারিত হারে বীজের হিসাব", titleEn: "Seed Quantity Calculator", description: "নিজের জানা বীজের হার ও জমির আয়তন দিয়ে প্রয়োজনীয় বীজের পরিমাণ হিসাব করুন।", descriptionEn: "Calculate seed quantity from your own reference rate and field area.", keywords: ["বীজ", "বীজের পরিমাণ", "seed", "seed rate", "seed quantity"], icon: Sprout, status: "active", featured: true },
  { id: "seed-budget", href: "/tools/seed-rate-calculator", category: "calculators", title: "ফসলভিত্তিক বীজ ও বাজেট হিসাব", titleEn: "Crop Seed Rate & Budget Calculator", description: "ফসলভিত্তিক reference rate দিয়ে আনুমানিক বীজের পরিমাণ ও বাজেট হিসাব করুন; জাত ও বপন পদ্ধতি অনুযায়ী হার যাচাই করুন।", descriptionEn: "Estimate seed quantity and budget from crop reference rates; verify the rate for your variety and planting method.", keywords: ["বীজ", "বীজের পরিমাণ", "বীজের বাজেট", "seed", "seed rate", "seed quantity", "seed budget"], icon: Sprout, status: "active", featured: true },
  { id: "farm-profit", href: "/farming-cost-profit-calculator", category: "calculators", title: "চাষের খরচ ও লাভ-লোকসান", titleEn: "Farm Cost & Profit Calculator", description: "বীজ, সার, শ্রম, সেচ, ফলন ও বিক্রয়মূল্য ধরে সম্ভাব্য আয় ও লাভ হিসাব করুন।", descriptionEn: "Estimate farm expenses, revenue and possible profit or loss from your own inputs.", keywords: ["খরচ", "লাভ", "লোকসান", "চাষের হিসাব", "farm cost", "profit", "revenue", "break even"], icon: TrendingUp, status: "active", featured: true },
  { id: "irrigation-water", href: "/tools/irrigation-water-calculator", category: "calculators", title: "সেচের পানির পরিমাণ ক্যালকুলেটর", titleEn: "Irrigation Water Calculator", description: "জমির আয়তন, ফসলের reference water demand ও সেচ পদ্ধতি ধরে আনুমানিক পানির পরিমাণ হিসাব করুন।", descriptionEn: "Estimate irrigation water volume from field area, reference crop demand and irrigation method.", keywords: ["সেচ", "পানি", "সেচের পানি", "irrigation", "water requirement", "water volume"], icon: CloudSun, status: "active" },
  { id: "harvest-date", href: "/tools/harvest-date-calculator", category: "calculators", title: "ফসল কাটার সম্ভাব্য তারিখ", titleEn: "Harvest Date Calculator", description: "রোপণের তারিখ ও ফসলের সম্ভাব্য বৃদ্ধিকাল দিয়ে আনুমানিক সংগ্রহের তারিখ বের করুন।", descriptionEn: "Estimate a harvest date from planting date and crop growth duration.", keywords: ["ফসল কাটার সময়", "সংগ্রহের তারিখ", "harvest date", "crop maturity", "planting date"], icon: CalendarDays, status: "active" },
  { id: "soil-fertilizer", href: "/soil-fertilizer", category: "calculators", title: "মাটি ও সার পরিকল্পনাকারী", titleEn: "Soil & Fertilizer Planner", description: "মাটি পরীক্ষা বা স্থানীয় কৃষি সুপারিশের পুষ্টি উপাদানের হার দিয়ে হিসাব করুন।", descriptionEn: "Calculate nutrient quantities using soil-test results or local recommendations.", keywords: ["মাটি", "মাটি পরীক্ষা", "NPK", "soil test", "nutrient", "fertilizer planner"], icon: Leaf, status: "active" },
  { id: "crop-choice", href: "/crop-choice", category: "calculators", title: "ফসল বাছাই ও লাভ তুলনা", titleEn: "Crop Choice & Profit Comparison", description: "নিজের খরচ, ফলন ও বিক্রয়মূল্য দিয়ে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।", descriptionEn: "Compare estimated costs, yield, revenue and profit across three crop options.", keywords: ["ফসল বাছাই", "লাভ তুলনা", "crop choice", "crop comparison", "profit comparison"], icon: TrendingUp, status: "active" },
  { id: "ai-assistant", href: "/ai", category: "ai", title: "AGRIVA AI সহকারী", titleEn: "AGRIVA AI Assistant", description: "ফসল, মাটি, সার, সেচ ও রোগ-পোকা নিয়ে কৃষি প্রশ্ন করুন।", descriptionEn: "Ask questions about crops, soil, fertilizer, irrigation and crop problems.", keywords: ["AI", "কৃষি প্রশ্ন", "পরামর্শ", "agriculture assistant", "chatbot"], icon: Bot, status: "active", featured: true },
  { id: "smart-search", href: "/search", category: "ai", title: "স্মার্ট সার্চ", titleEn: "Smart Search", description: "কৃষি বিষয়ে প্রশ্ন করুন; প্রাসঙ্গিক পরামর্শ ও পণ্যের মিল খুঁজুন।", descriptionEn: "Search agriculture topics and discover relevant guidance or product matches.", keywords: ["সার্চ", "অনুসন্ধান", "smart search", "agriculture search"], icon: Search, status: "active" },
  { id: "crop-disease", href: "/crop-disease", category: "ai", title: "ছবি দিয়ে ফসলের রোগ বিশ্লেষণ", titleEn: "Crop Disease Image Analysis", description: "ফসলের ছবি দিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক বিশ্লেষণ ও সম্ভাব্য করণীয় দেখুন।", descriptionEn: "Review a preliminary AI-assisted analysis of crop symptoms from an image.", keywords: ["রোগ", "পাতার দাগ", "ছবি", "crop disease", "plant disease", "leaf diagnosis"], icon: Leaf, status: "login-required", featured: true },
  { id: "crop-symptom-guide", href: "/tools/crop-disease-assistant", category: "ai", title: "লক্ষণভিত্তিক ফসল সমস্যা গাইড", titleEn: "Crop Symptom Guide (Prototype)", description: "পাতা হলুদ, দাগ, কুঁকড়ে যাওয়া বা ঝিমিয়ে পড়ার মতো লক্ষণ লিখে সম্ভাব্য কারণের সাধারণ তালিকা দেখুন; এটি AI রোগ নির্ণয় নয়।", descriptionEn: "Enter symptoms such as yellowing, spots, curling or wilting to see general possible causes; this is not an AI diagnosis.", keywords: ["লক্ষণ", "পাতার দাগ", "হলুদ পাতা", "crop symptoms", "plant problem", "wilting", "leaf spots"], icon: Leaf, status: "prototype" },
  { id: "my-farm", href: "/farms", category: "farm-management", title: "আমার খামার", titleEn: "My Farm", description: "জমির তথ্য, ফসলের মৌসুম ও দৈনন্দিন কাজের ডায়েরি এক জায়গায় রাখুন।", descriptionEn: "Keep land details, crop cycles and a farm activity diary in one workspace.", keywords: ["খামার", "জমি", "ডায়েরি", "farm records", "farm diary", "crop cycle"], icon: Tractor, status: "login-required", featured: true },
  { id: "farm-diary-prototype", href: "/tools/farm-diary", category: "farm-management", title: "ফার্ম ডায়েরি (Prototype)", titleEn: "Farm Diary (Prototype)", description: "ফসলের কাজ, তারিখ, নোট ও খরচের অস্থায়ী রেকর্ড যোগ করে দেখুন; তথ্য শুধু বর্তমান browser session-এ থাকে।", descriptionEn: "Try recording crop activities, dates, notes and expenses; entries only remain in the current browser session.", keywords: ["ফার্ম ডায়েরি", "কৃষি ডায়েরি", "farm diary", "farm record", "field activity"], icon: FileText, status: "prototype" },
  { id: "weather", href: "/tools/farm-weather", category: "farm-planning", title: "কৃষি আবহাওয়া ও ৭ দিনের পূর্বাভাস", titleEn: "Farm Weather & 7-Day Forecast", description: "নির্বাচিত এলাকার তাপমাত্রা, বৃষ্টি, আর্দ্রতা ও বাতাসের পূর্বাভাস দেখে কাজের পরিকল্পনা করুন।", descriptionEn: "Review temperature, rainfall, humidity and wind forecasts for farm planning.", keywords: ["আবহাওয়া", "বৃষ্টি", "তাপমাত্রা", "weather", "forecast", "rain", "humidity", "wind"], icon: CloudSun, status: "active", featured: true },
  { id: "crop-calendar", href: "/tools/crop-calendar", category: "farm-planning", title: "ফসলের মৌসুমি ক্যালেন্ডার", titleEn: "Crop Season Calendar", description: "ধান, গম, ভুট্টা, আলু ও সবজির সাধারণ বপন, বৃদ্ধি ও সংগ্রহের সময় দেখুন।", descriptionEn: "Review indicative planting, growth and harvest windows for common crops.", keywords: ["ফসল ক্যালেন্ডার", "বপনের সময়", "ফসল কাটার সময়", "crop calendar", "planting window", "harvest window"], icon: CalendarDays, status: "active" },
  { id: "farm-task-checklist", href: "/crop-calendar", category: "farm-planning", title: "কৃষিকাজের চেকলিস্ট", titleEn: "Farm Task Checklist", description: "মৌসুমের কৃষিকাজের ধাপ চিহ্নিত করে নিজের অগ্রগতি ব্রাউজারে রাখুন।", descriptionEn: "Track seasonal farm tasks and keep checklist progress in your browser.", keywords: ["কাজের তালিকা", "কৃষিকাজ", "task checklist", "farm tasks", "crop activity"], icon: CalendarDays, status: "active" },
  { id: "market-prices", href: "/market-prices", category: "market", title: "কৃষিপণ্যের বাজারদর", titleEn: "Agricultural Market Prices", description: "সরকারি বাজারদরের উৎসে যান এবং বাজার ও তারিখ মিলিয়ে দাম যাচাই করুন।", descriptionEn: "Open official market-price sources and verify market and date before selling.", keywords: ["বাজারদর", "দাম", "কৃষিপণ্যের দাম", "market price", "commodity price", "DAM"], icon: TrendingUp, status: "active" },
  { id: "market-price-log", href: "/tools/crop-market-price", category: "market", title: "নিজের বাজারদর নোটবুক", titleEn: "Market Price Notes (Prototype)", description: "নিজে যাচাই করা ফসলের দাম, বাজার ও তারিখ লিখে একই ব্রাউজার সেশনে তুলনা করুন; এটি live market feed নয়।", descriptionEn: "Record crop prices you personally verify by market and date; this browser-only prototype is not a live market feed.", keywords: ["বাজারদর", "দাম নোট", "market price log", "price observation", "market notes"], icon: TrendingUp, status: "prototype" },
  { id: "cv-builder", href: "/jobs/cv-builder", category: "career", title: "CV তৈরি করুন", titleEn: "CV Builder", description: "বাংলা বা ইংরেজিতে CV তৈরি, ডিজাইন বাছাই ও PDF/Print করুন।", descriptionEn: "Create a Bangla or English CV, choose a template and print or save as PDF.", keywords: ["সিভি", "জীবনবৃত্তান্ত", "চাকরি", "resume", "cv maker", "cv builder"], icon: FileText, status: "active" },
  { id: "agriculture-jobs", href: "/jobs", category: "career", title: "কৃষি চাকরি", titleEn: "Agriculture Jobs", description: "কৃষি খাতের কাজ খুঁজুন অথবা কর্মী নিয়োগের সুযোগ দেখুন।", descriptionEn: "Find agriculture work or explore worker-recruitment opportunities.", keywords: ["চাকরি", "কৃষিশ্রমিক", "নিয়োগ", "agriculture jobs", "farm jobs", "recruitment"], icon: BriefcaseBusiness, status: "active" },
  { id: "personal-garden", href: "/garden", category: "green-living", title: "আমার গার্ডেন", titleEn: "Personal Garden", description: "নিজের গাছের তালিকা, যত্নের কাজ ও তারিখের রেকর্ড রাখুন।", descriptionEn: "Keep a list of your plants and plan care tasks and dates.", keywords: ["বাগান", "গাছ", "গাছের যত্ন", "garden", "plant care", "home garden"], icon: Sprout, status: "login-required" },
];

export const relatedServices = [
  { href: "/marketplace", title: "কৃষি মার্কেটপ্লেস", titleEn: "Agriculture Marketplace", description: "বীজ, সার ও কৃষি উপকরণ খুঁজুন", descriptionEn: "Find seeds, fertilizer and farm supplies", icon: ShoppingBasket },
  { href: "/sell-harvest", title: "ফসল বিক্রি", titleEn: "Sell Harvest", description: "নিজের ফসল বিক্রির অফার দিন", descriptionEn: "Create an offer for your harvest", icon: Store },
  { href: "/buyer-demands", title: "ক্রেতার চাহিদা", titleEn: "Buyer Demands", description: "ক্রেতার চাহিদা দেখে অফার দিন", descriptionEn: "Review buyer demand and make an offer", icon: TrendingUp },
  { href: "/transport", title: "কৃষিপণ্য পরিবহন", titleEn: "Farm Transport", description: "পণ্য পরিবহনের ব্যবস্থা করুন", descriptionEn: "Arrange transport for agricultural goods", icon: Truck },
  { href: "/krishi-bazar", title: "কৃষি বাজার গাইড", titleEn: "Agriculture Market Guide", description: "ফসল বিক্রি, পণ্য কেনা ও বাজারদর যাচাইয়ের পথ খুঁজুন", descriptionEn: "Find paths to sell harvest, buy supplies and check market prices", icon: Store },
];

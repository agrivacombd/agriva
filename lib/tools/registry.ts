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

export type ToolStatus = "active" | "login-required";

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
  { id: "fertilizer", href: "/fertilizer-calculator", category: "calculators", title: "সার হিসাব ক্যালকুলেটর", titleEn: "Fertilizer Calculator", description: "জমির আয়তন ও নির্ধারিত সারের হার দিয়ে প্রয়োজনীয় পরিমাণ হিসাব করুন।", descriptionEn: "Estimate fertilizer quantities from field area and an application rate you provide.", keywords: ["সার", "সারের পরিমাণ", "fertilizer", "fertilizer rate", "urea", "dap", "mop"], icon: Calculator, status: "active", featured: true },
  { id: "seed-rate", href: "/seed-rate-calculator", category: "calculators", title: "বীজের হার ক্যালকুলেটর", titleEn: "Seed Rate Calculator", description: "একর, হেক্টর বা শতক অনুযায়ী প্রয়োজনীয় বীজের পরিমাণ বের করুন।", descriptionEn: "Estimate seed requirements for acres, hectares or decimals.", keywords: ["বীজ", "বীজের পরিমাণ", "seed", "seed rate", "seed quantity"], icon: Sprout, status: "active", featured: true },
  { id: "farm-profit", href: "/farming-cost-profit-calculator", category: "calculators", title: "চাষের খরচ ও লাভ-লোকসান", titleEn: "Farm Cost & Profit Calculator", description: "বীজ, সার, শ্রম, সেচ, ফলন ও বিক্রয়মূল্য ধরে সম্ভাব্য আয় ও লাভ হিসাব করুন।", descriptionEn: "Estimate farm expenses, revenue and possible profit or loss from your own inputs.", keywords: ["খরচ", "লাভ", "লোকসান", "চাষের হিসাব", "farm cost", "profit", "revenue", "break even"], icon: TrendingUp, status: "active", featured: true },
  { id: "soil-fertilizer", href: "/soil-fertilizer", category: "calculators", title: "মাটি ও সার পরিকল্পনাকারী", titleEn: "Soil & Fertilizer Planner", description: "মাটি পরীক্ষা বা স্থানীয় কৃষি সুপারিশের পুষ্টি উপাদানের হার দিয়ে হিসাব করুন।", descriptionEn: "Calculate nutrient quantities using soil-test results or local recommendations.", keywords: ["মাটি", "মাটি পরীক্ষা", "NPK", "soil test", "nutrient", "fertilizer planner"], icon: Leaf, status: "active" },
  { id: "crop-choice", href: "/crop-choice", category: "calculators", title: "ফসল বাছাই ও লাভ তুলনা", titleEn: "Crop Choice & Profit Comparison", description: "নিজের খরচ, ফলন ও বিক্রয়মূল্য দিয়ে তিনটি ফসলের সম্ভাব্য লাভ তুলনা করুন।", descriptionEn: "Compare estimated costs, yield, revenue and profit across three crop options.", keywords: ["ফসল বাছাই", "লাভ তুলনা", "crop choice", "crop comparison", "profit comparison"], icon: TrendingUp, status: "active" },
  { id: "ai-assistant", href: "/ai", category: "ai", title: "AGRIVA AI সহকারী", titleEn: "AGRIVA AI Assistant", description: "ফসল, মাটি, সার, সেচ ও রোগ-পোকা নিয়ে কৃষি প্রশ্ন করুন।", descriptionEn: "Ask questions about crops, soil, fertilizer, irrigation and crop problems.", keywords: ["AI", "কৃষি প্রশ্ন", "পরামর্শ", "agriculture assistant", "chatbot"], icon: Bot, status: "active", featured: true },
  { id: "smart-search", href: "/search", category: "ai", title: "স্মার্ট সার্চ", titleEn: "Smart Search", description: "কৃষি বিষয়ে প্রশ্ন করুন; প্রাসঙ্গিক পরামর্শ ও পণ্যের মিল খুঁজুন।", descriptionEn: "Search agriculture topics and discover relevant guidance or product matches.", keywords: ["সার্চ", "অনুসন্ধান", "smart search", "agriculture search"], icon: Search, status: "active" },
  { id: "crop-disease", href: "/crop-disease", category: "ai", title: "ছবি দিয়ে ফসলের রোগ বিশ্লেষণ", titleEn: "Crop Disease Image Analysis", description: "ফসলের ছবি দিয়ে AI-সহায়তাপ্রাপ্ত প্রাথমিক বিশ্লেষণ ও সম্ভাব্য করণীয় দেখুন।", descriptionEn: "Review a preliminary AI-assisted analysis of crop symptoms from an image.", keywords: ["রোগ", "পাতার দাগ", "ছবি", "crop disease", "plant disease", "leaf diagnosis"], icon: Leaf, status: "login-required", featured: true },
  { id: "my-farm", href: "/farms", category: "farm-management", title: "আমার খামার", titleEn: "My Farm", description: "জমির তথ্য, ফসলের মৌসুম ও দৈনন্দিন কাজের ডায়েরি এক জায়গায় রাখুন।", descriptionEn: "Keep land details, crop cycles and a farm activity diary in one workspace.", keywords: ["খামার", "জমি", "ডায়েরি", "farm records", "farm diary", "crop cycle"], icon: Tractor, status: "login-required", featured: true },
  { id: "weather", href: "/weather", category: "farm-planning", title: "কৃষি আবহাওয়া", titleEn: "Agriculture Weather", description: "নির্বাচিত এলাকার বর্তমান আবহাওয়া ও ৫ দিনের পূর্বাভাস দেখুন।", descriptionEn: "Check current conditions and a five-day forecast for a selected area.", keywords: ["আবহাওয়া", "বৃষ্টি", "তাপমাত্রা", "weather", "forecast", "rain"], icon: CloudSun, status: "active", featured: true },
  { id: "crop-calendar", href: "/crop-calendar", category: "farm-planning", title: "ফসল ক্যালেন্ডার ও চেকলিস্ট", titleEn: "Crop Calendar & Checklist", description: "মৌসুমভিত্তিক কৃষিকাজের ধাপ চিহ্নিত করে অগ্রগতি অনুসরণ করুন।", descriptionEn: "Track seasonal farming tasks and save checklist progress in your browser.", keywords: ["ফসল ক্যালেন্ডার", "কাজের তালিকা", "crop calendar", "task checklist", "season"], icon: CalendarDays, status: "active" },
  { id: "market-prices", href: "/market-prices", category: "market", title: "কৃষিপণ্যের বাজারদর", titleEn: "Agricultural Market Prices", description: "সরকারি বাজারদরের উৎসে যান এবং বাজার ও তারিখ মিলিয়ে দাম যাচাই করুন।", descriptionEn: "Open official market-price sources and verify market and date before selling.", keywords: ["বাজারদর", "দাম", "কৃষিপণ্যের দাম", "market price", "commodity price", "DAM"], icon: TrendingUp, status: "active" },
  { id: "cv-builder", href: "/jobs/cv-builder", category: "career", title: "CV তৈরি করুন", titleEn: "CV Builder", description: "বাংলা বা ইংরেজিতে CV তৈরি, ডিজাইন বাছাই ও PDF/Print করুন।", descriptionEn: "Create a Bangla or English CV, choose a template and print or save as PDF.", keywords: ["সিভি", "জীবনবৃত্তান্ত", "চাকরি", "resume", "cv maker", "cv builder"], icon: FileText, status: "active" },
  { id: "agriculture-jobs", href: "/jobs", category: "career", title: "কৃষি চাকরি", titleEn: "Agriculture Jobs", description: "কৃষি খাতের কাজ খুঁজুন অথবা কর্মী নিয়োগের সুযোগ দেখুন।", descriptionEn: "Find agriculture work or explore worker-recruitment opportunities.", keywords: ["চাকরি", "কৃষিশ্রমিক", "নিয়োগ", "agriculture jobs", "farm jobs", "recruitment"], icon: BriefcaseBusiness, status: "active" },
  { id: "personal-garden", href: "/garden", category: "green-living", title: "আমার গার্ডেন", titleEn: "Personal Garden", description: "নিজের গাছের তালিকা, যত্নের কাজ ও তারিখের রেকর্ড রাখুন।", descriptionEn: "Keep a list of your plants and plan care tasks and dates.", keywords: ["বাগান", "গাছ", "গাছের যত্ন", "garden", "plant care", "home garden"], icon: Sprout, status: "login-required" },
];

export const relatedServices = [
  { href: "/marketplace", title: "কৃষি মার্কেটপ্লেস", titleEn: "Agriculture Marketplace", description: "বীজ, সার ও কৃষি উপকরণ খুঁজুন", descriptionEn: "Find seeds, fertilizer and farm supplies", icon: ShoppingBasket },
  { href: "/sell-harvest", title: "ফসল বিক্রি", titleEn: "Sell Harvest", description: "নিজের ফসল বিক্রির অফার দিন", descriptionEn: "Create an offer for your harvest", icon: Store },
  { href: "/buyer-demands", title: "ক্রেতার চাহিদা", titleEn: "Buyer Demands", description: "ক্রেতার চাহিদা দেখে অফার দিন", descriptionEn: "Review buyer demand and make an offer", icon: TrendingUp },
  { href: "/transport", title: "কৃষিপণ্য পরিবহন", titleEn: "Farm Transport", description: "পণ্য পরিবহনের ব্যবস্থা করুন", descriptionEn: "Arrange transport for agricultural goods", icon: Truck },
];

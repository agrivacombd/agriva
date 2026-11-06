import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/authz";
import PlantMarketProductReview from "@/components/admin/PlantMarketProductReview";
export const metadata:Metadata={title:"Plant Market Product Review | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function AdminPlantMarketProductsPage(){
  await requireAdminPage("catalog.moderate");
  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1500px]"><header className="relative overflow-hidden rounded-[28px] bg-[#17452c] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5"/><div className="relative"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · PLANT MARKET</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Plant Market Product Moderation</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">শুধু plant_market_products-এর Draft, Rejected ও Suspended পণ্য দেখানো হয়। Marketplace product moderation আলাদা থাকবে।</p></div></header><PlantMarketProductReview/></div></main>;
}
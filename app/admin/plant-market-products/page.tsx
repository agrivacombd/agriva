import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/authz";
import PlantMarketProductReview from "@/components/admin/PlantMarketProductReview";
export const metadata:Metadata={title:"Plant Market Product Review | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function AdminPlantMarketProductsPage(){
  await requireAdminPage("catalog.moderate");
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-10 text-[#17351f] sm:px-6"><div className="mx-auto max-w-5xl"><p className="text-xs font-black uppercase tracking-widest text-emerald-700">AGRIVA ADMIN</p><h1 className="mt-2 text-3xl font-black">Plant Market Product Moderation</h1><p className="mt-2 text-sm leading-6 text-slate-600">এই queue শুধু plant_market_products থেকে Pending / Rejected পণ্য দেখায়। Marketplace product moderation আলাদা থাকবে।</p><PlantMarketProductReview/></div></main>;
}
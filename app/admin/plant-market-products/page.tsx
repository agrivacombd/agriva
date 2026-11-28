import { AdminPage as AdminPageLayout } from "@/components/admin/ui/AdminPrimitives";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/authz";
import PlantMarketProductReview from "@/components/admin/PlantMarketProductReview";
export const metadata:Metadata={title:"Plant Market Product Management | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function AdminPlantMarketProductsPage(){
  await requireAdminPage("catalog.moderate");
  return <AdminPageLayout className="min-h-screen bg-[#f5f8f1] px-4 py-10 text-[#17351f] sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-widest text-emerald-700">AGRIVA ADMIN</p><h1 className="mt-2 text-3xl font-black">Plant Market পণ্য ব্যবস্থাপনা</h1><p className="mt-2 text-sm leading-6 text-slate-600">Plant Market-এর সব পণ্য Search, Filter, Edit, Price/Stock Update, Review, Publish, Pause ও Suspend করুন। Marketplace এবং Plant Market-এর তথ্য আলাদা থাকবে।</p><PlantMarketProductReview/></div></AdminPageLayout>;
}
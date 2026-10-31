import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerApplicationReview from "@/components/admin/SellerApplicationReview";
export const metadata:Metadata={title:"Seller Applications | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function AdminSellerApplicationsPage(){
  const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login?next=/admin/seller-applications");
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")redirect("/dashboard");
  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-10 text-[#17351f] sm:px-6"><div className="mx-auto max-w-5xl"><p className="text-xs font-black uppercase tracking-widest text-emerald-700">AGRIVA ADMIN</p><h1 className="mt-2 text-3xl font-black">Seller Application Review</h1><p className="mt-2 text-sm leading-6 text-slate-600">Marketplace ও Plant Market-এর আবেদন আলাদা queue-তে পর্যালোচনা করুন। অনুমোদন দিলে শুধু নির্বাচিত মার্কেটের permission সক্রিয় হবে।</p><SellerApplicationReview/></div></main>;
}
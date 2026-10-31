import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkModuleAccess } from "@/lib/authz/module-access";
import PlantSellerProductForm from "@/components/seller/PlantSellerProductForm";
export const metadata:Metadata={title:"গাছ ও চারা বিক্রি করুন | AGRIVA Plant Market Seller",description:"AGRIVA Plant Market-এ গাছ, চারা, বীজ ও বাগান সামগ্রী তালিকাভুক্ত করুন।",robots:{index:false,follow:false}};
export default async function NewPlantSellerProductPage(){
 const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=/plant-seller/products/new");
 const [{data:profile,error:profileError},access]=await Promise.all([
  supabase.from("gardener_profiles").select("verification_status").eq("user_id",user.id).maybeSingle(),
  checkModuleAccess("plant_market","create",{type:"global"})
 ]);
 const approved=!profileError&&profile?.verification_status==="verified"&&access.allowed;
 return <main className="min-h-screen bg-[#f5f8f1] px-4 py-12 text-[#17351f] sm:px-6"><div className="mx-auto max-w-4xl"><Link href="/plant-market" className="font-bold text-emerald-800">← Plant Market</Link><h1 className="mt-6 text-3xl font-black">Plant Market-এ নতুন পণ্য যোগ করুন</h1><p className="mt-3 text-slate-600">এই ফর্মের পণ্য কেবল Plant Market-এর আলাদা catalogue-এ সংরক্ষিত হবে। অ্যাডমিন অনুমোদনের আগে প্রকাশিত হবে না।</p>{approved?<div className="mt-8"><PlantSellerProductForm/></div>:<div className="mt-8 rounded-2xl border bg-white p-7"><h2 className="text-xl font-black">Plant Seller অনুমোদন প্রয়োজন</h2><p className="mt-2 text-sm leading-7 text-slate-600">একই AGRIVA account দিয়ে লগইন করে Plant Market-এর জন্য আলাদা Gardener পরিচয় যাচাই ও module approval নিন। Marketplace Seller permission এখানে কার্যকর নয়।</p><Link href="/account/verification?module=plant_market" className="mt-5 inline-flex rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white">Plant Market আবেদন করুন</Link></div>}</div></main>;
}
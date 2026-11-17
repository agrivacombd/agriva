import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MultiOrderForm,{type OrderDraft} from "@/components/bulk-rfq/MultiOrderForm";
export const metadata:Metadata={title:"Bulk & Custom Order | AGRIVA",description:"একটি অর্ডারে একাধিক কৃষিপণ্যের পাইকারি কোটেশন নিন।",alternates:{canonical:"/custom-order"}};
type Item={name:string;quantity:string;unit:string;specification:string};
async function submitRequest(formData:FormData){
 "use server";
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=%2Fcustom-order");
 let raw:unknown;
 try{raw=JSON.parse(String(formData.get("items_json")??""));}catch{redirect("/custom-order?error=invalid");}
 if(!Array.isArray(raw)||raw.length<1||raw.length>20)redirect("/custom-order?error=invalid");
 const items:Item[]=[];
 for(const item of raw){
  if(!item||typeof item!=="object")redirect("/custom-order?error=invalid");
  const entry=item as Record<string,unknown>;
  const name=String(entry.name??"").trim(),specification=String(entry.specification??"");
  const unit=String(entry.unit??""),quantity=String(entry.quantity??"");
  if(name.length<2||name.length>120||specification.length>2000||!["kg","ton","maund","bag","packet"].includes(unit)
   ||!/^[0-9]{1,7}(\.[0-9]{1,3})?$/.test(quantity)||Number(quantity)<=0||Number(quantity)>1000000)
   redirect("/custom-order?error=invalid");
  items.push({name,specification,quantity,unit});
 }
 const buyer_type=String(formData.get("buyer_type")??""), visibility=String(formData.get("visibility")??"");
 const district=String(formData.get("district")??"").trim(),upazila=String(formData.get("upazila")??"").trim();
 if(!["business","individual"].includes(buyer_type)||!["public","private"].includes(visibility)
 ||district.length<2||district.length>80||upazila.length>80)redirect("/custom-order?error=invalid");
 const {error}=await db.rpc("bulk_create_multi_request",{p_buyer_type:buyer_type,p_visibility:visibility,
  p_district:district,p_upazila:upazila,p_items:items});
 if(error)redirect("/custom-order?error=save");
 redirect("/account/custom-orders?created=1");
}
export default async function CustomOrder({searchParams}:{searchParams:Promise<{repeat?:string;error?:string}>}){
 const p=await searchParams,db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return <main className="min-h-screen bg-[#f7f9f5] text-[#17351f]"><div className="bg-[#123f2b] px-4 py-16 text-center text-white"><h1 className="text-3xl font-black">Bulk ও Custom Order</h1><p className="mx-auto mt-4 max-w-xl">একসঙ্গে একাধিক কৃষিপণ্যের কোটেশন নিন এবং দাম তুলনা করুন।</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/login?next=%2Fcustom-order" className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950">লগইন করে শুরু করুন</Link><Link href="/signup" className="rounded-xl border border-white px-5 py-3 font-bold">অ্যাকাউন্ট তৈরি করুন</Link></div></div></main>;
 // Load AGRIVA's active public product names once per page, never on every keystroke.
 // Autocomplete also works from the curated offline Bangladesh crop catalog when unavailable.
 const {data:existingProducts}=await db.from("products").select("name")
  .eq("status","active").is("deleted_at",null).order("name",{ascending:true}).limit(250);
 const marketplaceNames=[...new Set((existingProducts??[]).map(p=>String(p.name??"").trim()).filter(Boolean))];
 let initial:OrderDraft={buyer_type:"business",visibility:"public",district:"",upazila:"",items:[{name:"",quantity:"",unit:"kg",specification:""}]};
 let repeatFound=false;
 if(p.repeat&&/^[0-9a-f-]{36}$/i.test(p.repeat)){
  const {data:r}=await db.from("bulk_requests").select("id,buyer_type,visibility,product_name,quantity,unit,specification,district,upazila").eq("id",p.repeat).eq("buyer_id",user.id).maybeSingle();
  if(r){
   const {data:rows}=await db.from("bulk_request_items").select("product_name,quantity,unit,specification").eq("request_id",r.id).order("position",{ascending:true});
   initial={buyer_type:r.buyer_type,visibility:r.visibility,district:r.district,upazila:r.upazila,
    items:rows?.length?rows.map(i=>({name:i.product_name,quantity:String(i.quantity),unit:i.unit,specification:i.specification??""})):
    [{name:r.product_name,quantity:String(r.quantity),unit:r.unit,specification:r.specification??""}]};
   repeatFound=true;
  }
 }
 return <main className="min-h-screen bg-[#f7f9f5] pb-16 text-[#17351f]">
  <header className="bg-[#123f2b] px-4 py-12 text-white"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold text-lime-300">AGRIVA • B2B & B2C</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bulk ও Custom Order</h1><p className="mt-3 text-emerald-50">একটি অনুরোধে একাধিক পণ্য যোগ করুন। প্রতিটি পণ্যে আলাদা পাইকার বেছে নিন।</p></div></header>
  <div className="mx-auto max-w-3xl px-4 py-8">
   <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{repeatFound?"আগের তালিকা থেকে নতুন অনুরোধ":"আপনার প্রয়োজনীয় পণ্য যোগ করুন"}</h2><Link href="/account/custom-orders" className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold">আমার অর্ডারসমূহ</Link></div>
   {repeatFound&&<p role="status" className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm">পূর্বের পণ্যগুলো লোড হয়েছে। পরিবর্তন করে নতুন অনুরোধ জমা দিন; পুরোনো অর্ডার বদলাবে না।</p>}
   {p.repeat&&!repeatFound&&<p role="alert" className="mb-4 rounded-xl bg-amber-100 p-3 text-sm">আগের অর্ডার পাওয়া যায়নি। নতুন অর্ডার শুরু করুন।</p>}
   {p.error&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">তথ্য যাচাই করুন বা একটু পরে আবার চেষ্টা করুন।</p>}
   <MultiOrderForm initial={initial} action={submitRequest} marketplaceNames={marketplaceNames}/>
  </div></main>;
}

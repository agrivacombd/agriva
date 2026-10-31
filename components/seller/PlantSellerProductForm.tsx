"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
const CATEGORIES = [
  ["indoor-outdoor-plants", "ইনডোর ও আউটডোর গাছ"], ["fruit-plants", "ফলের গাছ ও চারা"],
  ["flower-plants", "ফুলের গাছ ও চারা"], ["seeds-saplings", "বীজ ও চারা"],
  ["cactus-succulents", "ক্যাকটাস ও সাকুলেন্ট"], ["pots-planters", "টব ও প্ল্যান্টার"],
  ["gardening-supplies", "বাগানের উপকরণ"], ["soil-compost", "মাটি ও কম্পোস্ট"],
] as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export default function PlantSellerProductForm() {
  const [form,setForm]=useState({name:"",scientific_name:"",category_slug:CATEGORIES[0][0],plant_size:"",pot_size:"",plant_age:"",sunlight:"",watering:"",flowering_season:"",delivery_area:"",description:"",price:"",stock:"",unit:"piece"});
  const [image,setImage]=useState<File|null>(null); const [preview,setPreview]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  function set(key:keyof typeof form,value:string){setForm(current=>({...current,[key]:value}));}
  useEffect(()=>{if(!preview)return;return()=>URL.revokeObjectURL(preview);},[preview]);
  function chooseImage(file?:File){setMessage("");if(!file){setImage(null);setPreview("");return;}if(!IMAGE_TYPES.includes(file.type)||file.size>MAX_IMAGE_SIZE){setImage(null);setPreview("");setMessage("শুধু JPG, PNG বা WebP ছবি দিন; সর্বোচ্চ ৫ MB।");return;}setImage(file);setPreview(URL.createObjectURL(file));}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setMessage("");const supabase=createSupabaseBrowserClient();let uploadedPath:string|null=null;
    try{
      let imageUrl:string|null=null;
      if(image){const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error("ছবি আপলোড করতে আবার লগইন করুন।");const ext=image.type==="image/png"?"png":image.type==="image/webp"?"webp":"jpg";uploadedPath=`${user.id}/${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from("plant-product-images").upload(uploadedPath,image,{contentType:image.type,cacheControl:"3600",upsert:false});if(error)throw new Error("ছবি আপলোড করা যায়নি। Plant Seller permission যাচাই করুন।");imageUrl=supabase.storage.from("plant-product-images").getPublicUrl(uploadedPath).data.publicUrl;}
      const response=await fetch("/api/plant-seller/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,price:Number(form.price),stock:Number(form.stock),image_url:imageUrl})});const data=await response.json().catch(()=>({}));if(!response.ok){if(uploadedPath)await supabase.storage.from("plant-product-images").remove([uploadedPath]);throw new Error(data.error||"পণ্য জমা দেওয়া যায়নি।");}
      uploadedPath=null;setMessage("Plant Market পণ্যটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের আগে এটি প্রকাশিত হবে না।");setForm({name:"",scientific_name:"",category_slug:CATEGORIES[0][0],plant_size:"",pot_size:"",plant_age:"",sunlight:"",watering:"",flowering_season:"",delivery_area:"",description:"",price:"",stock:"",unit:"piece"});setImage(null);setPreview("");
    }catch(error){if(uploadedPath){const {error:cleanupError}=await supabase.storage.from("plant-product-images").remove([uploadedPath]);if(cleanupError)console.warn("Plant product image cleanup failed",cleanupError.message);}setMessage(error instanceof Error?error.message:"নেটওয়ার্ক সমস্যা হয়েছে।");}finally{setLoading(false);}
  }
  const field="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3";
  return <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
    <label className="block text-sm font-bold">গাছ / পণ্যের নাম<input required minLength={2} maxLength={160} value={form.name} onChange={e=>set("name",e.target.value)} className={field}/></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">বৈজ্ঞানিক নাম (ঐচ্ছিক)<input maxLength={160} value={form.scientific_name} onChange={e=>set("scientific_name",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">ক্যাটাগরি<select value={form.category_slug} onChange={e=>set("category_slug",e.target.value)} className={field}>{CATEGORIES.map(([slug,label])=><option key={slug} value={slug}>{label}</option>)}</select></label>
      <label className="block text-sm font-bold">গাছের উচ্চতা / আকার<input maxLength={80} value={form.plant_size} onChange={e=>set("plant_size",e.target.value)} placeholder="যেমন: ২ ফুট" className={field}/></label>
      <label className="block text-sm font-bold">টবের সাইজ<input maxLength={80} value={form.pot_size} onChange={e=>set("pot_size",e.target.value)} placeholder="যেমন: ৮ ইঞ্চি" className={field}/></label>
      <label className="block text-sm font-bold">গাছের বয়স<input maxLength={80} value={form.plant_age} onChange={e=>set("plant_age",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">সূর্যালোকের প্রয়োজন<input maxLength={300} value={form.sunlight} onChange={e=>set("sunlight",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">পানি দেওয়ার নিয়ম<input maxLength={300} value={form.watering} onChange={e=>set("watering",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">ফুল / ফলের মৌসুম<input maxLength={120} value={form.flowering_season} onChange={e=>set("flowering_season",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">ডেলিভারি এলাকা<input maxLength={160} value={form.delivery_area} onChange={e=>set("delivery_area",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">বিক্রয় একক<select value={form.unit} onChange={e=>set("unit",e.target.value)} className={field}><option value="piece">প্রতি গাছ / পিস</option><option value="pot">প্রতি টব</option><option value="pack">প্যাকেট</option><option value="tray">ট্রে</option></select></label>
      <label className="block text-sm font-bold">মূল্য (৳)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} className={field}/></label>
      <label className="block text-sm font-bold">স্টক<input required type="number" min="0" step="1" value={form.stock} onChange={e=>set("stock",e.target.value)} className={field}/></label>
    </div>
    <label className="block text-sm font-bold">পণ্যের বিবরণ<textarea maxLength={5000} rows={4} value={form.description} onChange={e=>set("description",e.target.value)} className={field}/></label>
    <div><label className="block text-sm font-bold" htmlFor="plant-product-image">বাস্তব পণ্যের ছবি (ঐচ্ছিক, সর্বোচ্চ ৫ MB)</label><input id="plant-product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0])} className="mt-2 block w-full rounded-xl border p-3 text-sm"/>{preview&&<img src={preview} alt="পণ্যের ছবির প্রিভিউ" className="mt-3 h-40 rounded-xl object-contain"/>}</div>
    <button disabled={loading} className="min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-extrabold text-white disabled:opacity-60">{loading?"জমা হচ্ছে…":"Plant Market-এ পণ্য জমা দিন"}</button>
    {message&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">{message}</p>}
  </form>;
}
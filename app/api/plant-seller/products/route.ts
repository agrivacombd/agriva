import { NextRequest,NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkModuleAccess } from "@/lib/authz/module-access";
const CATEGORIES:Record<string,string>={"indoor-outdoor-plants":"ইনডোর ও আউটডোর গাছ","fruit-plants":"ফলের গাছ ও চারা","flower-plants":"ফুলের গাছ ও চারা","seeds-saplings":"বীজ ও চারা","cactus-succulents":"ক্যাকটাস ও সাকুলেন্ট","pots-planters":"টব ও প্ল্যান্টার","gardening-supplies":"বাগানের উপকরণ","soil-compost":"মাটি ও কম্পোস্ট"};
export async function POST(request:NextRequest){
 const supabase=await createSupabaseServerClient();const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Login required"},{status:401});
 const [{data:profile,error:profileError},access]=await Promise.all([
  supabase.from("gardener_profiles").select("verification_status").eq("user_id",user.id).maybeSingle(),
  checkModuleAccess("plant_market","create",{type:"global"})
 ]);
 if(profileError)return NextResponse.json({error:"Gardener verification unavailable"},{status:503});
 if(profile?.verification_status!=="verified"||!access.allowed)return NextResponse.json({error:"Verified Plant Market seller approval required."},{status:access.reason==="authorization_unavailable"?503:403});
 const body=await request.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid product"},{status:400});
 const name=typeof body.name==="string"?body.name.trim():"",categorySlug=typeof body.category_slug==="string"?body.category_slug:"",description=typeof body.description==="string"?body.description.trim():"",price=Number(body.price),stock=Number(body.stock),unit=typeof body.unit==="string"?body.unit:"piece",imageUrl=typeof body.image_url==="string"&&body.image_url.trim()?body.image_url.trim():null;
 if(name.length<2||name.length>160||!CATEGORIES[categorySlug]||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!["piece","pot","pack","tray"].includes(unit)||description.length>5000)return NextResponse.json({error:"পণ্যের নাম, Plant Market category, মূল্য, মজুত ও একক যাচাই করুন।"},{status:400});
 if(imageUrl){try{const image=new URL(imageUrl),base=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||""),prefix=`/storage/v1/object/public/plant-product-images/${user.id}/`,fileName=image.pathname.startsWith(prefix)?image.pathname.slice(prefix.length):"",validFile=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(fileName);if(image.protocol!=="https:"||image.origin!==base.origin||!validFile||image.search||image.hash)return NextResponse.json({error:"শুধু নিজের Plant Market account থেকে আপলোড করা ছবি ব্যবহার করুন।"},{status:400});}catch{return NextResponse.json({error:"ছবির URL সঠিক নয়।"},{status:400});}}
 const slugBase=name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,90)||"plant",slug=`${slugBase}-${crypto.randomUUID().slice(0,8)}`;
 const {data,error}=await supabase.from("plant_market_products").insert({seller_id:user.id,name,slug,scientific_name:String(body.scientific_name||"").trim().slice(0,160)||null,category_slug:categorySlug,category:CATEGORIES[categorySlug],plant_size:String(body.plant_size||"").trim().slice(0,80)||null,pot_size:String(body.pot_size||"").trim().slice(0,80)||null,plant_age:String(body.plant_age||"").trim().slice(0,80)||null,sunlight:String(body.sunlight||"").trim().slice(0,300)||null,watering:String(body.watering||"").trim().slice(0,300)||null,flowering_season:String(body.flowering_season||"").trim().slice(0,120)||null,delivery_area:String(body.delivery_area||"").trim().slice(0,160)||null,description,price,stock,unit,image_url:imageUrl,status:"draft"}).select("id,name,slug,category,category_slug,image_url,status").single();
 if(error){console.error("Plant Market product creation failed",{code:error.code||"unknown"});return NextResponse.json({error:"Plant Market পণ্য সংরক্ষণ করা যায়নি। Database migration ও তথ্য যাচাই করুন।"},{status:400});}
 return NextResponse.json({product:data},{status:201});
}
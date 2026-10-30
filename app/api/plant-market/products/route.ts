import { NextRequest,NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkModuleAccess } from "@/lib/authz/module-access";
const CATEGORIES:Record<string,string>={"indoor-plants":"Indoor plants","outdoor-plants":"Outdoor / ornamental plants","seedlings":"চারা ও seedlings","seeds":"বীজ","pots":"টব ও planter","soil-compost":"মাটি ও compost","gardening-tools":"বাগানের সরঞ্জাম","fertilizer":"জৈব সার ও plant food"};
const UNITS=["piece","pack","kg","g","bag","liter"] as const;
export async function POST(request:NextRequest){
 const supabase=await createSupabaseServerClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Login required"},{status:401});
 const {data:profile,error:profileError}=await supabase.from("gardener_profiles").select("verification_status").eq("user_id",user.id).maybeSingle();
 if(profileError)return NextResponse.json({error:"Gardener verification unavailable"},{status:503});
 if(profile?.verification_status!=="verified")return NextResponse.json({error:"Verified Plant Market gardener approval required"},{status:403});
 const access=await checkModuleAccess("plant_market","create",{type:"global"});
 if(!access.allowed)return NextResponse.json({error:"Plant Market seller approval required"},{status:access.reason==="authorization_unavailable"?503:access.reason==="unauthenticated"?401:403});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid product"},{status:400});
 const name=typeof body.name==="string"?body.name.trim():"",categorySlug=typeof body.categorySlug==="string"?body.categorySlug:"";
 const description=typeof body.description==="string"?body.description.trim():"";
 const price=Number(body.price),stock=Number(body.stock),unit=typeof body.unit==="string"?body.unit:"";
 if(!name||name.length>160||!CATEGORIES[categorySlug]||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!(UNITS as readonly string[]).includes(unit)||description.length>3000)
  return NextResponse.json({error:"পণ্যের নাম, Plant Market category, মূল্য, মজুত ও একক যাচাই করুন।"},{status:400});
 const slugBase=name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,100)||"plant";
 const slug=slugBase+"-"+crypto.randomUUID().slice(0,8);
 const {data,error}=await supabase.from("products").insert({
  farmer_id:user.id,name,slug,category:CATEGORIES[categorySlug],category_slug:categorySlug,
  subcategory_slug:null,price,stock,unit,description,status:"draft",marketplace_channel:"plant_market"
 }).select("id,name,category,category_slug,status,marketplace_channel").single();
 if(error){console.error("Plant Market product creation failed",{code:error.code||"unknown"});return NextResponse.json({error:"পণ্য সংরক্ষণ করা যায়নি। Database migration যাচাই করুন।"},{status:400});}
 return NextResponse.json({product:data},{status:201});
}

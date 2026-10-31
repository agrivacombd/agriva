import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
export async function GET(){
  const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
  const {data,error}=await access.supabase.from("plant_market_products").select("id,seller_id,name,slug,scientific_name,category,description,price,stock,unit,image_url,status,created_at").in("status",["draft","rejected","suspended"]).order("created_at",{ascending:true}).limit(100);
  if(error)return NextResponse.json({error:"Plant Market product queue লোড করা যায়নি।"},{status:400});
  return NextResponse.json({products:data});
}
export async function PATCH(request:NextRequest){
  const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
  const body=(await request.json().catch(()=>({})))||{};const id=String(body.id||"");const status=body.status;const note=String(body.moderation_note||"").trim();
  if(!id||!["active","rejected","suspended"].includes(status)||note.length>1000)return NextResponse.json({error:"Product moderation decision যাচাই করুন।"},{status:400});
  const {data:product,error:lookupError}=await access.supabase.from("plant_market_products").select("id,seller_id").eq("id",id).in("status",["draft","rejected","suspended"]).maybeSingle();
  if(lookupError||!product)return NextResponse.json({error:"পণ্যটি পাওয়া যায়নি বা ইতিমধ্যে পর্যালোচিত হয়েছে।"},{status:409});
  if(status==="active"){
    const {data:permission,error:permissionError}=await access.supabase.from("plant_seller_permissions").select("user_id").eq("user_id",product.seller_id).eq("status","approved").maybeSingle();
    if(permissionError||!permission)return NextResponse.json({error:"এই Seller-এর Plant Market permission সক্রিয় নয়। আগে আলাদাভাবে অনুমোদন দিন।"},{status:409});
  }
  const {data,error}=await access.supabase.from("plant_market_products").update({status,moderation_note:note||null,moderated_by:access.user.id,moderated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).in("status",["draft","rejected","suspended"]).select("id,name,status,moderated_at").maybeSingle();
  if(error||!data)return NextResponse.json({error:"পণ্যটি পাওয়া যায়নি বা ইতিমধ্যে পর্যালোচিত হয়েছে।"},{status:409});
  return NextResponse.json({product:data});
}
import { NextRequest,NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request:NextRequest){
 const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
 const status=request.nextUrl.searchParams.get("status")||"pending";
 if(!["pending","approved","rejected"].includes(status))return NextResponse.json({error:"Invalid status."},{status:400});
 const {data,error}=await access.supabase.from("plant_market_reviews").select("id,product_id,reviewer_id,rating,title,body,photo_urls,verified_purchase,status,moderation_note,created_at,plant_market_products(name,slug)").eq("status",status).order("created_at",{ascending:true}).limit(100);
 if(error)return NextResponse.json({error:"Review queue load failed."},{status:503});
 const bucket=access.supabase.storage.from("plant-market-review-photos");
 const reviews=await Promise.all((data||[]).map(async review=>({
  ...review,
  photo_urls:await Promise.all((review.photo_urls||[]).map(async path=>{
   const {data:signed}=await bucket.createSignedUrl(path,3600);
   return signed?.signedUrl||null;
  }))
 })));
 return NextResponse.json({reviews:reviews.map(r=>({...r,photo_urls:r.photo_urls.filter(Boolean)}))});
}
export async function PATCH(request:NextRequest){
 const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
 const body=await request.json().catch(()=>null);
 const id=typeof body?.id==="string"?body.id:"",status=body?.status,note=typeof body?.moderation_note==="string"?body.moderation_note.trim():"";
 if(!UUID.test(id)||!["approved","rejected"].includes(status)||note.length>1000||(status==="rejected"&&!note))return NextResponse.json({error:"Review status অথবা moderation note সঠিক নয়।"},{status:400});
 const {data,error}=await access.supabase.from("plant_market_reviews").update({status,moderation_note:note||null,moderated_by:access.user.id,moderated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).eq("status","pending").select("id,status").maybeSingle();
 if(error||!data)return NextResponse.json({error:"Review moderation update failed."},{status:409});
 return NextResponse.json({review:data});
}

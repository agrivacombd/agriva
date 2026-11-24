import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES=new Set(["image/jpeg","image/png","image/webp"]);
const MAX_PHOTOS=3, MAX_BYTES=4*1024*1024;

export async function GET(request:NextRequest){
  const productId=request.nextUrl.searchParams.get("productId")||"";
  if(!UUID.test(productId))return NextResponse.json({error:"Product ID সঠিক নয়।"},{status:400});
  const supabase=await createSupabaseServerClient();
  const {data,error,count}=await supabase.from("plant_market_reviews").select("id,rating,title,body,photo_urls,verified_purchase,created_at",{count:"exact"}).eq("product_id",productId).eq("status","approved").order("created_at",{ascending:false}).limit(50);
  if(error)return NextResponse.json({error:"Reviews লোড করা যায়নি।"},{status:503});
  const bucket=supabase.storage.from("plant-market-review-photos");
  const rows=await Promise.all((data||[]).map(async review=>({
    ...review,
    photo_urls:await Promise.all((review.photo_urls||[]).map(async (path:string)=>{
      const {data:signed}=await bucket.createSignedUrl(path,3600);
      return signed?.signedUrl||null;
    }))
  })));
  const {data:ratingRows,error:ratingError}=await supabase.from("plant_market_reviews").select("rating").eq("product_id",productId).eq("status","approved");
  if(ratingError)return NextResponse.json({error:"Review summary লোড করা যায়নি।"},{status:503});
  const average=ratingRows?.length?ratingRows.reduce((sum,r)=>sum+r.rating,0)/ratingRows.length:0;
  const ratingDistribution={1:0,2:0,3:0,4:0,5:0};
  for(const review of ratingRows||[])ratingDistribution[review.rating as 1|2|3|4|5]++;
  return NextResponse.json({reviews:rows.map(r=>({...r,photo_urls:r.photo_urls.filter(Boolean)})),reviewCount:count??0,averageRating:Number(average.toFixed(1)),ratingDistribution});
}

export async function POST(request:NextRequest){
  const supabase=await createSupabaseServerClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Review দিতে লগইন করুন।"},{status:401});
  const form=await request.formData().catch(()=>null);
  if(!form)return NextResponse.json({error:"Review তথ্য পাওয়া যায়নি।"},{status:400});
  const productId=String(form.get("productId")||"");
  const rating=Number(form.get("rating"));
  const title=String(form.get("title")||"").trim();
  const body=String(form.get("body")||"").trim();
  const files=form.getAll("photos").filter((v):v is File=>v instanceof File&&v.size>0);
  if(!UUID.test(productId)||!Number.isInteger(rating)||rating<1||rating>5||title.length<3||title.length>120||body.length<10||body.length>2000||files.length>MAX_PHOTOS)
    return NextResponse.json({error:"রেটিং ১–৫, শিরোনাম ৩–১২০ অক্ষর, অভিজ্ঞতা ১০–২০০০ অক্ষর এবং সর্বোচ্চ ৩টি ছবি দিন।"},{status:400});
  if(files.some(f=>f.size>MAX_BYTES||!TYPES.has(f.type)))return NextResponse.json({error:"প্রতিটি ছবি ৪ MB-এর কম JPEG, PNG বা WebP হতে হবে।"},{status:413});
  const {data:product,error:productError}=await supabase.from("plant_market_products").select("id").eq("id",productId).eq("status","active").maybeSingle();
  if(productError||!product)return NextResponse.json({error:"পণ্যটি পাওয়া যায়নি।"},{status:404});
  const {data:review,error:insertError}=await supabase.from("plant_market_reviews").insert({product_id:productId,reviewer_id:user.id,rating,title,body,status:"pending",verified_purchase:false,photo_urls:[]}).select("id").single();
  if(insertError){
    if(insertError.code==="23505")return NextResponse.json({error:"এই পণ্যে আপনি আগেই review দিয়েছেন।"},{status:409});
    return NextResponse.json({error:"Review জমা হয়নি। আবার চেষ্টা করুন।"},{status:400});
  }
  const bucket=supabase.storage.from("plant-market-review-photos");
  const paths:string[]=[];
  const urls:string[]=[];
  try{
    for(const file of files){
      const bytes=Buffer.from(await file.arrayBuffer());
      const image=sharp(bytes,{limitInputPixels:20_000_000,failOn:"error"}).rotate();
      const meta=await image.metadata();
      if(!meta.width||!meta.height||!["jpeg","png","webp"].includes(meta.format||""))throw new Error("invalid-image");
      const output=await image.resize(1600,1600,{fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
      const path=user.id+"/"+review.id+"/"+crypto.randomUUID()+".webp";
      const uploaded=await bucket.upload(path,output,{contentType:"image/webp",cacheControl:"31536000",upsert:false});
      if(uploaded.error)throw new Error("upload-failed");
      paths.push(path);urls.push(path);
    }
    if(urls.length){
      const {error:updateError}=await supabase.from("plant_market_reviews").update({photo_urls:urls}).eq("id",review.id).eq("reviewer_id",user.id).eq("status","pending");
      if(updateError)throw new Error("review-photo-update-failed");
    }
  }catch{
    if(paths.length)await bucket.remove(paths);
    await supabase.from("plant_market_reviews").delete().eq("id",review.id).eq("reviewer_id",user.id);
    return NextResponse.json({error:"ছবি আপলোড ব্যর্থ। Review জমা হয়নি, আবার চেষ্টা করুন।"},{status:400});
  }
  return NextResponse.json({reviewId:review.id,status:"pending",message:"Review জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।"},{status:201});
}

export async function PATCH(request:NextRequest){
  const {requireAdminApi}=await import("@/lib/admin/authz");
  const access=await requireAdminApi("catalog.moderate");
  if(!access.ok)return access.response;
  const body=await request.json().catch(()=>null);
  const id=typeof body?.id==="string"?body.id:"";
  const status=body?.status;
  const note=typeof body?.moderation_note==="string"?body.moderation_note.trim():"";
  if(!UUID.test(id)||!["approved","rejected"].includes(status)||note.length>1000||(status==="rejected"&&!note))
    return NextResponse.json({error:"Review status অথবা moderation note সঠিক নয়।"},{status:400});
  const {data,error}=await access.supabase.from("plant_market_reviews").update({status,moderation_note:note||null,moderated_by:access.user.id,moderated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id).eq("status","pending").select("id,status").maybeSingle();
  if(error||!data)return NextResponse.json({error:"Review moderation update failed."},{status:409});
  return NextResponse.json({review:data});
}

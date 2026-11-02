import { NextRequest,NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const clean=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
export async function POST(request:NextRequest){
 const supabase=await createSupabaseServerClient();const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"লগইন করে Plant Market অর্ডার করুন।"},{status:401});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object")return NextResponse.json({error:"Checkout তথ্য সঠিক নয়।"},{status:400});
 const key=clean(body.idempotencyKey,100);
 if(!/^[A-Za-z0-9_-]{16,100}$/.test(key))return NextResponse.json({error:"Checkout key সঠিক নয়। আবার চেষ্টা করুন।"},{status:400});
 const {data:settings,error:settingsError}=await supabase.rpc("get_public_site_settings");
 if(settingsError)return NextResponse.json({error:"Checkout settings যাচাই করা যাচ্ছে না।"},{status:503});
 const cod=(settings??[]).find((x:{key:string;value:string})=>x.key==="cod_enabled");
 if(cod?.value!=="true")return NextResponse.json({error:"Cash on Delivery বর্তমানে বন্ধ আছে।"},{status:403});
 const raw=body.shippingAddress&&typeof body.shippingAddress==="object"&&!Array.isArray(body.shippingAddress)?body.shippingAddress as Record<string,unknown>:{};
 const address={fullName:clean(raw.fullName,100),phone:clean(raw.phone,20),division:clean(raw.division,80),district:clean(raw.district,80),upazila:clean(raw.upazila,100),unionOrArea:clean(raw.unionOrArea,100),villageRoadHouse:clean(raw.villageRoadHouse,200),landmark:clean(raw.landmark,160),postalCode:clean(raw.postalCode,20),deliveryInstructions:clean(raw.deliveryInstructions,300)};
 if(!address.fullName||!address.phone||!address.division||!address.district||!address.upazila||!address.unionOrArea||!address.villageRoadHouse)return NextResponse.json({error:"নাম, মোবাইল, বিভাগ, জেলা, উপজেলা, এলাকা ও সম্পূর্ণ ঠিকানা দিন।"},{status:400});
 const phone=address.phone.replace(/[\s()-]/g,"");
 const normalized=phone.startsWith("+")?phone:phone.startsWith("880")?"+"+phone:phone.startsWith("01")?"+88"+phone:phone.startsWith("1")?"+880"+phone:"";
 if(!/^\+8801[3-9]\d{8}$/.test(normalized))return NextResponse.json({error:"সঠিক বাংলাদেশি মোবাইল নম্বর দিন।"},{status:400});
 const shippingAddress={...address,phone:normalized,address:[address.upazila,address.unionOrArea,address.villageRoadHouse].filter(Boolean).join(", ")};
 const {data,error}=await supabase.rpc("plant_market_finalize_checkout",{p_shipping_address:shippingAddress,p_idempotency_key:key});
 if(error){console.error("Plant Market checkout failed",{code:error.code||"unknown"});return NextResponse.json({error:"Plant Market checkout সম্পন্ন হয়নি। কার্ট ও স্টক যাচাই করে আবার চেষ্টা করুন।"},{status:409});}
 return NextResponse.json({checkoutId:data.checkoutId,orderIds:data.orderIds,total:Number(data.total),replayed:Boolean(data.replayed)});
}
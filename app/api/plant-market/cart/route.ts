import { NextRequest,NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(){
 const supabase=await createSupabaseServerClient();const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"লগইন করে Plant Market cart ব্যবহার করুন।"},{status:401});
 const {data:cart,error}=await supabase.from("plant_market_carts").select("id").eq("buyer_id",user.id).eq("status","active").maybeSingle();
 if(error)return NextResponse.json({error:"Plant Market cart লোড করা যায়নি।"},{status:503});
 if(!cart)return NextResponse.json({items:[]});
 const {data,error:itemError}=await supabase.from("plant_market_cart_items").select("id,product_id,quantity,plant_market_products(id,name,slug,price,stock,status,unit,image_url,seller_id)").eq("cart_id",cart.id).order("created_at",{ascending:true});
 if(itemError)return NextResponse.json({error:"Plant Market cart items লোড করা যায়নি।"},{status:503});
 return NextResponse.json({cartId:cart.id,items:data??[]});
}
export async function POST(request:NextRequest){
 const supabase=await createSupabaseServerClient();const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"লগইন করে Plant Market cart ব্যবহার করুন।"},{status:401});
 const body=await request.json().catch(()=>null);const productId=typeof body?.productId==="string"?body.productId:"";const quantity=Number(body?.quantity??1);
 if(!/^[0-9a-f-]{36}$/i.test(productId)||!Number.isInteger(quantity)||quantity<1||quantity>100)return NextResponse.json({error:"পণ্য ও পরিমাণ যাচাই করুন।"},{status:400});
 const {data,error}=await supabase.rpc("plant_market_add_to_cart",{p_product_id:productId,p_quantity:quantity});
 if(error){console.error("Plant Market add-to-cart failed",{code:error.code||"unknown"});return NextResponse.json({error:"কার্টে পণ্য যোগ করা যায়নি। স্টক যাচাই করে আবার চেষ্টা করুন।"},{status:409});}
 return NextResponse.json({cart:data});
}
export async function DELETE(request:NextRequest){
 const supabase=await createSupabaseServerClient();const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"লগইন প্রয়োজন।"},{status:401});
 const itemId=request.nextUrl.searchParams.get("itemId")||"";
 if(!/^[0-9a-f-]{36}$/i.test(itemId))return NextResponse.json({error:"Cart item সঠিক নয়।"},{status:400});
 const {data:cart}=await supabase.from("plant_market_carts").select("id").eq("buyer_id",user.id).eq("status","active").maybeSingle();
 if(!cart)return NextResponse.json({error:"সক্রিয় Plant Market cart পাওয়া যায়নি।"},{status:404});
 const {error}=await supabase.from("plant_market_cart_items").delete().eq("id",itemId).eq("cart_id",cart.id);
 if(error)return NextResponse.json({error:"Cart item সরানো যায়নি।"},{status:409});
 return NextResponse.json({ok:true});
}
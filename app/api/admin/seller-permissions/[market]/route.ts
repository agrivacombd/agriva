import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
export async function GET(_request:Request,{params}:{params:Promise<{market:string}>}){
  const {market}=await params;const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
  if(market==="marketplace"){
    const {data,error}=await access.supabase.from("marketplace_seller_permissions").select("user_id,status,approved_by,approved_at").eq("status","approved").order("approved_at",{ascending:false}).limit(500);
    if(error)return NextResponse.json({error:"Marketplace permission তালিকা লোড করা যায়নি।"},{status:400});
    return NextResponse.json({permissions:data});
  }
  if(market==="plant-market"){
    const {data,error}=await access.supabase.from("plant_seller_permissions").select("user_id,status,approved_by,approved_at").eq("status","approved").order("approved_at",{ascending:false}).limit(500);
    if(error)return NextResponse.json({error:"Plant Market permission তালিকা লোড করা যায়নি।"},{status:400});
    return NextResponse.json({permissions:data});
  }
  return NextResponse.json({error:"Unknown market."},{status:404});
}
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type Params={params:Promise<{market:string;userId:string}>};
export async function PATCH(request:NextRequest,{params}:Params){
  const {market,userId}=await params;
  const supabase=await createSupabaseServerClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return NextResponse.json({error:"Admin access required."},{status:403});
  const body=await request.json().catch(()=>({}));
  const status=body.status;
  if(!userId||!["approved","revoked"].includes(status))return NextResponse.json({error:"Permission status must be approved or revoked."},{status:400});
  const update={status,approved_by:status==="approved"?user.id:null,approved_at:status==="approved"?new Date().toISOString():null,updated_at:new Date().toISOString()};
  if(market==="marketplace"){
    const {data,error}=await supabase.from("marketplace_seller_permissions").update(update).eq("user_id",userId).select("user_id,status").maybeSingle();
    if(error||!data)return NextResponse.json({error:"Marketplace permission not found."},{status:404});
    return NextResponse.json({permission:data});
  }
  if(market==="plant-market"){
    const {data,error}=await supabase.from("plant_seller_permissions").update(update).eq("user_id",userId).select("user_id,status").maybeSingle();
    if(error||!data)return NextResponse.json({error:"Plant Market permission not found."},{status:404});
    return NextResponse.json({permission:data});
  }
  return NextResponse.json({error:"Unknown market."},{status:404});
}
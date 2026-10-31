import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
export async function GET(_request:Request,{params}:{params:Promise<{market:string}>}){
  const {market}=await params;
  const module=market==="marketplace"?"marketplace":market==="plant-market"?"plant_market":null;
  if(!module)return NextResponse.json({error:"Unknown market."},{status:404});
  const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
  const {data,error}=await access.supabase.from("user_module_grants")
    .select("user_id,module,permission,scope_type,scope_id,status,granted_by,granted_at,expires_at,reason")
    .eq("module",module).eq("permission","create").eq("status","active")
    .order("granted_at",{ascending:false}).limit(500);
  if(error)return NextResponse.json({error:"Seller permission তালিকা লোড করা যায়নি।"},{status:400});
  return NextResponse.json({permissions:data||[]});
}
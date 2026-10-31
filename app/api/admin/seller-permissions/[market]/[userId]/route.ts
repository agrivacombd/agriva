import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
type Params={params:Promise<{market:string;userId:string}>};
export async function PATCH(request:NextRequest,{params}:Params){
  const {market,userId}=await params;
  const access=await requireAdminApi("catalog.moderate");if(!access.ok)return access.response;
  const body=(await request.json().catch(()=>({})))||{};
  const module=market==="marketplace"?"marketplace":market==="plant-market"?"plant_market":null;
  if(!module||!userId)return NextResponse.json({error:"Unknown market or seller."},{status:400});
  const scopeId=module==="marketplace"?String(body.scope_id||""):null;
  if(module==="marketplace"&&!/^[0-9a-f-]{36}$/i.test(scopeId||""))return NextResponse.json({error:"Marketplace organization scope is required."},{status:400});
  const {data,error}=await access.supabase.rpc("admin_revoke_market_access",{
    p_user_id:userId,p_module:module,p_scope_id:scopeId
  });
  if(error)return NextResponse.json({error:"Permission বাতিল করা যায়নি। Admin access ও module migration যাচাই করুন।"},{status:400});
  if(!Number.isInteger(data)||data<1)return NextResponse.json({error:"এই scope-এ কোনো active permission পাওয়া যায়নি।"},{status:404});
  return NextResponse.json({revoked:data,module});
}
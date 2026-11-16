import {NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin/authz";
import {sortedLatest} from "@/lib/admin/order-notifications";
export const dynamic="force-dynamic";
/** Privileged, PII-free poll endpoint for authenticated administrators. */
export async function GET(){
  const auth=await requireAdminApi("orders.read");
  if(!auth.ok)return auth.response;
  const {data,error}=await auth.supabase.from("marketplace_orders")
    .select("id,created_at,status,total_amount")
    .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(30);
  if(error)return NextResponse.json({error:"Order feed unavailable"},{status:500,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json({userId:auth.user.id,orders:sortedLatest(data||[]),observedAt:new Date().toISOString()},{
    headers:{"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie"}});
}

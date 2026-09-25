import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

// Provider-agnostic webhook foundation. Replace signature verification with the provider's official scheme before production use.
export async function POST(req:NextRequest){
  const raw=await req.text();
  const signature=req.headers.get("x-payment-signature");
  const expected=process.env.PAYMENT_WEBHOOK_SECRET;
  if(!expected||!signature||signature!==expected)return NextResponse.json({error:"Invalid webhook signature"},{status:401});
  let body:any;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
  const {orderId,provider="custom",providerTransactionId,amount,status,idempotencyKey,metadata={}}=body||{};
  if(!orderId||!idempotencyKey||typeof amount!=="number"||!["authorized","paid","failed","refunded"].includes(status))return NextResponse.json({error:"Invalid payment event"},{status:400});
  const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)return NextResponse.json({error:"Server configuration missing"},{status:503});
  const s=createClient(u,k);
  const {error}=await s.rpc("record_payment_event",{p_order_id:orderId,p_provider:provider,p_provider_transaction_id:providerTransactionId||null,p_amount:amount,p_status:status,p_idempotency_key:idempotencyKey,p_metadata:metadata});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true});
}

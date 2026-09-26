import {NextRequest,NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";

interface ResellerLink {
  code: string;
  expires_at: string | null;
}

export async function POST(request:NextRequest){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const {productId}=await request.json().catch(()=>({}));if(!productId)return NextResponse.json({error:"productId is required"},{status:400});const {data:rawLink,error}=await supabase.rpc("create_reseller_link",{p_product_id:productId,p_days:15});if(error)return NextResponse.json({error:error.message},{status:400});if(!rawLink)return NextResponse.json({error:"Reseller link could not be created"},{status:400});const link:ResellerLink={code:String((rawLink as Record<string,unknown>).code ?? ""),expires_at:typeof (rawLink as Record<string,unknown>).expires_at==="string"?(rawLink as Record<string,unknown>).expires_at as string:null};return NextResponse.json({code:link.code,url:`/r/${link.code}`,expiresAt:link.expires_at});}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, context: {params: Promise<{id: string}>}) {
 const {id}=await context.params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:"Invalid product"},{status:400});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.from("plant_market_products").select("id,name,price,stock,status").eq("id",id).eq("status","active").maybeSingle();
 if(error)return NextResponse.json({error:"Product lookup failed"},{status:503});
 if(!data)return NextResponse.json({error:"Product unavailable"},{status:404});
 return NextResponse.json({product:data},{headers:{"Cache-Control":"no-store"}});
}

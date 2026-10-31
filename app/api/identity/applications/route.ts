import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
const MODULES = ["plant_market","marketplace","employer","transport","sell_harvest"] as const; // Keep legacy applications visible in history.
const SUBMIT_MODULES = ["plant_market","marketplace"] as const;
type NewApplicationModule = (typeof SUBMIT_MODULES)[number];
const clean = (v: unknown, n: number) => typeof v === "string" ? v.trim().slice(0,n) : "";
function evidencePaths(value: unknown, userId: string): string[] | null {
 if (value === undefined) return [];
 if (!Array.isArray(value) || value.length > 5) return null;
 const paths = value.map(v => typeof v === "string" ? v : "");
 return paths.every(p => p.startsWith(userId + "/") && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$/i.test(p)) ? paths : null;
}
export async function GET() {
 const supabase=await createSupabaseServerClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) return NextResponse.json({error:"Login required"},{status:401});
 const {data,error}=await supabase.from("module_access_applications").select("id,module,applicant_type,status,review_note,created_at,updated_at").eq("user_id",user.id).in("module",[...MODULES]).order("created_at",{ascending:false});
 if(error) return NextResponse.json({error:"Application status unavailable"},{status:503});
 return NextResponse.json({applications:data||[]});
}
export async function POST(request:NextRequest) {
 const supabase=await createSupabaseServerClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) return NextResponse.json({error:"Login required"},{status:401});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object"||!(SUBMIT_MODULES as readonly string[]).includes(body.module)) return NextResponse.json({error:"Invalid application. Sell Harvest does not require identity approval; log in and post directly."},{status:400});
 const selectedModule=body.module as NewApplicationModule;
 const {data:openApplication,error:openError}=await supabase.from("module_access_applications")
  .select("id,status").eq("user_id",user.id).eq("module",selectedModule).in("status",["pending","under_review","approved"]).limit(1).maybeSingle();
 if(openError)return NextResponse.json({error:"Application status unavailable"},{status:503});
 if(openApplication?.status==="approved")return NextResponse.json({error:"You already have approved access for this module"},{status:409});
 if(openApplication)return NextResponse.json({error:"An application is already under review"},{status:409});
 const paths=evidencePaths(body.evidencePaths,user.id);
 if(!paths||paths.length===0) return NextResponse.json({error:"At least one identity evidence file is required"},{status:400});
 if(paths.length) {
  const {data:stored,error}=await supabase.storage.from("identity-verification").list(user.id,{limit:100});
  if(error) return NextResponse.json({error:"Evidence could not be verified"},{status:503});
  const existing=new Set((stored||[]).map(item=>user.id+"/"+item.name));
  if(!paths.every(path=>existing.has(path))) return NextResponse.json({error:"Evidence file missing"},{status:400});
 }
 let applicantType:string, applicantData:Record<string,unknown>, organizationId:string|null=null;
 if(selectedModule==="plant_market") {
  applicantType="gardener";
  const district=clean(body.district,80), experience=clean(body.experienceNote,2000);
  const types=Array.isArray(body.gardeningTypes)?body.gardeningTypes.filter((v:unknown)=>typeof v==="string").map((v:string)=>v.slice(0,40)).slice(0,8):[];
  if(!district||!experience||experience.length<20||!types.length) return NextResponse.json({error:"District, gardening type and experience are required"},{status:400});
  applicantData={district,gardening_types:types,experience_note:experience,evidence_paths:paths};
 } else {
  applicantType="business";
  const name=clean(body.organizationName,180),type=clean(body.organizationType,30),address=clean(body.businessAddress,300);
  const tradeLicense=clean(body.tradeLicense,100),website=clean(body.website,300);
  if(!name||!address||!["company","shop","dealer","cooperative","other"].includes(type)) return NextResponse.json({error:"Business name, type and address are required"},{status:400});
  const {data:verifiedOrganization,error:verifiedError}=await supabase.from("organizations").select("id").eq("owner_id",user.id).eq("status","verified").limit(1).maybeSingle();
  if(verifiedError)return NextResponse.json({error:"Verified business profile could not be checked"},{status:503});
  if(verifiedOrganization){
   organizationId=verifiedOrganization.id;
  }else{
   const {data:existingOrganization,error:existingError}=await supabase.from("organizations").select("id").eq("owner_id",user.id).eq("status","pending").limit(1).maybeSingle();
   if(existingError)return NextResponse.json({error:"Business profile could not be checked"},{status:503});
   if(existingOrganization){
    const {error:updateError}=await supabase.from("organizations").update({name,organization_type:type,registration_number:tradeLicense||null}).eq("id",existingOrganization.id);
    if(updateError)return NextResponse.json({error:"Business profile could not be updated"},{status:409});
    organizationId=existingOrganization.id;
   }else{
    const {data:organization,error}=await supabase.from("organizations").insert({owner_id:user.id,name,organization_type:type,registration_number:tradeLicense||null,status:"pending"}).select("id").single();
    if(error||!organization)return NextResponse.json({error:"Business profile could not be created"},{status:409});
    organizationId=organization.id;
   }
  }
  applicantData={organization_name:name,organization_type:type,trade_license:tradeLicense,business_address:address,website,evidence_paths:paths};
 }
 const {data:application,error}=await supabase.from("module_access_applications").insert({
  user_id:user.id,module:selectedModule,applicant_type:applicantType,organization_id:organizationId,applicant_data:applicantData,status:"pending"
 }).select("id,module,status,created_at").single();
 if(error||!application) return NextResponse.json({error:error?.code==="23505"?"An application is already open":"Application could not be submitted"},{status:409});
 return NextResponse.json({application},{status:201});
}

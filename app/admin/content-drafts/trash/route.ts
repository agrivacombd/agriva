import {NextRequest,NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {requireAdminApi} from "@/lib/admin/authz";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Authorized content-only deletion, not marketplace product/order removal. */
export async function POST(request:NextRequest){
  const payload=await request.json().catch(()=>null);
  const id=typeof payload?.id==="string"?payload.id.trim():"";
  const action=payload?.action;
  if(!uuid.test(id)||!["trash","restore","permanent"].includes(action)){
    return NextResponse.json({error:"Valid content ID and removal action required."},{status:400});
  }
  const base=await requireAdminApi("content.edit");
  if(!base.ok)return base.response;
  const {supabase,user}=base;
  const {data:entry,error:readError}=await supabase.from("content_drafts")
    .select("id,slug,title,status,content_type,deleted_at,deleted_from_status")
    .eq("id",id).maybeSingle();
  if(readError)return NextResponse.json({error:"Could not inspect content."},{status:503});
  if(!entry)return NextResponse.json({error:"Content not found."},{status:404});
  if(action==="permanent"||(action==="trash"&&entry.status==="published")){
    const privilege=await requireAdminApi("content.publish");
    if(!privilege.ok)return privilege.response;
  }
  if(action==="trash"){
    if(entry.deleted_at)return NextResponse.json({error:"Already in Trash."},{status:409});
    if(payload?.confirm!==true)return NextResponse.json({error:"Explicit confirmation required."},{status:400});
    const {data,error}=await supabase.from("content_drafts").update({
      deleted_at:new Date().toISOString(),deleted_by:user.id,deleted_from_status:entry.status,
      status:"draft",reviewed_by:null,reviewed_at:null,
    }).eq("id",id).eq("status",entry.status).is("deleted_at",null).select("id").maybeSingle();
    if(error)return NextResponse.json({error:"Could not move content to Trash."},{status:500});
    if(!data)return NextResponse.json({error:"Content changed; reload and try again."},{status:409});
  }else if(action==="restore"){
    if(!entry.deleted_at)return NextResponse.json({error:"Content is not in Trash."},{status:409});
    if(payload?.confirm!==true)return NextResponse.json({error:"Explicit restore confirmation required."},{status:400});
    const {data,error}=await supabase.from("content_drafts").update({
      deleted_at:null,deleted_by:null,deleted_from_status:null,
      status:"draft",reviewed_by:null,reviewed_at:null,
    }).eq("id",id).eq("deleted_at",entry.deleted_at).select("id").maybeSingle();
    if(error)return NextResponse.json({error:"Could not restore the post."},{status:500});
    if(!data)return NextResponse.json({error:"Content changed; reload and try again."},{status:409});
  }else{
    if(!entry.deleted_at)return NextResponse.json({error:"Move content to Trash first."},{status:409});
    if(payload?.confirmPermanent!==true||typeof payload?.confirmSlug!=="string"||payload.confirmSlug!==entry.slug){
      return NextResponse.json({error:"Type the exact post slug to confirm permanent deletion."},{status:400});
    }
    // FK ON DELETE CASCADE removes content_draft_revisions; the audit trigger
    // retains only a small deletion receipt, not the article body.
    const {data,error}=await supabase.from("content_drafts").delete()
      .eq("id",id).eq("deleted_at",entry.deleted_at).select("id").maybeSingle();
    if(error)return NextResponse.json({error:"Permanent deletion failed; related data may still be protected."},{status:500});
    if(!data)return NextResponse.json({error:"Content changed; reload and try again."},{status:409});
  }
  revalidatePath("/admin/articles");
  revalidatePath("/admin/content-drafts");
  revalidatePath("/blog");
  revalidatePath("/blog/"+entry.slug);
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ok:true,action,id,restoredAsDraft:action==="restore"},
    {headers:{"Cache-Control":"private, no-store"}});
}

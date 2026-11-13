import {NextRequest,NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin/authz";
export async function POST(request:NextRequest){
 const access=await requireAdminApi("content.edit");if(!access.ok)return access.response;
 const {supabase}=access;
 const body=await request.json().catch(()=>null);
 const title=typeof body?.title==="string"?body.title.trim():"";
 const slug=typeof body?.slug==="string"?body.slug.trim():"";
 const markdown=typeof body?.body_markdown==="string"?body.body_markdown.trim():"";
 if(!title||title.length>160||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>180||!markdown||markdown.length>50000)return NextResponse.json({error:"Valid title, English slug and article body required."},{status:400});
 const {data,error}=await supabase.from("content_drafts").insert({content_type:"article",title,slug,body_markdown:markdown,primary_keyword:typeof body.primary_keyword==="string"?body.primary_keyword.slice(0,160):null,meta_title:typeof body.meta_title==="string"?body.meta_title.slice(0,160):null,meta_description:typeof body.meta_description==="string"?body.meta_description.slice(0,320):null,status:"draft"}).select("id,status,slug").single();
 if(error){console.error("AI draft insert failed",error.code);return NextResponse.json({error:error.code==="23505"?"This slug is already in use. Choose another.":"Unable to save draft; check database permissions and schema."},{status:error.code==="23505"?409:500});}
 return NextResponse.json({draft:data},{status:201});
}

export async function GET(request:NextRequest){
 const access=await requireAdminApi("content.edit");if(!access.ok)return access.response;
 const id=new URL(request.url).searchParams.get("id")||"";
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))return NextResponse.json({error:"Valid draft ID required."},{status:400});
 const {data,error}=await access.supabase.from("content_drafts").select("id,title,slug,body_markdown,primary_keyword,meta_title,meta_description,status,hero_image_url").eq("id",id).maybeSingle();
 if(error||!data)return NextResponse.json({error:"Draft not found or access denied."},{status:404});
 return NextResponse.json({draft:data});
}

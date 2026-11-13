import {NextRequest,NextResponse} from "next/server";
import sharp from "sharp";
import {requireAdminApi} from "@/lib/admin/authz";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const access=await requireAdminApi("content.edit");if(!access.ok)return access.response;
 const body=await request.json().catch(()=>null);
 const id=typeof body?.id==="string"?body.id:"";
 const image=typeof body?.image==="string"?body.image:"";
 const alt=typeof body?.alt==="string"?body.alt.trim().slice(0,250):"";
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)||!image.startsWith("data:image/webp;base64,")||!alt)return NextResponse.json({error:"Valid saved draft, WebP image and alt text required."},{status:400});
 const encoded=image.slice("data:image/webp;base64,".length);
 if(encoded.length>5_000_000||!/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded))return NextResponse.json({error:"Invalid or oversized image (max 3.75 MB)."}, {status:413});
 const bytes=Buffer.from(encoded,"base64");
 if(bytes.length<100||bytes.length>3_750_000||bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WEBP")return NextResponse.json({error:"Image must be valid WebP."},{status:400});
 const {supabase,user}=access;
 const {data:draft,error:readError}=await supabase.from("content_drafts").select("id,status,editorial_version").eq("id",id).maybeSingle();
 if(readError||!draft)return NextResponse.json({error:"Draft not found."},{status:404});
 if(draft.status==="published")return NextResponse.json({error:"Published articles cannot be edited here."},{status:409});
 const path="drafts/"+id+"/"+crypto.randomUUID()+".webp";
 const socialPath=path.replace(/\.webp$/,"-social.webp");
 let socialBytes:Buffer;try{socialBytes=await sharp(bytes).resize(1200,630,{fit:"cover",position:"attention"}).webp({quality:85,effort:4}).toBuffer();}catch{return NextResponse.json({error:"Could not prepare social sharing image."},{status:400});}
 const {error:uploadError}=await supabase.storage.from("article-hero-images").upload(path,bytes,{contentType:"image/webp",upsert:false,cacheControl:"3600"});
 if(uploadError){console.error("AGRIVA image storage upload",uploadError.message);return NextResponse.json({error:"Image upload failed. Verify Supabase Storage bucket permissions."},{status:500});}
 const {error:socialError}=await supabase.storage.from("article-hero-images").upload(socialPath,socialBytes,{contentType:"image/webp",upsert:false,cacheControl:"3600"});
 if(socialError){await supabase.storage.from("article-hero-images").remove([path]);return NextResponse.json({error:"Social sharing image upload failed."},{status:500});}
 const {data:publicUrl}=supabase.storage.from("article-hero-images").getPublicUrl(path);
 const {data:updated,error:updateError}=await supabase.from("content_drafts").update({hero_image_url:publicUrl.publicUrl,hero_image_alt:alt,hero_image_width:1536,hero_image_height:1024,hero_image_license:"AI-generated",hero_image_rights_note:"Generated with OpenAI image API; editorial accuracy and rights require admin verification.",hero_image_verified_by:null,hero_image_verified_at:null,...(draft.status==="approved"?{status:"review",reviewed_at:null}:{})}).eq("id",id).eq("status",draft.status).eq("editorial_version",draft.editorial_version).select("id,hero_image_url,status").maybeSingle();
 if(updateError||!updated)return NextResponse.json({error:"Image uploaded but draft update failed or changed concurrently. Please reload and retry; an unused storage object may remain."},{status:409});
 const {data:socialPublic}=supabase.storage.from("article-hero-images").getPublicUrl(socialPath);
 return NextResponse.json({ok:true,url:updated.hero_image_url,socialUrl:socialPublic.publicUrl,status:updated.status,uploadedBy:user.id});
}

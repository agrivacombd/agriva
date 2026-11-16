import {NextRequest,NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin/authz";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:NextRequest){
 const access=await requireAdminApi("content.edit");if(!access.ok)return access.response;
 const body=await request.json().catch(()=>null);
 const title=typeof body?.title==="string"?body.title.trim().slice(0,160):"";
 const article=typeof body?.article==="string"?body.article.trim().slice(0,2500):"";
 const style=body?.style==="illustration"?"clean editorial illustration":"realistic professional agricultural photography";
 if(!title||!article)return NextResponse.json({error:"Article title and content are required."},{status:400});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({error:"OpenAI API key is not configured."},{status:503});
 const prompt="Create an original wide 3:2 landscape hero image for a Bangladesh agricultural education article. Topic: "+title+". Article context: "+article+". Style: "+style+". Visually accurate crops, farming equipment and local growing conditions; appealing natural light, professional editorial composition. No text, typography, watermarks, logos, invented product packaging, exaggerated harvest or misleading agricultural practices. Image must relate directly to the article. Leave balanced negative space suitable for a website banner.";
 try{
  const response=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-image-1-mini",prompt,size:"1536x1024",quality:"medium",output_format:"webp",n:1}),signal:AbortSignal.timeout(55000),cache:"no-store"});
  if(!response.ok){const e=await response.json().catch(()=>null);console.error("AGRIVA image generation failed",{status:response.status,code:e?.error?.code});return NextResponse.json({error:response.status===429?"Image generation quota or rate limit reached. Check OpenAI API billing.":response.status===403?"Image model access is restricted. Check OpenAI organization verification.":"Image generation failed (HTTP "+response.status+")."},{status:502});}
  const data=await response.json();const b64=data?.data?.[0]?.b64_json;
  if(typeof b64!=="string"||!b64)return NextResponse.json({error:"OpenAI returned no image."},{status:502});
  return NextResponse.json({image:"data:image/webp;base64,"+b64,alt:title+" — AGRIVA agricultural article illustration",model:"gpt-image-1-mini",saved:false},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Image generation timed out or connection failed."},{status:502});}
}

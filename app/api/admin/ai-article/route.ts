import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
 const access = await requireAdminApi("content.edit");
 if (!access.ok) return access.response;
 const body = await request.json().catch(()=>null);
 const keyword = typeof body?.keyword==="string" ? body.keyword.trim() : "";
 const language = body?.language==="English" ? "English" : "Bengali";
 if (!keyword || keyword.length>160) return NextResponse.json({error:"Enter a keyword (1–160 characters)."},{status:400});
 const key=process.env.GEMINI_API_KEY;
 if(!key) return NextResponse.json({error:"Gemini API key not configured."},{status:503});
 const model=process.env.GEMINI_MODEL || "gemini-2.5-flash";
 if(!/^[a-zA-Z0-9._-]+$/.test(model)) return NextResponse.json({error:"Invalid Gemini model."},{status:503});
 const prompt="Write an original, useful, SEO-friendly Markdown article draft for AGRIVA Bangladesh agriculture website in "+language+". Topic: "+keyword+". Include H1, introduction, H2 practical sections, FAQ, SEO title and meta description. Aim for 700-1100 words. Never fabricate crop yields, pesticide doses, prices, statistics, citations or official recommendations. Mention local agricultural extension guidance for location-specific claims. No keyword stuffing. This is an unpublished draft requiring human review.";
 try {
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.4,maxOutputTokens:3500}}),signal:AbortSignal.timeout(45000),cache:"no-store"});
  if(!response.ok) {
   const failure=await response.json().catch(()=>null);
   const reason=typeof failure?.error?.status==="string" ? failure.error.status : "UNKNOWN";
   const codes:Record<number,string>={400:"Invalid model or request configuration",401:"Invalid Gemini API key",403:"API key access or permissions denied",404:"Configured Gemini model is unavailable",429:"Gemini quota or rate limit exceeded",500:"Gemini service error",503:"Gemini temporarily unavailable"};
   const message=codes[response.status] || "Gemini provider request failed";
   console.error("AGRIVA Gemini draft failure",{httpStatus:response.status,providerCode:reason,model});
   return NextResponse.json({error:message+" (HTTP "+response.status+", "+reason+").",providerStatus:response.status,providerCode:reason},{status:502});
  }
  const data=await response.json();
  const article=(data?.candidates?.[0]?.content?.parts??[]).map((part:{text?:string})=>part.text??"").join("").trim();
  if(!article) return NextResponse.json({error:"Gemini returned no article."},{status:502});
  return NextResponse.json({article,model,generatedWith:"Gemini",published:false});
 }catch{return NextResponse.json({error:"Gemini connection failed or timed out."},{status:502});}
}

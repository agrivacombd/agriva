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
  const base="https://generativelanguage.googleapis.com/v1beta/models/";
  const payload=JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.4,maxOutputTokens:3500}});
  const generate=(selected:string)=>fetch(base+encodeURIComponent(selected)+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:payload,signal:AbortSignal.timeout(45000),cache:"no-store"});
  let selectedModel=model;
  let response=await generate(selectedModel);
  let discoveryStatus:number|null=null;
  let discoveredModels:string[]=[];
  let providerMessage="";
  if(response.status===404){
    // The model configured for this key may have been retired or may not support generateContent.
    const discovery=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",{headers:{"x-goog-api-key":key},signal:AbortSignal.timeout(10000),cache:"no-store"});
    discoveryStatus=discovery.status;
    if(discovery.ok){
      const catalog=await discovery.json();
      const available=(Array.isArray(catalog?.models)?catalog.models:[])
        .filter((entry:{name?:string;supportedGenerationMethods?:string[]})=>entry?.supportedGenerationMethods?.includes("generateContent")&&typeof entry.name==="string")
        .map((entry:{name:string})=>entry.name.startsWith("models/") ? entry.name.slice(7) : entry.name);
      discoveredModels=available.filter(name=>name.startsWith("gemini-"));
      const fallback=[...discoveredModels].sort((a,b)=>Number(b.includes("flash"))-Number(a.includes("flash"))).find(candidate=>candidate!==model);
      if(fallback){selectedModel=fallback;response=await generate(selectedModel);}
    }
  }
  if(!response.ok){
    const failure=await response.json().catch(()=>null);
    const reason=typeof failure?.error?.status==="string"?failure.error.status:"UNKNOWN";
    providerMessage=typeof failure?.error?.message==="string"?failure.error.message:"";
    const hint=providerMessage.includes("not found for API version")?"Model unsupported by API version":providerMessage.includes("not supported for generateContent")?"Model does not support text generation":providerMessage.includes("not found")?"Model not found":"";
    const codes:Record<number,string>={400:"Invalid model or request configuration",401:"Invalid Gemini API key",403:"API key access or permissions denied",404:"No supported Gemini text model is available for this API key",429:"Gemini quota or rate limit exceeded",500:"Gemini service error",503:"Gemini temporarily unavailable"};
    console.error("AGRIVA Gemini draft failure",{httpStatus:response.status,providerCode:reason,model:selectedModel,discoveryStatus,availableCount:discoveredModels.length,hint});
    return NextResponse.json({error:(codes[response.status]||"Gemini provider request failed")+" (HTTP "+response.status+", "+reason+")."+(hint?" "+hint+".":"")+(discoveryStatus!==null?" Model discovery HTTP "+discoveryStatus+", available models: "+discoveredModels.length+".":""),providerStatus:response.status,providerCode:reason},{status:502});
  }
  const data=await response.json();
  const article=(data?.candidates?.[0]?.content?.parts??[]).map((part:{text?:string})=>part.text??"").join("").trim();
  if(!article) return NextResponse.json({error:"Gemini returned no article."},{status:502});
  return NextResponse.json({article,model:selectedModel,generatedWith:"Gemini",published:false});
 }catch{return NextResponse.json({error:"Gemini connection failed or timed out."},{status:502});}
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/authz";
export const dynamic = "force-dynamic";
export async function POST(request:NextRequest){
 const access=await requireAdminApi("content.edit");
 if(!access.ok)return access.response;
 const body=await request.json().catch(()=>null);
 const keyword=typeof body?.keyword==="string"?body.keyword.trim():"";
 const language=body?.language==="English"?"English":"Bengali";
 if(!keyword||keyword.length>160)return NextResponse.json({error:"Enter a keyword (1–160 characters)."},{status:400});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({error:"OPENAI_API_KEY is not configured."},{status:503});
 const model=process.env.OPENAI_MODEL||"gpt-4.1-mini";
 if(!/^[a-zA-Z0-9._-]+$/.test(model))return NextResponse.json({error:"Invalid OpenAI model configuration."},{status:503});
 const prompt="Write an original, practical, SEO-friendly Markdown article draft for AGRIVA Bangladesh agriculture website in "+language+". Focus keyword: "+keyword+". Include a strong H1, concise introduction, clear H2 sections, actionable growing guidance, FAQ, SEO title and meta description. Aim for 700–1100 words. Do not invent pesticide dosages, crop yields, government endorsements, statistics, prices, dates or citations. Acknowledge local crop/soil/season differences and advise checking agricultural extension guidance. No keyword stuffing. This is a draft requiring admin review.";
 try{
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model,messages:[{role:"system",content:"You are AGRIVA's careful agriculture content editor. Produce original and fact-conscious drafts; never auto-publish."},{role:"user",content:prompt}],temperature:0.4,max_completion_tokens:3500}),signal:AbortSignal.timeout(45000),cache:"no-store"});
  if(!response.ok){
   const failure=await response.json().catch(()=>null);
   const providerCode=typeof failure?.error?.code==="string"?failure.error.code:"UNKNOWN";
   const reasons:Record<number,string>={400:"OpenAI request or model configuration error",401:"OpenAI API key is invalid",403:"OpenAI API access denied",404:"Configured OpenAI model is unavailable",429:"OpenAI quota or rate limit reached; check API billing",500:"OpenAI service error",503:"OpenAI temporarily unavailable"};
   console.error("AGRIVA OpenAI article request failed",{httpStatus:response.status,providerCode,model});
   return NextResponse.json({error:(reasons[response.status]||"OpenAI article generation failed")+" (HTTP "+response.status+", "+providerCode+").",providerStatus:response.status},{status:502});
  }
  const data=await response.json();
  const article=typeof data?.choices?.[0]?.message?.content==="string"?data.choices[0].message.content.trim():"";
  if(!article)return NextResponse.json({error:"OpenAI returned no article text."},{status:502});
  return NextResponse.json({article,model,generatedWith:"OpenAI",published:false});
 }catch{return NextResponse.json({error:"OpenAI connection failed or timed out."},{status:502});}
}

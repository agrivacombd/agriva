import {NextRequest,NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin/authz";
import {editorialReady, getEditorialChecks} from "@/lib/content/article-quality";
function slugify(s:string){return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").slice(0,90)}

type AIContent={title:string;meta_title:string;meta_description:string;secondary_keywords:string[];outline:unknown[];faq:unknown[];internal_link_suggestions:string[];competitor_analysis:unknown[];body_markdown:string;slug:string};
function parseGenerated(raw:string,keyword:string):AIContent|null{
  try{
    const cleaned=raw.replace(/^`{3}(?:json)?\s*/i,"").replace(/\s*`{3}$/,"").trim();
    const item=JSON.parse(cleaned) as Record<string,unknown>;
    if(typeof item.title!=="string"||typeof item.body_markdown!=="string"||typeof item.meta_title!=="string"||typeof item.meta_description!=="string")return null;
    if(item.body_markdown.length<1700||item.body_markdown.length>50000)return null;
    const result:AIContent={
      title:item.title.trim().slice(0,160),slug:slugify(item.title),meta_title:item.meta_title.trim(),
      meta_description:item.meta_description.trim(),secondary_keywords:Array.isArray(item.secondary_keywords)?item.secondary_keywords.filter((x):x is string=>typeof x==="string").slice(0,12):[],
      outline:Array.isArray(item.outline)?item.outline:[],faq:Array.isArray(item.faq)?item.faq:[],
      internal_link_suggestions:Array.isArray(item.internal_link_suggestions)?item.internal_link_suggestions.filter((x):x is string=>typeof x==="string").slice(0,12):[],
      competitor_analysis:Array.isArray(item.competitor_analysis)?item.competitor_analysis:[],
      body_markdown:item.body_markdown.trim(),
    };
    if(!editorialReady({title:result.title,metaTitle:result.meta_title,metaDescription:result.meta_description,keyword,body:result.body_markdown}))return null;
    return result;
  }catch{return null;}
}
async function generateArticle(keyword:string,intent:string):Promise<AIContent|null>{
  const instructions= [
    "Prepare a COMPLETE fact-conscious, original Bangla SEO article for AGRIVA Bangladesh. Return ONLY a valid JSON object with keys:",
    "title,meta_title,meta_description,secondary_keywords (string array),outline (array),faq (array),internal_link_suggestions (array),competitor_analysis (array),body_markdown.",
    "Keyword: "+keyword+"; search intent: "+intent+".",
    "body_markdown: at least 700 substantive Bengali words, natural focus keyword in opening, 5+ H2 sections with correct ## headings.",
    "Include ## সাধারণ প্রশ্ন (FAQ) with 3+ ### questions each with thorough answers.",
    "Include ## তথ্যসূত্র with at least two REAL and relevant official/research HTTPS links. Do not fabricate URLs, claims, varieties, price or research results.",
    "Include relevant real AGRIVA internal link such as https://agriva.com.bd/marketplace or https://agriva.com.bd/plant-market, never invent a product slug.",
    "meta_title 25-65 characters, meta_description 100-180 characters. Title clear and unique.",
    "Do not write editor instructions, TODO, sample text, source placeholders, marketing overclaims, guaranteed yields or unsupported medical advice.",
    "If important factual information is uncertain, qualify it. Publishing always requires independent admin review; do not claim that URLs were opened or independently checked.",
  ].join("\n");
  const gemini=process.env.GEMINI_API_KEY;
  if(gemini){
    try{
      const model=process.env.GEMINI_MODEL||"gemini-2.0-flash";
      const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent?key="+encodeURIComponent(gemini),{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:instructions}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:6500}}),signal:AbortSignal.timeout(45000),cache:"no-store"
      });
      if(res.ok){const json=await res.json();const raw=json?.candidates?.[0]?.content?.parts?.map((part:{text?:string})=>part.text||"").join("")||"";const parsed=parseGenerated(raw,keyword);if(parsed)return parsed;}
    }catch{/* Retry with separately configured provider. */}
  }
  if(process.env.OPENAI_API_KEY){
    try{
      const model=process.env.OPENAI_MODEL||"gpt-4.1-mini";
      if(!/^[\w.-]+$/.test(model))return null;
      const res=await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({model,messages:[{role:"system",content:"You draft factual, well-structured agriculture content. No unverified claims or invented links."},{role:"user",content:instructions}],response_format:{type:"json_object"},max_completion_tokens:6500,temperature:0.3}),
        signal:AbortSignal.timeout(45000),cache:"no-store"
      });
      if(res.ok){const json=await res.json();const raw=json?.choices?.[0]?.message?.content;if(typeof raw==="string"){const parsed=parseGenerated(raw,keyword);if(parsed)return parsed;}}
    }catch{/* No fallback placeholder will be saved. */}
  }
  return null;
}
export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>null);
  const opportunityId=typeof body?.opportunityId==="string"?body.opportunityId.trim():"";
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(opportunityId))return NextResponse.json({error:"Valid opportunity UUID required."},{status:400});
  const access=await requireAdminApi("content.edit");if(!access.ok)return access.response;
  const {supabase,user}=access;
  const {data:opportunity,error:lookupError}=await supabase.from("content_opportunities")
    .select("id,keyword,intent,opportunity_type,title,slug,status").eq("id",opportunityId).maybeSingle();
  if(lookupError||!opportunity)return NextResponse.json({error:"Opportunity not found."},{status:404});
  if(!["open","draft","review","approved"].includes(opportunity.status))return NextResponse.json({error:"Opportunity is unavailable for drafting."},{status:409});
  const existing=await supabase.from("content_drafts").select("id").eq("opportunity_id",opportunity.id).limit(1);
  if(existing.data?.length)return NextResponse.json({error:"This opportunity already has a draft. Open the existing draft instead.",draftId:existing.data[0].id},{status:409});
  if(!process.env.GEMINI_API_KEY&&!process.env.OPENAI_API_KEY)return NextResponse.json({error:"No article AI provider configured. Nothing was saved. Set up GEMINI_API_KEY or OPENAI_API_KEY."},{status:503});
  const generated=await generateArticle(opportunity.keyword,opportunity.intent);
  if(!generated)return NextResponse.json({error:"AI did not return a complete, properly structured article with real references. No partial draft was saved. Try again or add source-backed writing manually."},{status:422});
  const contentType=opportunity.opportunity_type==="both"?"article":opportunity.opportunity_type;
  if(contentType!=="article")return NextResponse.json({error:"This complete-article generator only accepts article opportunities; product briefs use the product workflow."},{status:409});
  const title=(opportunity.title||generated.title).trim();
  const draftBody={title,metaTitle:generated.meta_title,metaDescription:generated.meta_description,keyword:opportunity.keyword,body:generated.body_markdown};
  if(!editorialReady(draftBody))return NextResponse.json({error:"Article title/SEO data requires revision. No draft was saved.",checks:getEditorialChecks(draftBody).filter(c=>!c.passed)},{status:422});
  const {data:draft,error:creationError}=await supabase.from("content_drafts").insert({
    opportunity_id:opportunity.id,content_type:"article",title,slug:opportunity.slug||generated.slug,
    meta_title:generated.meta_title,meta_description:generated.meta_description,primary_keyword:opportunity.keyword,
    secondary_keywords:generated.secondary_keywords,search_intent:opportunity.intent,
    outline:generated.outline,faq:generated.faq,internal_link_suggestions:generated.internal_link_suggestions,
    competitor_analysis:generated.competitor_analysis,body_markdown:generated.body_markdown,status:"draft",created_by:user.id
  }).select().single();
  if(creationError)return NextResponse.json({error:"Could not create article draft. Check for duplicate slug or database permissions."},{status:500});
  await supabase.from("content_opportunities").update({status:"draft"}).eq("id",opportunity.id);
  return NextResponse.json({draft,aiUsed:true,published:false,qualityChecked:true});
}

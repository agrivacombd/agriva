import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type LandingPage = { slug:string; title:string; meta_title:string|null; meta_description:string|null; canonical_url:string|null; noindex:boolean; hero_title:string|null; hero_description:string|null; body_markdown:string; faq:{question:string;answer:string}[]; cta_label:string|null; cta_url:string|null; status:string; published_at:string|null };
async function getPage(slug:string):Promise<LandingPage|null>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  const supabase=createClient(url,key);
  const {data,error}=await supabase.from("seo_landing_pages").select("slug,title,meta_title,meta_description,canonical_url,noindex,hero_title,hero_description,body_markdown,faq,cta_label,cta_url,status,published_at").eq("slug",slug).eq("status","published").maybeSingle();
  if(error||!data)return null;
  return data as LandingPage;
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params,page=await getPage(slug);
  if(!page)return {title:"Page not found",robots:{index:false,follow:false}};
  return {title:page.meta_title||page.title,description:page.meta_description||page.hero_description||undefined,
    alternates:{canonical:page.canonical_url||`/landing/${page.slug}`},
    robots:{index:!page.noindex,follow:!page.noindex},
    openGraph:{type:"website",siteName:"AGRIVA",title:page.meta_title||page.title,description:page.meta_description||page.hero_description||undefined,url:page.canonical_url||`/landing/${page.slug}`}};
}
function MarkdownContent({content}:{content:string}){
  return <div className="space-y-4">{content.split(/\r?\n/).map((line,index)=>{const value=line.trim();if(!value)return <div key={index}/>;if(value.startsWith("### "))return <h3 key={index} className="pt-3 text-lg font-black">{value.slice(4)}</h3>;if(value.startsWith("## "))return <h2 key={index} className="pt-4 text-2xl font-black">{value.slice(3)}</h2>;if(value.startsWith("# "))return <h2 key={index} className="pt-4 text-2xl font-black">{value.slice(2)}</h2>;if(value.startsWith("- ")||value.startsWith("* "))return <p key={index} className="pl-4 text-slate-700">• {value.slice(2)}</p>;return <p key={index} className="leading-8 text-slate-700">{value}</p>})}</div>;
}
export default async function LandingPageRoute({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params,page=await getPage(slug);if(!page)notFound();
  const site=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/$/,"");
  const canonical=page.canonical_url||`${site}/landing/${page.slug}`;
  const jsonLd={"@context":"https://schema.org","@type":"WebPage","name":page.title,"description":page.meta_description||page.hero_description||"","url":canonical,"inLanguage":"bn-BD","publisher":{"@type":"Organization","name":"AGRIVA","url":site}};
  const faqJsonLd=page.faq?.length?{"@context":"https://schema.org","@type":"FAQPage","mainEntity":page.faq.map(item=>({"@type":"Question","name":item.question,"acceptedAnswer":{"@type":"Answer","text":item.answer}}))}:null;
  return <main className="min-h-screen bg-[#f6f8f3] px-4 py-10 text-[#17351f] sm:px-6"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>{faqJsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}}/>}<article className="mx-auto max-w-4xl"><nav className="text-sm text-emerald-800"><Link href="/">হোম</Link> / <Link href="/blog">কৃষি জ্ঞান</Link> / {page.title}</nav><header className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-700 p-7 text-white sm:p-12"><h1 className="text-3xl font-black leading-tight sm:text-5xl">{page.hero_title||page.title}</h1>{page.hero_description&&<p className="mt-5 max-w-3xl leading-8 text-emerald-50">{page.hero_description}</p>}{page.cta_label&&page.cta_url&&<a href={page.cta_url} className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-emerald-900">{page.cta_label}</a>}</header><section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10"><MarkdownContent content={page.body_markdown}/></section>{page.faq?.length>0&&<section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10"><h2 className="text-2xl font-black">সাধারণ জিজ্ঞাসা</h2><div className="mt-4 space-y-4">{page.faq.map((item,i)=><div key={i} className="border-b border-slate-100 pb-4"><h3 className="font-bold">{item.question}</h3><p className="mt-2 leading-7 text-slate-700">{item.answer}</p></div>)}</div></section>}<p className="mt-6 text-xs text-slate-500">কৃষি-সংক্রান্ত সিদ্ধান্তে স্থানীয় কৃষি কর্মকর্তা ও নির্ভরযোগ্য সরকারি নির্দেশনা যাচাই করুন।</p></article></main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArticleMarkdown } from "@/lib/content/article-markdown";
import { notFound, permanentRedirect } from "next/navigation";
import { ReadingProgress, ShareArticle } from "../../articles/article-reading-tools";
import { createClient } from "@supabase/supabase-js";
import { LEGACY_BLOG_LEARN_REDIRECTS } from "@/lib/learn/blog-feed";

type CmsArticle = { title:string;slug:string;meta_title:string|null;meta_description:string|null;primary_keyword:string|null;body_markdown:string|null;hero_image_url:string|null;hero_image_alt:string|null;created_at:string;updated_at:string|null };
async function getCmsArticle(slug:string):Promise<CmsArticle|null>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  const supabase=createClient(url,key);
  const {data,error}=await supabase.from("content_drafts")
    .select("title,slug,meta_title,meta_description,primary_keyword,body_markdown,hero_image_url,hero_image_alt,created_at,updated_at")
    .eq("slug",slug).eq("status","published").eq("content_type","article").is("deleted_at",null).maybeSingle();
  return error||!data?null:data as CmsArticle;
}
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const {slug}=await params;
  const cmsArticle=await getCmsArticle(slug);
  if (cmsArticle) {const socialImage=cmsArticle.hero_image_url?.replace(/\.(?:jpe?g|png|webp)$/i,"-social.webp");return {title:cmsArticle.meta_title||cmsArticle.title,description:cmsArticle.meta_description||undefined,alternates:{canonical:`/blog/${cmsArticle.slug}`},openGraph:{type:"article",siteName:"AGRIVA",title:cmsArticle.meta_title||cmsArticle.title,description:cmsArticle.meta_description||undefined,url:`/blog/${cmsArticle.slug}`,locale:"bn_BD",...(socialImage?{images:[{url:socialImage,width:1200,height:630,alt:cmsArticle.hero_image_alt||cmsArticle.title}]}:{})},twitter:{card:"summary_large_image",title:cmsArticle.meta_title||cmsArticle.title,description:cmsArticle.meta_description||undefined,...(socialImage?{images:[socialImage]}:{})}};}
  const destination=LEGACY_BLOG_LEARN_REDIRECTS[slug];
  if(destination) return {title:"কৃষি গাইড | AGRIVA Learn",alternates:{canonical:destination},robots:{index:false,follow:true}};
  return {title:"লেখা পাওয়া যায়নি | AGRIVA",robots:{index:false,follow:false}};
}
export default async function ArticleDetailPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const cmsArticle=await getCmsArticle(slug);
  if (cmsArticle) {
    const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/+$/,"");
    const url=`${siteUrl}/blog/${cmsArticle.slug}`;
    const jsonLd={"@context":"https://schema.org","@type":"Article",headline:cmsArticle.title,description:cmsArticle.meta_description||undefined,url,mainEntityOfPage:{"@type":"WebPage","@id":url},author:{"@type":"Organization",name:"AGRIVA",url:siteUrl},publisher:{"@type":"Organization",name:"AGRIVA",url:siteUrl},datePublished:cmsArticle.created_at,dateModified:cmsArticle.updated_at||cmsArticle.created_at,...(cmsArticle.hero_image_url?{image:cmsArticle.hero_image_url}:{}),inLanguage:"bn-BD",isAccessibleForFree:true};
    const breadcrumbJsonLd={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem",position:1,name:"হোম",item:siteUrl},{"@type":"ListItem",position:2,name:"AGRIVA Blog",item:siteUrl+"/blog"},{"@type":"ListItem",position:3,name:cmsArticle.title,item:url}]};
    return <main className="min-h-screen bg-[#f6f8f3] px-4 py-8 text-[#183a27] sm:px-6 sm:py-12"><ReadingProgress/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\\\u003c")}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJsonLd).replace(/</g,"\\\\u003c")}}/><article className="mx-auto max-w-4xl"><nav aria-label="Breadcrumb" className="text-sm font-semibold text-emerald-800"><Link href="/">হোম</Link> / <Link href="/blog">Blog</Link></nav><header className="mx-auto mt-7 max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9"><h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{cmsArticle.title}</h1><p className="mt-4 text-sm text-slate-500">AGRIVA Blog · {new Date(cmsArticle.created_at).toLocaleDateString("bn-BD")}</p>{cmsArticle.meta_description&&<p className="mt-5 leading-8 text-slate-700">{cmsArticle.meta_description}</p>}</header>{cmsArticle.hero_image_url&&<figure className="mx-auto mt-6 w-full min-w-0 rounded-3xl border border-emerald-100 bg-white p-2 sm:p-4"><img src={cmsArticle.hero_image_url} alt={cmsArticle.hero_image_alt||cmsArticle.title} className="mx-auto block h-auto w-full max-w-full object-contain" loading="eager" decoding="async"/></figure>}<section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9"><ArticleMarkdown body={cmsArticle.body_markdown||""}/></section><div className="mt-7"><ShareArticle title={cmsArticle.title}/></div></article></main>;
  }
  const destination=LEGACY_BLOG_LEARN_REDIRECTS[slug];
  if(destination) permanentRedirect(destination);
  notFound();
}

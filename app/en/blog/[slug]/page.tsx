import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArticleMarkdown,parseArticleMarkdown} from "@/lib/content/article-markdown";
import {ENGLISH_BLOG_ARTICLES,getEnglishBlogArticle} from "@/lib/content/english-blog";
import {ReadingProgress} from "@/app/articles/article-reading-tools";

type Props={params:Promise<{slug:string}>};
const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/+$/,"");
export function generateStaticParams(){return ENGLISH_BLOG_ARTICLES.map(article=>({slug:article.slug}));}
export const dynamicParams=false;
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const article=getEnglishBlogArticle(slug);
  if(!article)return {title:"Article not found",robots:{index:false,follow:false}};
  const url="/en/blog/"+article.slug;
  return {
    title:article.title,description:article.description,
    alternates:{canonical:url},
    openGraph:{type:"article",url,siteName:"AGRIVA",locale:"en_US",title:article.title,description:article.description,publishedTime:article.publishedAt,modifiedTime:article.publishedAt},
    twitter:{card:"summary_large_image",title:article.title,description:article.description}
  };
}
export default async function EnglishArticlePage({params}:Props){
  const {slug}=await params;const article=getEnglishBlogArticle(slug);if(!article)notFound();
  const url=base+"/en/blog/"+article.slug;
  const blocks=parseArticleMarkdown(article.body);
  const toc=blocks.map((block,index)=>({block,index})).filter(({block})=>block.kind==="h2"||block.kind==="h3")
    .map(({block,index})=>({id:"section-"+index,title:block.lines[0],sub: block.kind==="h3"}));
  const other=ENGLISH_BLOG_ARTICLES.filter(item=>item.slug!==slug);
  const time=Math.max(1,Math.ceil(article.body.split(/\s+/).length/190));
  const articleSchema={"@context":"https://schema.org","@type":"Article","@id":url+"#article",
    mainEntityOfPage:{"@type":"WebPage","@id":url},url,headline:article.title,description:article.description,
    datePublished:article.publishedAt,dateModified:article.publishedAt,inLanguage:"en",isAccessibleForFree:true,
    author:{"@id":base+"/#organization"},publisher:{"@id":base+"/#organization"},
    isPartOf:{"@id":base+"/#website"}
  };
  const breadcrumbSchema={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
    {"@type":"ListItem",position:1,name:"Home",item:base+"/en"},
    {"@type":"ListItem",position:2,name:"English Blog",item:base+"/en/blog"},
    {"@type":"ListItem",position:3,name:article.title,item:url}
  ]};
  const encode=(v:object)=>JSON.stringify(v).replace(/</g,"\\u003c");
  return <main className="min-h-screen min-w-0 overflow-x-clip bg-[#f8faf7] text-slate-950">
    <ReadingProgress/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:encode(articleSchema)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:encode(breadcrumbSchema)}}/>
    <div className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 min-[380px]:px-4 sm:px-6 sm:pt-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-left text-xs font-bold text-emerald-800 sm:text-sm">
        <Link href="/en" className="hover:underline">Home</Link><span className="text-slate-400">/</span>
        <Link href="/en/blog" className="hover:underline">English Blog</Link><span className="text-slate-400">/</span>
        <span aria-current="page" className="max-w-[min(60vw,22rem)] truncate text-slate-500">{article.title}</span>
      </nav>
      <header className="mx-auto mt-9 min-w-0 max-w-4xl text-left sm:mt-12">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-800">{article.category} · AGRIVA JOURNAL</p>
        <h1 className="mt-4 break-words text-[clamp(1.8rem,6vw,3.65rem)] font-black leading-[1.22] tracking-tight">{article.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{article.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
          <span className="font-bold text-emerald-800">AGRIVA Editorial</span><span>·</span>
          <time dateTime={article.publishedAt}>November 19, 2026</time><span>·</span>
          <span>About {time} min read</span>
        </div>
      </header>
      <div className="mx-auto mt-8 grid max-w-6xl min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-10">
        <div className="min-w-0">
          {toc.length>0&&<details className="mb-5 rounded-2xl border border-emerald-100 bg-white p-4 lg:hidden">
            <summary className="cursor-pointer text-base font-extrabold text-emerald-900">In this article</summary>
            <nav aria-label="Article contents"><ol className="mt-3 space-y-2">{toc.map(item=><li key={item.id} className={item.sub?"pl-4":""}><a className="block py-2 text-sm leading-6 text-slate-700 hover:text-emerald-800" href={"#"+item.id}>{item.title}</a></li>)}</ol></nav>
          </details>}
          <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-7 shadow-sm sm:px-8 sm:py-10 lg:px-10">
            <ArticleMarkdown body={article.body} headingLinks locale="en"/>
          </article>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Link href="/en/blog" className="inline-flex min-h-11 items-center font-bold text-emerald-800 hover:underline">← More English guides</Link>
            <Link href="/blog" hrefLang="bn-BD" lang="bn" className="inline-flex min-h-11 items-center font-semibold text-emerald-800 hover:underline">বাংলা ব্লগ</Link>
          </div>
          <aside className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">This article is educational and does not replace local agricultural, financial or agronomic advice. Verify recommendations and prices before applying them.</aside>
        </div>
        <aside className="hidden lg:block">
          <nav aria-label="Article contents" className="sticky top-24 max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-extrabold">On this page</h2>
            <ol className="mt-4 space-y-2 border-l-2 border-emerald-100 pl-3">{toc.map(item=><li key={item.id} className={item.sub?"pl-3":""}><a href={"#"+item.id} className="block py-1 text-sm leading-6 text-slate-600 hover:text-emerald-800 hover:underline">{item.title}</a></li>)}</ol>
          </nav>
        </aside>
      </div>
      {other.length>0&&<section aria-labelledby="english-related" className="mx-auto mt-14 max-w-6xl">
        <h2 id="english-related" className="text-2xl font-black">Continue learning</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{other.map(item=><Link key={item.slug} href={"/en/blog/"+item.slug} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:shadow-md"><span className="text-xs font-bold uppercase text-emerald-800">{item.category}</span><h3 className="mt-2 text-lg font-extrabold leading-7">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></Link>)}</div>
      </section>}
    </div>
  </main>;
}

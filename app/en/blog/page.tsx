import type {Metadata} from "next";
import Link from "next/link";
import {ENGLISH_BLOG_ARTICLES} from "@/lib/content/english-blog";

const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/+$/,"");
export const metadata:Metadata={
  title:"Agriculture Blog: Crop Planning & Farm Economics",
  description:"Read practical English agriculture articles from AGRIVA on crop cost budgets, seed planning and field decisions, with sources and step-by-step examples.",
  alternates:{canonical:"/en/blog",languages:{en:"/en/blog","bn-BD":"/blog","x-default":"/blog"}},
  openGraph:{type:"website",url:"/en/blog",locale:"en_US",siteName:"AGRIVA",title:"AGRIVA English Agriculture Blog",description:"Evidence-informed farm planning, cost and seed requirement guides in English."},
  twitter:{card:"summary_large_image"}
};
export default function EnglishBlogPage(){
  const jsonLd={
    "@context":"https://schema.org","@type":"CollectionPage","@id":siteUrl+"/en/blog#webpage",
    url:siteUrl+"/en/blog",name:"AGRIVA English Agriculture Blog",
    description:"Practical English guides on crop planning, seed requirements and farm economics.",
    inLanguage:"en",isPartOf:{"@id":siteUrl+"/#website"},
    mainEntity:{"@type":"ItemList",itemListElement:ENGLISH_BLOG_ARTICLES.map((item,index)=>({
      "@type":"ListItem",position:index+1,name:item.title,url:siteUrl+"/en/blog/"+item.slug
    }))}
  };
  return <main className="min-h-screen min-w-0 bg-[#f7faf7] text-slate-900">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
    <section className="bg-gradient-to-br from-[#103c2a] via-[#165b3e] to-[#2f845b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-emerald-100"><Link href="/en" className="hover:underline">Home</Link><span className="mx-2">/</span>Blog</nav>
        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-extrabold tracking-widest text-lime-200">
          <span>AGRIVA JOURNAL</span><span aria-hidden="true">·</span><span>ENGLISH</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-6xl">Practical agriculture, explained clearly.</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-emerald-50 sm:text-lg">Explore original English guides on crop planning, seed requirements and farm economics. Each article explains assumptions, shows worked examples and points to further reading.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a href="#english-articles" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">Explore guides ↓</a>
          <Link href="/blog" hrefLang="bn-BD" lang="bn" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">বাংলা ব্লগ দেখুন</Link>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section id="english-articles" aria-labelledby="english-articles-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">READ · LEARN · PLAN</p><h2 id="english-articles-heading" className="mt-2 text-2xl font-black sm:text-3xl">English articles</h2></div>
          <span className="text-sm text-slate-500">{ENGLISH_BLOG_ARTICLES.length} published guides</span>
        </div>
        <div className="mt-7 grid min-w-0 gap-5 md:grid-cols-2">
          {ENGLISH_BLOG_ARTICLES.map(article=><article key={article.slug} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">{article.category}</p>
            <h3 className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl"><Link href={"/en/blog/"+article.slug} className="hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">{article.title}</Link></h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600 sm:text-base">{article.description}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500">Sources included · Worked examples</span>
              <Link href={"/en/blog/"+article.slug} className="inline-flex min-h-11 items-center text-sm font-extrabold text-emerald-800 hover:underline">Read the guide →</Link>
            </div>
          </article>)}
        </div>
      </section>
      <section aria-labelledby="english-tools-heading" className="mt-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-7 sm:p-8">
        <h2 id="english-tools-heading" className="text-xl font-black text-emerald-950">Take the next step with AGRIVA tools</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-900">Use your own land measurements and verified local recommendations when planning farm activities.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/en/agriculture-calculators" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Agriculture calculators</Link>
          <Link href="/en/crop-calendar" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-white">Crop calendar</Link>
          <Link href="/en/soil-fertilizer" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-white">Soil planner</Link>
        </div>
      </section>
      <p className="mt-8 max-w-4xl text-sm leading-7 text-slate-600">AGRIVA articles are educational and do not replace local agricultural extension advice. Crop performance, costs and field conditions differ by region and season. The English articles here are original guides, not automatic translations of Bengali posts.</p>
    </div>
  </main>;
}

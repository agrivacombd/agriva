import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import LessonReader from "@/components/learn/LessonReader";
import { getLesson, LESSONS } from "@/lib/learn/lessons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {slug} = await params;
  const lesson = getLesson(slug);
  if (!lesson) return { title: "গাইড পাওয়া যায়নি | AGRIVA", robots: { index: false, follow: false } };
  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/learn/${lesson.slug}` },
    robots:{index:true,follow:true,googleBot:{"max-image-preview":"large","max-snippet":-1}},
    twitter:{card:"summary_large_image",title:lesson.title+" | AGRIVA",description:lesson.summary},
    openGraph: {
      title: `${lesson.title} | AGRIVA`,
      description: lesson.summary,
      url: `/learn/${lesson.slug}`,
      type: "article",
    },
  };
}

export default async function LessonPage({ params }: Props) {
  const {slug} = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const site=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/$/,"");
  const url=site+"/learn/"+lesson.slug;
  const schema={"@context":"https://schema.org","@graph":[
    {"@type":"Article","@id":url+"#article",headline:lesson.title,description:lesson.summary,
      inLanguage:"bn-BD",isAccessibleForFree:true,mainEntityOfPage:{"@id":url+"#webpage"},
      author:{"@id":site+"/#organization"},publisher:{"@id":site+"/#organization"},
      about:[{"@type":"Thing",name:lesson.crop}],articleSection:lesson.crop},
    {"@type":"WebPage","@id":url+"#webpage",url,name:lesson.title,description:lesson.summary,
      inLanguage:"bn-BD",isPartOf:{"@id":site+"/#website"},mainEntity:{"@id":url+"#article"},
      breadcrumb:{"@id":url+"#breadcrumb"}},
    {"@type":"BreadcrumbList","@id":url+"#breadcrumb",itemListElement:[
      {"@type":"ListItem",position:1,name:"AGRIVA",item:site+"/"},
      {"@type":"ListItem",position:2,name:"কৃষি শেখার কেন্দ্র",item:site+"/learn"},
      {"@type":"ListItem",position:3,name:lesson.title,item:url}]},
  ]};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
    <nav aria-label="Breadcrumb" className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 pt-5 text-xs font-bold text-emerald-900 sm:px-6">
      <Link href="/" className="hover:underline">AGRIVA হোম</Link><span aria-hidden="true">›</span>
      <Link href="/learn" className="hover:underline">কৃষি শেখার কেন্দ্র</Link><span aria-hidden="true">›</span>
      <span aria-current="page" className="text-slate-700">{lesson.title}</span>
    </nav>
    <LessonReader lesson={lesson}/>
  </>;
}

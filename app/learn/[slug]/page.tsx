import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonReader from "@/components/learn/LessonReader";
import { getLesson, LESSONS } from "@/lib/learn/lessons";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lesson = getLesson(params.slug);
  if (!lesson) return { title: "গাইড পাওয়া যায়নি | AGRIVA", robots: { index: false, follow: false } };
  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/learn/${lesson.slug}` },
    openGraph: {
      title: `${lesson.title} | AGRIVA`,
      description: lesson.summary,
      url: `/learn/${lesson.slug}`,
      type: "article",
    },
  };
}

export default function LessonPage({ params }: Props) {
  const lesson = getLesson(params.slug);
  if (!lesson) notFound();
  return <LessonReader lesson={lesson} />;
}

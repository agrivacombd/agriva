"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Lesson } from "@/lib/learn/lessons";

const categories = ["সব বিষয়", "ধান", "সবজি", "মাটি", "রোগবালাই"] as const;
const LEARN_PROGRESS_KEY = "agriva-learn-progress-v1";
type LearnProgress = {
  completedAt?: string;
  lastQuiz?: { selected: number; correct: boolean; attemptedAt: string };
};
type LearnProgressStore = Record<string, LearnProgress>;

export default function LearnLibrary({ lessons }: { lessons: Lesson[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("সব বিষয়");
  const [progress, setProgress] = useState<LearnProgressStore>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEARN_PROGRESS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setProgress(parsed as LearnProgressStore);
        }
      }
    } catch {
      // Progress summary is optional and must not affect guide discovery.
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  const completedCount = lessons.filter((lesson) => Boolean(progress[lesson.slug]?.completedAt)).length;
  const attemptedCount = lessons.filter((lesson) => Boolean(progress[lesson.slug]?.lastQuiz)).length;
  const progressPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bn");
    return lessons.filter((lesson) => {
      const matchesCategory = category === "সব বিষয়" || lesson.crop === category;
      const searchable = [
        lesson.title,
        lesson.crop,
        lesson.summary,
        lesson.intro,
        ...lesson.steps.flatMap((step) => [step.title, step.body]),
        ...lesson.tips,
        ...lesson.audience,
        ...lesson.topics,
        ...lesson.outcomes,
        lesson.quiz.question,
        ...lesson.quiz.options,
      ].join(" ").toLocaleLowerCase("bn");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, lessons, query]);

  return (
    <section aria-labelledby="learn-library-heading" className="mt-8">
      <section aria-label="সামগ্রিক শেখার অগ্রগতি" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-black text-emerald-950">আপনার শেখার অগ্রগতি</h3><p className="mt-1 text-xs text-emerald-900">এই ব্রাউজারে সংরক্ষিত ব্যক্তিগত অগ্রগতি</p></div>
          <span className="text-sm font-black text-emerald-950" role="status" aria-live="polite">{progressLoaded ? `${completedCount}/${lessons.length}টি পাঠ সম্পন্ন` : "অগ্রগতি লোড হচ্ছে..."}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="সম্পন্ন পাঠের অগ্রগতি" aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={completedCount}>
          <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: progressLoaded ? `${progressPercent}%` : "0%" }} />
        </div>
        <p className="mt-2 text-xs text-emerald-900">{attemptedCount}টি গাইডে কুইজের উত্তর যাচাই করেছেন · তথ্য শুধু এই ব্রাউজারে থাকে, সার্ভারে পাঠানো হয় না।</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Learning library</p>
          <h2 id="learn-library-heading" className="mt-2 text-2xl font-black text-emerald-950">বিষয় অনুযায়ী শিখুন</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">ফসল, মাটি ও কৃষি ব্যবস্থাপনা নিয়ে প্রয়োজনীয় গাইড খুঁজে নিন।</p>
        </div>
        <p className="text-sm font-semibold text-slate-500" role="status" aria-live="polite" aria-atomic="true">{filteredLessons.length}টি গাইড</p>
      </div>

      <label htmlFor="learn-guide-search" className="sr-only">কৃষি গাইড খুঁজুন</label>
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <span aria-hidden="true" className="text-lg text-emerald-800">⌕</span>
        <input
          id="learn-guide-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="গাইড, ফসল বা বিষয় লিখে খুঁজুন..."
          className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="অনুসন্ধানের লেখা মুছুন" className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50">মুছুন</button>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="বিষয় অনুযায়ী ফিল্টার">
        {categories.map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(item)}
              className={active
                ? "rounded-full border border-emerald-800 bg-emerald-800 px-4 py-2 text-sm font-bold text-white"
                : "rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-500"}
            >
              {item}
            </button>
          );
        })}
      </div>

      {filteredLessons.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {filteredLessons.map((lesson) => {
            const lessonProgress = progress[lesson.slug];
            return (
            <article key={lesson.slug} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl" aria-hidden="true">
                  {lesson.crop === "ধান" ? "🌾" : lesson.crop === "সবজি" ? "🥬" : lesson.crop === "মাটি" ? "🌱" : "🐛"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{lesson.duration} · {lesson.level}</span>
              </div>
              <p className="mt-5 text-xs font-bold text-emerald-800">{lesson.crop}</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">{lesson.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{lesson.summary}</p>
              <p className="mt-3 flex-1 text-xs leading-6 text-slate-500"><span className="font-bold text-slate-700">শিখবেন:</span> {lesson.outcomes[0]}</p>
              <p className="mt-2 text-xs leading-5 text-emerald-800">{lesson.topics.slice(0, 3).join(" · ")}</p>
              {(lessonProgress?.completedAt || lessonProgress?.lastQuiz) && <p className="mt-3 text-xs font-bold text-emerald-900">{lessonProgress.completedAt ? "✓ পাঠ সম্পন্ন" : "কুইজ দেওয়া হয়েছে"}{lessonProgress.lastQuiz ? ` · ${lessonProgress.lastQuiz?.correct ? "সঠিক উত্তর" : "আরও অনুশীলন প্রয়োজন"}` : ""}</p>}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">{lesson.steps.length}টি ধাপ · কুইজ</span>
                <Link href={`/learn/${lesson.slug}`} className="text-sm font-extrabold text-emerald-800 hover:underline">গাইড পড়ুন →</Link>
              </div>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <p className="font-bold text-slate-800">এই অনুসন্ধানে কোনো গাইড পাওয়া যায়নি</p>
          <p className="mt-2 text-sm text-slate-500">অন্য শব্দ দিয়ে খুঁজুন অথবা বিষয় ফিল্টার পরিবর্তন করুন।</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("সব বিষয়"); }} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">সব গাইড দেখুন</button>
        </div>
      )}
    </section>
  );
}

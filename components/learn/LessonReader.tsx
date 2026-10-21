"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/learn/lessons";

export default function LessonReader({ lesson }: { lesson: Lesson }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <main className="min-h-screen bg-[#f6faf7] px-4 py-8 sm:px-6 sm:py-12"><article className="mx-auto max-w-4xl">
    <a href="/learn" className="text-sm font-bold text-emerald-800 hover:underline">← সব কৃষি গাইড</a>
    <header className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-700 p-6 text-white sm:p-10"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{lesson.crop} · {lesson.duration} পাঠ</span><h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{lesson.title}</h1><p className="mt-4 leading-7 text-emerald-50">{lesson.summary}</p></header>
    <p className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 text-sm leading-7 text-slate-700">{lesson.intro}</p>
    <section className="mt-8 space-y-4"><h2 className="text-2xl font-black">ধাপে ধাপে শিখুন</h2>{lesson.steps.map((step, index) => <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 font-black text-emerald-900">{index + 1}</span><div><h3 className="font-extrabold">{step.title.replace(/^\d+\.\s*/, "")}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.body}</p></div></div></div>)}</section>
    <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-7"><h2 className="text-xl font-black text-amber-950">মনে রাখবেন</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-950">{lesson.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>
    <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-5 sm:p-8"><span className="text-xs font-black uppercase tracking-wide text-emerald-800">নিজেকে যাচাই করুন</span><h2 className="mt-2 text-xl font-black">{lesson.quiz.question}</h2><div className="mt-4 space-y-3">{lesson.quiz.options.map((option, index) => <label key={option} className={"flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm " + (selected === index ? "border-emerald-500 bg-emerald-50" : "border-slate-200")}><input type="radio" name="lesson-quiz" checked={selected === index} onChange={() => {setSelected(index); setChecked(false);}} className="mt-0.5 accent-emerald-700" /><span>{option}</span></label>)}</div><button onClick={() => setChecked(true)} disabled={selected === null} className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">উত্তর যাচাই করুন</button>{checked && selected !== null && <div className={"mt-4 rounded-xl p-4 text-sm leading-6 " + (selected === lesson.quiz.answer ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950")}><strong>{selected === lesson.quiz.answer ? "সঠিক উত্তর! 🎉" : "আবার চেষ্টা করুন।"}</strong><p className="mt-1">{lesson.quiz.explanation}</p></div>}</section>
    <div className="mt-8 rounded-2xl bg-slate-100 p-5 text-xs leading-6 text-slate-600">এই পেজটি সাধারণ শিক্ষামূলক তথ্যের জন্য। জমি, জাত, মৌসুম ও স্থানীয় অবস্থার ভিত্তিতে নিয়ম বদলাতে পারে। সার/কীটনাশকের নির্দিষ্ট মাত্রা বা রোগের চিকিৎসা প্রয়োগের আগে কৃষি কর্মকর্তা বা সরকারি নির্দেশনা যাচাই করুন।</div>
    <a href="/tools" className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white">কৃষি টুলবক্সে ফিরে যান →</a>
  </article></main>;
}

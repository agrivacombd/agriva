"use client";

import { useMemo, useState } from "react";

type CVData = {
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
  education: string;
  experience: string;
  skills: string;
  languages: string;
  certifications: string;
  photoUrl: string;
};

type Props = { cv: CVData; language: "en" | "bn" };

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "for", "from", "has", "have", "into",
  "job", "our", "the", "their", "this", "that", "then", "they", "with", "will",
  "you", "your", "work", "working", "years", "year", "must", "should", "able",
  "একটি", "এবং", "কাজ", "জন্য", "হবে", "অভিজ্ঞতা", "প্রার্থী", "দক্ষতা", "তথ্য",
]);

function terms(value: string) {
  return Array.from(new Set(
    value.toLowerCase()
      .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
      .split(/[\s-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
  ));
}

export default function CVInsights({ cv, language }: Props) {
  const [jobDescription, setJobDescription] = useState("");
  const isBn = language === "bn";

  const checks = useMemo(() => {
    const items = [
      { key: "name", ok: cv.fullName.trim().length >= 2, bn: "পূর্ণ নাম যোগ করা হয়েছে", en: "Full name is included", fixBn: "আপনার পূর্ণ নাম যোগ করুন", fixEn: "Add your full name" },
      { key: "contact", ok: Boolean(cv.email.trim() || cv.phone.trim()), bn: "যোগাযোগের তথ্য আছে", en: "Contact information is included", fixBn: "ফোন বা ইমেইল যোগ করুন", fixEn: "Add a phone number or email" },
      { key: "headline", ok: cv.headline.trim().length >= 3, bn: "পেশাগত পরিচিতি আছে", en: "Professional headline is included", fixBn: "যেমন: কৃষি কর্মকর্তা / Farm Supervisor", fixEn: "Add a role-focused headline, e.g. Farm Supervisor" },
      { key: "summary", ok: cv.summary.trim().length >= 40, bn: "সংক্ষিপ্ত পেশাগত সারাংশ আছে", en: "Professional summary has useful detail", fixBn: "২–৪ বাক্যে অভিজ্ঞতা ও লক্ষ্য লিখুন", fixEn: "Write 2–4 sentences about your experience and goals" },
      { key: "experience", ok: cv.experience.trim().length >= 20, bn: "কাজের অভিজ্ঞতা বা প্রাসঙ্গিক কাজ আছে", en: "Experience or relevant work is included", fixBn: "চাকরি, ইন্টার্নশিপ, খামার বা মাঠপর্যায়ের কাজ লিখুন", fixEn: "Add jobs, internships, farm work, or field experience" },
      { key: "education", ok: cv.education.trim().length >= 10, bn: "শিক্ষাগত যোগ্যতা আছে", en: "Education is included", fixBn: "প্রতিষ্ঠান, ডিগ্রি ও সাল যোগ করুন", fixEn: "Add institution, qualification, and year" },
      { key: "skills", ok: terms(cv.skills).length >= 3, bn: "কমপক্ষে ৩টি দক্ষতা আছে", en: "At least three skills are listed", fixBn: "প্রাসঙ্গিক দক্ষতা নির্দিষ্টভাবে লিখুন", fixEn: "List specific, relevant skills" },
      { key: "readable", ok: [cv.summary, cv.education, cv.experience, cv.skills].some((v) => v.includes("\n")), bn: "তথ্য পড়তে সুবিধাজনকভাবে সাজানো", en: "Some sections use readable line breaks", fixBn: "দীর্ঘ অনুচ্ছেদের বদলে আলাদা লাইনে তথ্য সাজান", fixEn: "Use separate lines instead of one long paragraph" },
    ];
    const completed = items.filter((item) => item.ok).length;
    return { items, completed, score: Math.round((completed / items.length) * 100) };
  }, [cv]);

  const match = useMemo(() => {
    const required = terms(jobDescription).filter((word) => word.length >= 3);
    const profile = terms([cv.headline, cv.summary, cv.experience, cv.education, cv.skills, cv.certifications].join(" "));
    const found = required.filter((word) => profile.includes(word));
    const missing = required.filter((word) => !profile.includes(word));
    return { total: required.length, found, missing: missing.slice(0, 12), score: required.length ? Math.round((found.length / required.length) * 100) : 0 };
  }, [cv, jobDescription]);

  const scoreText = isBn ? "CV প্রস্তুতির স্কোর" : "CV readiness score";
  return (
    <section className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="cv-insights-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">{isBn ? "স্মার্ট CV চেক" : "SMART CV CHECK"}</p>
          <h2 id="cv-insights-title" className="mt-2 text-xl font-black">{isBn ? "CV Score ও চাকরির সঙ্গে মিল" : "CV score & job match"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{isBn ? "আপনার তথ্যের ভিত্তিতে তাৎক্ষণিক চেকলিস্ট—কোনো বাইরের AI service ব্যবহার করা হয় না।" : "Instant feedback from your CV content. No external AI service is used."}</p>
        </div>
        <div className="min-w-24 rounded-xl bg-emerald-50 px-4 py-3 text-center">
          <p className="text-2xl font-black text-emerald-900">{checks.score}%</p>
          <p className="text-xs font-bold text-emerald-800">{scoreText}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={scoreText} aria-valuenow={checks.score} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: checks.score + "%" }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{isBn ? `${checks.completed} / ${checks.items.length}টি চেক সম্পন্ন` : `${checks.completed} of ${checks.items.length} checks completed`}</p>

      <ul className="mt-4 space-y-2">
        {checks.items.map((item) => (
          <li key={item.key} className="flex items-start gap-2 text-sm leading-5">
            <span aria-hidden="true" className={item.ok ? "mt-0.5 font-black text-emerald-700" : "mt-0.5 font-black text-amber-600"}>{item.ok ? "✓" : "○"}</span>
            <span className={item.ok ? "text-slate-700" : "text-slate-600"}>{isBn ? item.bn : item.en}{!item.ok && <span className="block text-xs text-slate-500">{isBn ? item.fixBn : item.fixEn}</span>}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="font-extrabold">{isBn ? "চাকরির বিবরণের সঙ্গে CV মিলিয়ে দেখুন" : "Match your CV to a job description"}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{isBn ? "চাকরির বিজ্ঞপ্তির দায়িত্ব ও যোগ্যতার অংশ এখানে পেস্ট করুন। আপনার CV-তে পাওয়া ও না-পাওয়া শব্দগুলো দেখুন।" : "Paste the responsibilities and requirements from a job post to see terms found or missing in your CV."}</p>
        <label className="mt-3 block text-sm font-bold" htmlFor="job-description-match">{isBn ? "চাকরির বিবরণ" : "Job description"}</label>
        <textarea id="job-description-match" value={jobDescription} onChange={(e) => setJobDescription(e.target.value.slice(0, 10000))} rows={4} maxLength={10000} placeholder={isBn ? "যেমন: কৃষি, ফসল ব্যবস্থাপনা, মাঠপর্যায়ের অভিজ্ঞতা..." : "e.g. crop management, field experience, data collection..."} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
        {jobDescription.trim() && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">{isBn ? "আনুমানিক keyword মিল" : "Approximate keyword overlap"}</span>
              <span className="text-lg font-black text-emerald-800">{match.score}%</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{isBn ? "এটি সাধারণ শব্দের মিল, যোগ্যতা বা চাকরির উপযুক্ততার মূল্যায়ন নয়।" : "This is a simple word overlap, not an assessment of qualifications or job suitability."}</p>
            {match.found.length > 0 && <div className="mt-3"><p className="text-xs font-extrabold text-emerald-800">{isBn ? "CV-তে পাওয়া গেছে" : "Found in your CV"}</p><div className="mt-2 flex flex-wrap gap-2">{match.found.slice(0, 12).map((word) => <span key={word} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">{word}</span>)}</div></div>}
            {match.missing.length > 0 && <div className="mt-3"><p className="text-xs font-extrabold text-amber-800">{isBn ? "যাচাই করুন—CV-তে পাওয়া যায়নি" : "Review these missing terms"}</p><div className="mt-2 flex flex-wrap gap-2">{match.missing.map((word) => <span key={word} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">{word}</span>)}</div><p className="mt-2 text-xs leading-5 text-slate-500">{isBn ? "শুধু সত্যিই আপনার অভিজ্ঞতা বা দক্ষতার সঙ্গে মিললে CV-তে যোগ করুন।" : "Add a term only when it genuinely reflects your experience or skills."}</p></div>}
            {match.total === 0 && <p className="mt-3 text-sm text-slate-600">{isBn ? "পর্যাপ্ত keyword পাওয়া যায়নি—আরও বিস্তারিত বিবরণ দিন।" : "Not enough meaningful keywords found. Try a more detailed description."}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

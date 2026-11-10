import type { Metadata } from "next";
import WeatherPanel from "@/components/weather/WeatherPanel";

export const metadata: Metadata = {
  title: "কৃষি আবহাওয়া | AGRIVA",
  description: "বাংলাদেশের এলাকার বর্তমান আবহাওয়া, বৃষ্টি, তাপমাত্রা ও ৫ দিনের পূর্বাভাস দেখে কৃষিকাজের পরিকল্পনা করুন.",
  alternates: { canonical: "/weather" },
};

export default function WeatherPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#17351f]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-7">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">কৃষি আবহাওয়া ও ৫ দিনের পূর্বাভাস</h1>
          <p className="mt-3 max-w-3xl leading-7 text-[#647468]">নিজের এলাকার আবহাওয়া দেখে সেচ, জমির কাজ ও ফসল সংগ্রহের পরিকল্পনা সাজান। পূর্বাভাস পরিবর্তিত হতে পারে, তাই মাঠের অবস্থা ও স্থানীয় সতর্কতা মিলিয়ে সিদ্ধান্ত নিন।</p>
        </header>
        <WeatherPanel />
        <article className="prose prose-green mt-10 max-w-none">
          <h2>কৃষিকাজে কোন আবহাওয়ার তথ্য কাজে লাগে?</h2>
          <p>বৃষ্টির সম্ভাবনা ও পরিমাণ সেচের সময় ঠিক করতে সাহায্য করে। তাপমাত্রা ও আর্দ্রতা ফসলের বৃদ্ধি এবং রোগের অনুকূল পরিবেশ বোঝার প্রাথমিক ধারণা দেয়। বাতাসের গতি মাঠের কাজ ও স্প্রে করার উপযুক্ত সময় বিবেচনায় গুরুত্বপূর্ণ হতে পারে।</p>
          <h2>পূর্বাভাস দেখে কীভাবে পরিকল্পনা করবেন</h2>
          <ul>
            <li>বৃষ্টির পূর্বাভাস থাকলে জমির আর্দ্রতা যাচাই করে সেচের প্রয়োজন পুনর্বিবেচনা করুন।</li>
            <li>ঝড় বা ভারী বৃষ্টির আশঙ্কায় ফসল, সেচযন্ত্র ও সংরক্ষিত উপকরণ নিরাপদ রাখার প্রস্তুতি নিন।</li>
            <li>স্প্রে বা অন্যান্য সংবেদনশীল কাজের আগে পণ্যের লেবেল এবং স্থানীয় আবহাওয়া নির্দেশনা মানুন।</li>
          </ul>
          <h2>তথ্যের সীমাবদ্ধতা</h2>
          <p>আবহাওয়ার পূর্বাভাস একটি অনুমান, নিশ্চয়তা নয়। স্থানীয় বৃষ্টি, জমির পানি, মাটির ধরন এবং সরকারি আবহাওয়া সতর্কতা বিবেচনা করে চূড়ান্ত সিদ্ধান্ত নিন।</p>
        </article>
      </section>
    </main>
  );
}

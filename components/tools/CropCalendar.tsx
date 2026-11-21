"use client";

import { useMemo, useState } from "react";

type Crop = {
  id: string;
  name: string;
  planting: string;
  maturity: string;
  harvest: string;
  note: string;
  source: string;
};

const crops: Crop[] = [
  {
    id: "aus",
    name: "আউশ ধান",
    planting: "মার্চের মাঝামাঝি–এপ্রিলের মাঝামাঝি",
    maturity: "জাত ও বপন/রোপণ পদ্ধতি অনুযায়ী",
    harvest: "জুলাইয়ের মাঝামাঝি–আগস্টের শুরু",
    note: "BBS-এর জাতীয় ক্যালেন্ডারে স্থানীয় বোনা ও উচ্চফলনশীল রোপা আউশের জন্য আলাদা বীজ/পদ্ধতির তথ্য আছে। জমির পানি, জাত ও স্থানীয় আবহাওয়ার সঙ্গে সময় মিলিয়ে নিন।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "aman-transplant",
    name: "আমন ধান (রোপা)",
    planting: "জুনের শেষ–সেপ্টেম্বরের শুরু (স্থানীয়); জুনের শেষ–আগস্টের মাঝামাঝি (উচ্চফলনশীল)",
    maturity: "জাত, চারা বয়স ও রোপণের সময় অনুযায়ী",
    harvest: "ডিসেম্বর–জানুয়ারির শুরু",
    note: "রোপা আমনের সময় স্থানীয় ও উচ্চফলনশীল জাতের জন্য BBS-এ আলাদা সীমা দেওয়া আছে। এলাকার বৃষ্টিপাত, জমির উচ্চতা ও পানি ব্যবস্থাপনা বিবেচনা করুন।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "aman-broadcast",
    name: "আমন ধান (বোনা)",
    planting: "মার্চের মাঝামাঝি–এপ্রিলের মাঝামাঝি",
    maturity: "স্থানীয় বোনা আমনের ব্যবস্থাপনা অনুযায়ী",
    harvest: "নভেম্বরের মাঝামাঝি–ডিসেম্বরের মাঝামাঝি",
    note: "বোনা আমন ও রোপা আমনের সময় এক নয়। এই সময়সীমাটি BBS-এর স্থানীয় বোনা আমনের জাতীয় ভিত্তির তথ্য; রোপা আমনের ক্ষেত্রে এটি ব্যবহার করবেন না।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "boro",
    name: "বোরো ধান",
    planting: "নভেম্বরের মাঝামাঝি–জানুয়ারির মাঝামাঝি (স্থানীয়); ডিসেম্বর–ফেব্রুয়ারির মাঝামাঝি (উচ্চফলনশীল/হাইব্রিড)",
    maturity: "জাত, সেচ ও রোপণের সময় অনুযায়ী",
    harvest: "এপ্রিল–মে (স্থানীয়); এপ্রিলের মাঝামাঝি–জুন (উচ্চফলনশীল/হাইব্রিড)",
    note: "বোরো ধান সেচনির্ভর মৌসুমের ফসল। BBS-এর স্থানীয়, উচ্চফলনশীল ও হাইব্রিড বোরোর সময়সীমা আলাদা; স্থানীয় BAMIS/DAE পরামর্শ মিলিয়ে নিন।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "wheat",
    name: "গম",
    planting: "নভেম্বর–ডিসেম্বর",
    maturity: "জাত ও আবহাওয়ার ওপর নির্ভরশীল",
    harvest: "মার্চ–এপ্রিলের মাঝামাঝি",
    note: "বপনের সময় ও পরিপক্বতা জাত, তাপমাত্রা এবং জমির অবস্থার সঙ্গে বদলায়। দেরিতে বপনের ঝুঁকি সম্পর্কে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "maize-rabi",
    name: "ভুট্টা (রবি)",
    planting: "অক্টোবরের মাঝামাঝি–ডিসেম্বরের শেষ",
    maturity: "হাইব্রিড ও ব্যবস্থাপনা অনুযায়ী",
    harvest: "এপ্রিলের শুরু–মে মাসের শেষ",
    note: "এটি BBS-এ উল্লিখিত রবি ভুট্টার জাতীয় সময়সীমা। খরিফ-১ ভুট্টার জন্য এই সময়সীমা প্রযোজ্য নয়।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
  {
    id: "potato",
    name: "আলু",
    planting: "সেপ্টেম্বরের মাঝামাঝি–নভেম্বর",
    maturity: "জাত, তাপমাত্রা ও রোগচাপ অনুযায়ী",
    harvest: "জানুয়ারির মাঝামাঝি–মার্চ",
    note: "আলুর রোপণ ও সংগ্রহের সময় অঞ্চল, তাপমাত্রা এবং জাতের সঙ্গে পরিবর্তিত হয়। রোগমুক্ত বীজ আলু ও স্থানীয় রোগ সতর্কতা অনুসরণ করুন।",
    source: "BBS Yearbook of Agricultural Statistics 2022, পৃষ্ঠা ২৪",
  },
];

export default function CropCalendar() {
  const [selected, setSelected] = useState("aus");
  const crop = useMemo(() => crops.find((item) => item.id === selected) ?? crops[0], [selected]);

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:mt-8 sm:rounded-3xl sm:p-6">
      <div className="flex flex-wrap gap-2" aria-label="ফসল নির্বাচন">
        {crops.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item.id)}
            aria-pressed={item.id === selected}
            className={`max-w-full break-words rounded-full px-3 py-2 text-xs font-bold leading-5 transition sm:px-4 sm:text-sm ${item.id === selected ? "bg-[#17351f] text-white" : "bg-[#eef5ed] text-[#17351f]"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="mt-5 grid min-w-0 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:mt-8 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl bg-[#f5f7f2] p-4 sm:p-5">
          <p className="text-sm text-[#647468]">বপন / রোপণের সময়</p>
          <p className="mt-2 break-words text-base font-black leading-7 sm:text-lg">{crop.planting}</p>
        </div>
        <div className="rounded-2xl bg-[#f5f7f2] p-5">
          <p className="text-sm text-[#647468]">বৃদ্ধি ও পরিপক্বতা</p>
          <p className="mt-2 text-lg font-black leading-7">{crop.maturity}</p>
        </div>
        <div className="rounded-2xl bg-[#f5f7f2] p-5">
          <p className="text-sm text-[#647468]">ফসল সংগ্রহের সময়</p>
          <p className="mt-2 text-lg font-black leading-7">{crop.harvest}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-[#dfe8dd] p-4 sm:mt-5 sm:p-5">
        <p className="font-bold">চাষ পরিকল্পনার পরামর্শ</p>
        <p className="mt-2 break-words text-sm leading-6 text-[#647468]">{crop.note}</p>
        <p className="mt-3 break-words text-xs leading-5 font-semibold text-[#647468]">তথ্যভিত্তি: {crop.source}</p>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#647468]">
        এটি BBS-এর জাতীয় পর্যায়ের পরিকল্পনা-ভিত্তি; নির্দিষ্ট জেলা বা উপজেলার জন্য চূড়ান্ত কৃষি পরামর্শ নয়।
        স্থানীয় সময় যাচাই করতে BAMIS-এর জেলা-ভিত্তিক ফসল আবহাওয়া পঞ্জিকা দেখুন।
      </p>
    </section>
  );
}

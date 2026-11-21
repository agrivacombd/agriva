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

const divisions = [
  { id: "barishal", name: "বরিশাল" },
  { id: "chattogram", name: "চট্টগ্রাম" },
  { id: "dhaka", name: "ঢাকা" },
  { id: "khulna", name: "খুলনা" },
  { id: "mymensingh", name: "ময়মনসিংহ" },
  { id: "rajshahi", name: "রাজশাহী" },
  { id: "rangpur", name: "রংপুর" },
  { id: "sylhet", name: "সিলেট" },
] as const;

const districts = [
  { name: "বরগুনা", division: "barishal" },
  { name: "বরিশাল", division: "barishal" },
  { name: "ভোলা", division: "barishal" },
  { name: "ঝালকাঠি", division: "barishal" },
  { name: "পটুয়াখালী", division: "barishal" },
  { name: "পিরোজপুর", division: "barishal" },
  { name: "বান্দরবান", division: "chattogram" },
  { name: "ব্রাহ্মণবাড়িয়া", division: "chattogram" },
  { name: "চাঁদপুর", division: "chattogram" },
  { name: "চট্টগ্রাম", division: "chattogram" },
  { name: "কক্সবাজার", division: "chattogram" },
  { name: "কুমিল্লা", division: "chattogram" },
  { name: "ফেনী", division: "chattogram" },
  { name: "খাগড়াছড়ি", division: "chattogram" },
  { name: "লক্ষ্মীপুর", division: "chattogram" },
  { name: "নোয়াখালী", division: "chattogram" },
  { name: "রাঙামাটি", division: "chattogram" },
  { name: "ঢাকা", division: "dhaka" },
  { name: "ফরিদপুর", division: "dhaka" },
  { name: "গাজীপুর", division: "dhaka" },
  { name: "গোপালগঞ্জ", division: "dhaka" },
  { name: "কিশোরগঞ্জ", division: "dhaka" },
  { name: "মাদারীপুর", division: "dhaka" },
  { name: "মানিকগঞ্জ", division: "dhaka" },
  { name: "মুন্সিগঞ্জ", division: "dhaka" },
  { name: "নারায়ণগঞ্জ", division: "dhaka" },
  { name: "নরসিংদী", division: "dhaka" },
  { name: "রাজবাড়ী", division: "dhaka" },
  { name: "শরীয়তপুর", division: "dhaka" },
  { name: "টাঙ্গাইল", division: "dhaka" },
  { name: "বাগেরহাট", division: "khulna" },
  { name: "চুয়াডাঙ্গা", division: "khulna" },
  { name: "যশোর", division: "khulna" },
  { name: "ঝিনাইদহ", division: "khulna" },
  { name: "খুলনা", division: "khulna" },
  { name: "কুষ্টিয়া", division: "khulna" },
  { name: "মাগুরা", division: "khulna" },
  { name: "মেহেরপুর", division: "khulna" },
  { name: "নড়াইল", division: "khulna" },
  { name: "সাতক্ষীরা", division: "khulna" },
  { name: "জামালপুর", division: "mymensingh" },
  { name: "ময়মনসিংহ", division: "mymensingh" },
  { name: "নেত্রকোনা", division: "mymensingh" },
  { name: "শেরপুর", division: "mymensingh" },
  { name: "বগুড়া", division: "rajshahi" },
  { name: "জয়পুরহাট", division: "rajshahi" },
  { name: "নওগাঁ", division: "rajshahi" },
  { name: "নাটোর", division: "rajshahi" },
  { name: "চাঁপাইনবাবগঞ্জ", division: "rajshahi" },
  { name: "পাবনা", division: "rajshahi" },
  { name: "রাজশাহী", division: "rajshahi" },
  { name: "সিরাজগঞ্জ", division: "rajshahi" },
  { name: "দিনাজপুর", division: "rangpur" },
  { name: "গাইবান্ধা", division: "rangpur" },
  { name: "কুড়িগ্রাম", division: "rangpur" },
  { name: "লালমনিরহাট", division: "rangpur" },
  { name: "নীলফামারী", division: "rangpur" },
  { name: "পঞ্চগড়", division: "rangpur" },
  { name: "রংপুর", division: "rangpur" },
  { name: "ঠাকুরগাঁও", division: "rangpur" },
  { name: "হবিগঞ্জ", division: "sylhet" },
  { name: "মৌলভীবাজার", division: "sylhet" },
  { name: "সুনামগঞ্জ", division: "sylhet" },
  { name: "সিলেট", division: "sylhet" },
] as const;

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
  const [selectedDivision, setSelectedDivision] = useState("rangpur");
  const [selectedDistrict, setSelectedDistrict] = useState("দিনাজপুর");
  const crop = useMemo(() => crops.find((item) => item.id === selected) ?? crops[0], [selected]);
  const availableDistricts = useMemo(
    () => districts.filter((district) => district.division === selectedDivision),
    [selectedDivision],
  );
  const divisionName = divisions.find((division) => division.id === selectedDivision)?.name ?? "";

  function changeDivision(value: string) {
    setSelectedDivision(value);
    const firstDistrict = districts.find((district) => district.division === value);
    if (firstDistrict) setSelectedDistrict(firstDistrict.name);
  }

  return (
    <section className="mt-6 space-y-5 sm:mt-8">
      <div className="rounded-2xl border border-[#dce8dc] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#b58b28]">স্থানীয় কৃষি তথ্য</p>
          <h2 className="mt-2 text-xl font-black text-[#17351f] sm:text-2xl">আপনার জেলা নির্বাচন করুন</h2>
          <p className="mt-2 text-sm leading-6 text-[#647468]">
            জেলা নির্বাচন করে সরকারি BAMIS ও BARC পোর্টালে ওই এলাকার ফসলের আবহাওয়া পঞ্জিকা ও ফসল উপযোগিতা যাচাই করুন।
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#244b31]">
            বিভাগ
            <select
              value={selectedDivision}
              onChange={(event) => changeDivision(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d8e3d6] bg-white px-4 py-3 text-base text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>{division.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-[#244b31]">
            জেলা
            <select
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d8e3d6] bg-white px-4 py-3 text-base text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              {availableDistricts.map((district) => (
                <option key={district.name} value={district.name}>{district.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 rounded-xl bg-[#f3f7f1] p-4">
          <p className="text-sm font-bold text-[#17351f]">নির্বাচিত এলাকা: {selectedDistrict}, {divisionName} বিভাগ</p>
          <p className="mt-1 text-xs leading-5 text-[#647468]">
            সরকারি পোর্টালে একই জেলা আবার নির্বাচন করে সর্বশেষ স্থানীয় তথ্য দেখুন। AGRIVA-এর নিচের তারিখগুলো এখনো জাতীয় BBS সময়সীমা—জেলা-নির্দিষ্ট তারিখ হিসেবে দেখানো হচ্ছে না।
          </p>
        </div>
        <div className="mt-5 rounded-2xl border border-[#dce8dc] bg-[#f8fbf7] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-[#b58b28]">জেলা-ভিত্তিক তথ্য কেন্দ্র</p>
              <h3 className="mt-1 text-lg font-black text-[#17351f]">{selectedDistrict} জেলার কৃষি তথ্য</h3>
              <p className="mt-1 text-xs leading-5 text-[#647468]">নিচের সরকারি উৎসগুলোতে {selectedDistrict} নির্বাচন করে স্থানীয় ফসল, আবহাওয়া ও জমির উপযোগিতা যাচাই করুন।</p>
            </div>
            <span className="rounded-full bg-[#e8f1e5] px-3 py-1 text-xs font-bold text-[#245334]">জেলা নির্বাচিত</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="https://www.bamis.gov.bd/page/district-wise-major-crops/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#dce8dc] bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50">
              <span className="block text-sm font-black text-[#17351f]">১. জেলার প্রধান ফসল ↗</span>
              <span className="mt-1 block text-xs leading-5 text-[#647468]">BAMIS-এর জেলা-ভিত্তিক প্রধান ফসলের তথ্য দেখুন।</span>
            </a>
            <a href="https://www.bamis.gov.bd/bulletin/district/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#dce8dc] bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50">
              <span className="block text-sm font-black text-[#17351f]">২. জেলা কৃষি আবহাওয়া বুলেটিন ↗</span>
              <span className="mt-1 block text-xs leading-5 text-[#647468]">সর্বশেষ জেলা-ভিত্তিক আবহাওয়া সতর্কতা ও কৃষি পরামর্শ যাচাই করুন।</span>
            </a>
            <a href="https://portal.cropzoning.gov.bd/cropSuitability" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#dce8dc] bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50">
              <span className="block text-sm font-black text-[#17351f]">৩. ফসল ও জমির উপযোগিতা ↗</span>
              <span className="mt-1 block text-xs leading-5 text-[#647468]">BARC পোর্টালে জেলা ও উপজেলা বেছে মৌসুমভিত্তিক ফসলের উপযোগিতা দেখুন।</span>
            </a>
            <a href="https://www.bamis.gov.bd/page/aezs-maps/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#dce8dc] bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50">
              <span className="block text-sm font-black text-[#17351f]">৪. কৃষি-পরিবেশ অঞ্চল (AEZ) ↗</span>
              <span className="mt-1 block text-xs leading-5 text-[#647468]">মাটির ধরন, ভূমির উচ্চতা, পানি ও ফসল বিন্যাসের অঞ্চলভিত্তিক বৈশিষ্ট্য বুঝুন।</span>
            </a>
            <a href="https://www.bamis.gov.bd/en/calendar" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#dce8dc] bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50 sm:col-span-2">
              <span className="block text-sm font-black text-[#17351f]">৫. ফসলভিত্তিক আবহাওয়া পঞ্জিকা ↗</span>
              <span className="mt-1 block text-xs leading-5 text-[#647468]">BAMIS-এ ফসল নির্বাচন করে সংশ্লিষ্ট আবহাওয়া-সংবেদনশীলতা ও ক্যালেন্ডার দেখুন।</span>
            </a>
          </div>
          <p className="mt-3 rounded-lg bg-[#fff8e8] p-3 text-xs leading-5 text-[#705a2a]">
            গুরুত্বপূর্ণ: AGRIVA এখন নির্বাচিত জেলার নাম ধরে সরকারি তথ্যসূত্রগুলো সাজিয়ে দিচ্ছে; সরকারি পোর্টালের ভেতরে জেলা/উপজেলা স্বয়ংক্রিয়ভাবে নির্বাচন করে না। তাই লিংক খোলার পর {selectedDistrict} জেলা নিজে নির্বাচন করুন। যাচাই করা জেলা-নির্দিষ্ট তারিখ না পাওয়া পর্যন্ত নিচের ক্যালেন্ডার জাতীয় BBS ভিত্তি হিসেবেই দেখানো হবে।
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#b58b28]">জাতীয় ফসল ক্যালেন্ডার</p>
          <h2 className="mt-2 text-xl font-black text-[#17351f] sm:text-2xl">প্রধান ফসলের বপন ও সংগ্রহের সময়</h2>
          <p className="mt-2 text-sm leading-6 text-[#647468]">নিচের সময়সীমা BBS-এর জাতীয় ভিত্তির তথ্য। স্থানীয় তারিখের জন্য উপরের সরকারি জেলা-ভিত্তিক উৎস যাচাই করুন।</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="ফসল নির্বাচন">
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
          জাতীয় সময়সীমা দিয়ে প্রাথমিক পরিকল্পনা করুন; বপন বা রোপণের চূড়ান্ত তারিখ স্থানীয় আবহাওয়া, জমির ধরন, জাত এবং কৃষি কর্মকর্তার পরামর্শ অনুযায়ী ঠিক করুন।
        </p>
      </div>
    </section>
  );
}

/**
 * Reviewed seed-variety names from PUBLIC supplier listings (snapshot 2026-11-18).
 *
 * This reference catalog is for AGRIVA RFQ auto-completion ONLY.
 * It is not a live feed: availability, seller affiliation, pack sizes and prices
 * MUST be confirmed directly with the respective merchant when sourcing.
 *
 * East Bengal Seed Co. (Siddique Bazar):
 *   https://eastbengalseed.com/categories/
 *   https://krishimela.com.bd/store/ebseed/category/seed/
 * Jamalpur Seeds (145 Siddique Bazar):
 *   https://jamalpurseeds.com/en/
 *   https://jamalpurseeds.com/en/news-updates/
 *   https://jamalpurseeds.com/en/cucumber/
 * Century Seed Company (174 Siddique Bazar):
 *   https://centuryseedcompany.com/shop/
 *   https://centuryseedcompany.com/product-category/gourd/
 *
 * Do not invent unretrieved SKUs or interpret this as a complete wholesale inventory.
 */
export type SiddiqueSeedSupplier="East Bengal Seed Co."|"Jamalpur Seeds"|"Century Seed Company";
export type SiddiqueSeedListing={
 name:string;
 category:"বীজ";
 supplier:SiddiqueSeedSupplier;
 source:string;
 aliases?:string[];
};
const east="https://eastbengalseed.com/categories/";
const jamal="https://jamalpurseeds.com/en/";
const jamalNews="https://jamalpurseeds.com/en/news-updates/";
const century="https://centuryseedcompany.com/shop/";

function supplierSeeds(supplier:SiddiqueSeedSupplier,source:string,rows:string):SiddiqueSeedListing[]{
 return rows.trim().split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{
  const [crop,variety,english]=line.split("|").map(v=>v.trim());
  const name=`${variety} ${crop} বীজ`;
  return {name,category:"বীজ" as const,supplier,source,
   aliases:english?[english+` ${crop} seed`,english]:undefined};
 });
}

const eastBengal=supplierSeeds("East Bengal Seed Co.",east,`
শসা|জনতা|Janata
শসা|পপুলার|Popular
শসা|বাহাদুর-২|Bahadur-2
শসা|হিম শীতল|Him Shitol
ঢেঁড়স|ফার্মার গ্রীণ|Farmer Green
ঢেঁড়স|ঝিলিক প্লাস|Jhilik Plus
ঢেঁড়স|গুনগুন|Gungun
ঢেঁড়স|সাকসেস|Success
ঢেঁড়স|কচি প্লাস|Kochi Plus
ঢেঁড়স|কচি|Kochi
মিষ্টিকুমড়া|ব্ল্যাক গোল্ড|Black Gold
মিষ্টিকুমড়া|সুইট প্লাস|Sweet Plus
মিষ্টিকুমড়া|সুইট সুইট|Sweet Sweet
মিষ্টিকুমড়া|বেবি সুইট|Baby Sweet
মিষ্টিকুমড়া|টপ সুইট|Top Sweet
মিষ্টিকুমড়া|বিউটি ১|Beauty 1
মিষ্টিকুমড়া|বেস্ট ঈল্ড|Best Yield
মিষ্টিকুমড়া|সুইট হার্ট|Sweet Heart
মিষ্টিকুমড়া|সুইট মামা|Sweet Mama
মিষ্টিকুমড়া|ড্রাগন সুইট|Dragon Sweet
করলা|অপূর্ব|Apurbo
করলা|ম্যাজিক ১|Magic 1
করলা|মনি মুক্তা|Moni Mukta
করলা|চুমকি|Chumki
করলা|পালি গ্রীন|Pali Green
করলা|ফিল্ড মাস্টার|Field Master
করলা|ফিল্ড কিং|Field King
করলা|রুপালি|Rupali
করলা|নান্দনিক|Nandonik
করলা|ফিল্ড কিং প্লাস|Field King Plus
লাউ|বাসন্তী|Basonti
লাউ|ধবল|Dhobol
লাউ|সাদু|Sadu
লাউ|প্লাস গ্রীন|Plus Green
লাউ|বৈরাগী|Boiragi
ফুলকপি|সামুরাই|Samurai
ফুলকপি|ডেসার্ট সান|Desert Sun
মরিচ|বেঙ্গল হট|Bengal Hot
মরিচ|বেঙ্গল ৫০-৫০|Bengal 50-50
মরিচ|কারেন্ট প্লাস|Current Plus
মরিচ|হট প্লাস|Hot Plus
মরিচ|আজাদী|Azadi
মরিচ|নাগা বিন্দু|Naga Bindu
মরিচ|ডিজি প্লাস|DG Plus
মূলা|রেড বিউটি|Red Beauty
মূলা|ফাস্ট ফার্মার টিএক্স|Fast Farmer TX
বাঁধাকপি|সামার কুইন|Summer Queen
বাঁধাকপি|ড্রিম বল|Dream Ball
বাঁধাকপি|আর্লি সান|Early Sun
মেলন|হনি মুন|Honey Moon
খিরা|পায়রা|Paira
টমেটো|লিমা ২|Lima 2
টমেটো|উজালা|Ujala
টমেটো|সুবর্ণ প্লাস|Suborno Plus
টমেটো|ডন-২|Don 2
টমেটো|রবীন্দ্র|Robindo
ভুট্টা|বিক্রম-৩০৬|Bikram-306
চিচিঙ্গা|বাহারি|Bahari
চিচিঙ্গা|চয়নিকা|Choyanika
ঝিঙা|বেঙ্গল-৫|Bengal-5
ধুন্দল|কান্তা|Kanta
চালকুমড়া|মোনা-১|Mona-1
চালকুমড়া|বেঙ্গল-৭|Bengal-7
বেগুন|ব্ল্যাক মার্বেল|Black Marble
বেগুন|ম্যাজিক বল|Magic Ball
বেগুন|পার্পল সুপার|Purple Super
বেগুন|সুখী|Sukhi
বেগুন|বাবর|Babor
বেগুন|সাথী|Sathi
বেগুন|দীপ্ত|Dipto
পেঁপে|ফার্স্ট লেডি|First Lady
ক্যাপসিকাম|রেড হট|Red Hot
ক্যাপসিকাম|ইয়েলো হট|Yellow Hot
বিটরুট|রেড বল|Red Ball
গাজর|অরেঞ্জ স্টার|Orange Star
গাজর|অরেঞ্জ কুইন|Orange Queen
তরমুজ|আনন্দ|Ananda
তরমুজ|বিগ সুইট|Big Sweet
তরমুজ|প্যাসিফিক-২|Pacific-2
তরমুজ|উল্লাস|Ullash
তরমুজ|গ্রে ড্রাগন|Gray Dragon
তরমুজ|বিগ টপ সুপার|Big Top Super
`);

const jamalpur=supplierSeeds("Jamalpur Seeds",jamal,`
টমেটো|ওয়ান্ডারফুল প্লাস|Wonderful Plus
টমেটো|রেড কিং|Red King
টমেটো|রেড বিউটি-১|Red Beauty-1
বেগুন|গ্রীন সুপার|Green Super
বেগুন|লং ব্ল্যাক|Long Black
বেগুন|চমক|Chomok
মরিচ|সিয়াম হট|Siam Hot
মরিচ|বিন্দু|Bindhu
মরিচ|হট কিং|Hot King
মরিচ|হট স্টার|Hot Star
ফুলকপি|হোয়াইট ডায়মন্ড প্লাস|White Diamond Plus
ফুলকপি|হোয়াইট স্টোন|White Stone
ফুলকপি|রূপবান|Rupban
ফুলকপি|হিট কুইন|Heat Queen
বাঁধাকপি|সুপার ট্রপিক প্লাস|Super Tropic Plus
বাঁধাকপি|গ্রীন ডায়মন্ড প্লাস|Green Diamond Plus
বাঁধাকপি|ট্রপিক গ্রীন|Tropic Green
বাঁধাকপি|হিট সান|Heat Sun
মিষ্টিকুমড়া|বেঙ্গল সুইট-২|Bengal Sweet-2
মিষ্টিকুমড়া|ব্যাংকক এক্সপ্রেস|Bangkok Express
মিষ্টিকুমড়া|ব্যাংকক প্লাস|Bangkok Plus
ব্রোকলি|সুইট গ্রীন|Sweet Green
ব্রোকলি|হাই গ্রীন|High Green
ব্রোকলি|টপ গ্রীন|Top Green
ব্রোকলি|সামার গ্রীন|Summer Green
গাজর|ইয়েলো রকেট|Yellow Rocket
ওলকপি|র‍্যাপিড|Rapid
চাইনিজ বাঁধাকপি|জুডো|Judo
শসা|জেন্টলম্যান|Gentleman
শসা|ওয়ান্ডার গ্রীন|Wonder Green
শসা|অল রাউন্ডার|All Rounder
শসা|অল রাউন্ডার-২|All Rounder-2
শসা|শতাব্দী-২|Shatabdi-2
শসা|ফ্যান্টাসি গ্রীন|Fantasy Green
শসা|ফ্যান্টাসি-১|Fantasy-1
শসা|ফ্যান্টাসি-২|Fantasy-2
শসা|ফরচুন ১|Fortune 1
শসা|বিগ গ্রীন|Big Green
শসা|নাইস গ্রীন|Nice Green
সুইট কর্ন|ড্রিম সুইট-৩|Dream Sweet-3
সুইট কর্ন|টপ সুইট|Top Sweet
মেলন|অ্যারোমা সুইট|Aroma Sweet
মেলন|রিয়া রাউন্ড|Rea Round
তরমুজ|বেঙ্গল টাইগার প্লাস|Bengal Tiger Plus
মূলা|রকেট প্লাস|Rocket Plus
চিচিঙ্গা|ব্ল্যাক স্টিক|Black Stick
ধুন্দল|হোয়াইট ডিলাইট|White Delight
`);
const additionalJamalpur=supplierSeeds("Jamalpur Seeds",jamalNews,`
গাজর|কমলা সুন্দরী|Komola Sundari
মিষ্টিকুমড়া|ব্যাংকক-১|Bangkok-1
মিষ্টিকুমড়া|ব্যাংকক-২|Bangkok-2
শসা|অল রাউন্ডার-২|All Rounder-2
টমেটো|কিং প্লাস|King Plus
ওলকপি|ফাস্ট আর্লি|Fast Early
ওলকপি|র‍্যাপিড সুপার|Rapid Super
চিচিঙ্গা|রানার|Runner
চিচিঙ্গা|বাম্পার|Bumper
বাঁধাকপি|এক্সপ্রেস গ্রীন|Express Green
করলা|হাজারী-১|Hazari-1
লাউ|কচি|Kochi
`);
const centurySeed=supplierSeeds("Century Seed Company",century,`
তরমুজ|বাংলা কিং|Bangla King Hybrid Watermelon
শসা|গ্রীন স্টার|Green Star Hybrid Cucumber
করলা|মনি-১৩১৩|Moni-1313 Hybrid Bitter Gourd
`);
/**
 * Merchant catalogs can repeat the same variety across product/category/news pages.
 * Keep its first sourced listing, without merging unrelated varieties.
 */
function normalizeSeedLabel(value:string):string {
 return value.normalize("NFKC").toLocaleLowerCase()
  .replace(/[\u200c\u200d]/g,"").replace(/[\s\u00a0]+/g," ").trim();
}
const sourcedRows=[...eastBengal,...jamalpur,...additionalJamalpur,...centurySeed];
const seenSourceNames=new Set<string>();
export const SIDDIQUE_BAZAR_PUBLIC_VARIETIES:readonly SiddiqueSeedListing[]=
 sourcedRows.filter(row=>{
  const key=normalizeSeedLabel(row.name);
  if(seenSourceNames.has(key))return false;
  seenSourceNames.add(key);
  return true;
 });

import {EXTRA_BD_AGRI_SUGGESTIONS,type ExtraCategory} from "./bangladesh-agri-market-catalog";
/** Common Bangladesh agricultural products for zero-API-cost typeahead.
 * These are search suggestions, NOT claims that specific varieties are in stock.
 * Keep each label free from pack sizes so customers can enter their own bulk quantity.
 */
export type CropSuggestion = { name: string; category: ExtraCategory; aliases?: string[]; supplier?: string; source?: string };
const RAW_BD_CROP_SUGGESTIONS: readonly CropSuggestion[] = [
 {name:"ধানের বীজ",category:"বীজ",aliases:["ধান বীজ","Rice Seed","Paddy Seed"]},
 {name:"ব্রি ধান২৮ বীজ",category:"বীজ",aliases:["BRRI dhan28","BR28","ব্রি-২৮"]},
 {name:"ব্রি ধান২৯ বীজ",category:"বীজ",aliases:["BRRI dhan29","BR29","ব্রি-২৯"]},
 {name:"ব্রি ধান৪৯ বীজ",category:"বীজ",aliases:["BRRI dhan49","BR49"]},
 {name:"ব্রি ধান৫২ বীজ",category:"বীজ",aliases:["BRRI dhan52","BR52"]},
 {name:"ব্রি ধান৫৮ বীজ",category:"বীজ",aliases:["BRRI dhan58","BR58"]},
 {name:"ব্রি ধান৬৭ বীজ",category:"বীজ",aliases:["BRRI dhan67","BR67"]},
 {name:"ব্রি ধান৭৪ বীজ",category:"বীজ",aliases:["BRRI dhan74","BR74"]},
 {name:"ব্রি ধান৮৭ বীজ",category:"বীজ",aliases:["BRRI dhan87","BR87"]},
 {name:"ব্রি ধান৮৯ বীজ",category:"বীজ",aliases:["BRRI dhan89","BR89"]},
 {name:"ব্রি ধান৯২ বীজ",category:"বীজ",aliases:["BRRI dhan92","BR92"]},
 {name:"ব্রি ধান১০০ বীজ",category:"বীজ",aliases:["BRRI dhan100","BR100"]},
 {name:"বিনা ধান বীজ",category:"বীজ",aliases:["BINA dhan","বিনা ধান"]},
 {name:"কালো ধানের বীজ",category:"বীজ",aliases:["Black Rice Seed","Black Paddy","কালো ধান বীজ"]},
 {name:"সুবর্ণ ৩ ধানের বীজ",category:"বীজ",aliases:["Subarna 3 seed","সুবর্ণ-৩"]},
 {name:"হাইব্রিড ধানের বীজ",category:"বীজ",aliases:["Hybrid Paddy Seed"]},
 {name:"সরিষার বীজ",category:"বীজ",aliases:["Mustard Seed","সরিষা বীজ"]},
 {name:"তিলের বীজ",category:"বীজ",aliases:["Sesame Seed"]},
 {name:"সূর্যমুখী বীজ",category:"বীজ",aliases:["Sunflower Seed"]},
 {name:"চিনাবাদাম বীজ",category:"বীজ",aliases:["Groundnut Seed"]},
 {name:"ভুট্টার বীজ",category:"বীজ",aliases:["Maize Seed","Corn Seed"]},
 {name:"গমের বীজ",category:"বীজ",aliases:["Wheat Seed"]},
 {name:"মসুর ডালের বীজ",category:"বীজ",aliases:["Lentil Seed"]},
 {name:"মুগ ডালের বীজ",category:"বীজ",aliases:["Mung Bean Seed"]},
 {name:"মাষকলাই বীজ",category:"বীজ",aliases:["Black Gram Seed"]},
 {name:"ছোলার বীজ",category:"বীজ",aliases:["Chickpea Seed"]},
 {name:"খেসারি বীজ",category:"বীজ",aliases:["Grass Pea Seed"]},
 {name:"পাটের বীজ",category:"বীজ",aliases:["Jute Seed"]},
 {name:"পেঁয়াজ বীজ",category:"বীজ",aliases:["Onion Seeds","পেঁয়াজ বীজ"]},
 {name:"রসুন বীজ/কোয়া",category:"বীজ",aliases:["Garlic Planting Cloves","রসুনের কোয়া"]},
 {name:"আলুর বীজ/বীজ আলু",category:"বীজ",aliases:["Seed Potato"]},
 {name:"টমেটো বীজ",category:"বীজ",aliases:["Tomato Seeds"]},
 {name:"বেগুন বীজ",category:"বীজ",aliases:["Eggplant Seeds","Brinjal Seeds"]},
 {name:"মরিচ বীজ",category:"বীজ",aliases:["Chilli Seeds","Chili Seeds"]},
 {name:"মিষ্টিকুমড়া বীজ",category:"বীজ",aliases:["Pumpkin Seeds"]},
 {name:"লাউ বীজ",category:"বীজ",aliases:["Bottle Gourd Seeds"]},
 {name:"করলা বীজ",category:"বীজ",aliases:["Bitter Gourd Seeds"]},
 {name:"ঝিঙা বীজ",category:"বীজ",aliases:["Ridge Gourd Seeds"]},
 {name:"চিচিঙ্গা বীজ",category:"বীজ",aliases:["Snake Gourd Seeds"]},
 {name:"শসা বীজ",category:"বীজ",aliases:["Cucumber Seeds"]},
 {name:"ঢেঁড়স বীজ",category:"বীজ",aliases:["Okra Seeds","ঢেঁড়স বীজ"]},
 {name:"শিম বীজ",category:"বীজ",aliases:["Bean Seeds"]},
 {name:"বরবটি বীজ",category:"বীজ",aliases:["Yardlong Bean Seeds"]},
 {name:"ফুলকপি বীজ",category:"বীজ",aliases:["Cauliflower Seeds"]},
 {name:"বাঁধাকপি বীজ",category:"বীজ",aliases:["Cabbage Seeds"]},
 {name:"গাজর বীজ",category:"বীজ",aliases:["Carrot Seeds"]},
 {name:"মূলা বীজ",category:"বীজ",aliases:["Radish Seeds"]},
 {name:"পালংশাক বীজ",category:"বীজ",aliases:["Spinach Seeds"]},
 {name:"লালশাক বীজ",category:"বীজ",aliases:["Red Amaranth Seeds"]},
 {name:"পুঁইশাক বীজ",category:"বীজ",aliases:["Malabar Spinach Seeds"]},
 {name:"কলমিশাক বীজ",category:"বীজ",aliases:["Water Spinach Seeds"]},
 {name:"ধনেপাতা বীজ",category:"বীজ",aliases:["Coriander Seeds"]},
 {name:"মেথি বীজ",category:"বীজ",aliases:["Fenugreek Seed"]},
 {name:"জিরা বীজ",category:"বীজ",aliases:["Cumin Seeds"]},
 {name:"চিয়া সিড",category:"বীজ",aliases:["Chia Seeds"]},
 {name:"তরমুজ বীজ",category:"বীজ",aliases:["Watermelon Seeds"]},
 {name:"পেঁপে বীজ",category:"বীজ",aliases:["Papaya Seeds"]},
 {name:"সজিনা বীজ",category:"বীজ",aliases:["Moringa Seeds"]},
 {name:"ঘাসের বীজ",category:"বীজ",aliases:["Fodder Grass Seeds"]},
 {name:"বোরো ধান",category:"ধান ও চাল",aliases:["Boro Paddy"]},
 {name:"আমন ধান",category:"ধান ও চাল",aliases:["Aman Paddy"]},
 {name:"আউশ ধান",category:"ধান ও চাল",aliases:["Aus Paddy"]},
 {name:"কালো ধান",category:"ধান ও চাল",aliases:["Black Paddy"]},
 {name:"কালো চাল",category:"ধান ও চাল",aliases:["Black Rice"]},
 {name:"মিনিকেট চাল",category:"ধান ও চাল",aliases:["Miniket Rice"]},
 {name:"নাজিরশাইল চাল",category:"ধান ও চাল",aliases:["Nazirshail Rice"]},
 {name:"আতপ চাল",category:"ধান ও চাল",aliases:["Atap Rice"]},
 {name:"সিদ্ধ চাল",category:"ধান ও চাল",aliases:["Parboiled Rice"]},
 {name:"গম",category:"ফসল",aliases:["Wheat"]},
 {name:"ভুট্টা",category:"ফসল",aliases:["Maize","Corn"]},
 {name:"সরিষা",category:"ফসল",aliases:["Mustard"]},
 {name:"পাট",category:"ফসল",aliases:["Jute"]},
 {name:"আলু",category:"সবজি",aliases:["Potato"]},
 {name:"পেঁয়াজ",category:"সবজি",aliases:["Onion"]},
 {name:"রসুন",category:"সবজি",aliases:["Garlic"]},
 {name:"কাঁচা মরিচ",category:"সবজি",aliases:["Green Chili"]},
 {name:"টমেটো",category:"সবজি",aliases:["Tomato"]},
 {name:"বেগুন",category:"সবজি",aliases:["Eggplant","Brinjal"]},
 {name:"ফুলকপি",category:"সবজি",aliases:["Cauliflower"]},
 {name:"বাঁধাকপি",category:"সবজি",aliases:["Cabbage"]},
 {name:"শসা",category:"সবজি",aliases:["Cucumber"]},
 {name:"লাউ",category:"সবজি",aliases:["Bottle Gourd"]},
 {name:"করলা",category:"সবজি",aliases:["Bitter Gourd"]},
 {name:"পেঁপে",category:"ফল ও চারা",aliases:["Papaya"]},
 {name:"আম",category:"ফল ও চারা",aliases:["Mango"]},
 {name:"কলা",category:"ফল ও চারা",aliases:["Banana"]},
 {name:"লিচু",category:"ফল ও চারা",aliases:["Lychee"]},
 {name:"আমের চারা",category:"ফল ও চারা",aliases:["Mango Sapling"]},
 {name:"পেঁপের চারা",category:"ফল ও চারা",aliases:["Papaya Seedling"]},
 ...EXTRA_BD_AGRI_SUGGESTIONS,
];
/** Case-insensitive, space/punctuation tolerant, Bengali digit aware. */
const digitMap:Record<string,string>={"০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9"};
export function cropSearchKey(value:string):string{
 return value.toLocaleLowerCase().replace(/[০-৯]/g,ch=>digitMap[ch]||ch)
  .replace(/\b(bij|beej|biji)\b/g,"বীজ").replace(/বিজ/g,"বীজ")
  .normalize("NFKC").replace(/[\u200c\u200d]/g,"").replace(/[ _–—-]+/g," ").trim();
}
/** De-duplicate the actual shipped catalog, not only the suggestion results.
 * Preserve published supplier provenance and all useful search aliases.
 */
function uniqueCropCatalog(source:readonly CropSuggestion[]):CropSuggestion[]{
 const deduplicated=new Map<string,CropSuggestion>();
 for(const item of source){
  const key=cropSearchKey(item.name);
  const previous=deduplicated.get(key);
  if(!previous){deduplicated.set(key,item);continue;}
  const preferred=item.supplier&&!previous.supplier?item:previous;
  const aliases=[...new Set([...(previous.aliases||[]),...(item.aliases||[])])];
  deduplicated.set(key,{...preferred,aliases});
 }
 return [...deduplicated.values()];
}
export const BD_CROP_SUGGESTIONS:readonly CropSuggestion[]=uniqueCropCatalog(RAW_BD_CROP_SUGGESTIONS);
export function suggestCrops(query:string, catalog:readonly CropSuggestion[]=BD_CROP_SUGGESTIONS,limit=8):CropSuggestion[]{
 const q=cropSearchKey(query);
 if(q.length<1 || !Number.isFinite(limit) || limit<=0)return [];
 const matches = catalog.map((entry,index)=>{
  const name=cropSearchKey(entry.name);
  const aliases=(entry.aliases||[]).map(cropSearchKey);
  const exact=name===q||aliases.some(a=>a===q);
  const starts=name.startsWith(q)||aliases.some(a=>a.startsWith(q));
  const contains=name.includes(q)||aliases.some(a=>a.includes(q));
  return {entry,index,rank:exact?0:starts?1:contains?2:99};
 }).filter(x=>x.rank<99).sort((a,b)=>a.rank-b.rank||a.index-b.index);
 const unique=new Set<string>();
 const results:CropSuggestion[]=[];
 for(const match of matches){
   const key=cropSearchKey(match.entry.name);
   if(unique.has(key))continue;
   unique.add(key);
   results.push(match.entry);
   if(results.length>=Math.max(0,limit))break;
 }
 return results;
}

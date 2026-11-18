/**
 * AGRIVA-only, opt-in reading interests. Never reads cross-site browser history,
 * cookies, accounts or server analytics. Persisted only in this browser.
 */
export const READER_KEY = "agriva:blog-reader:v1";
export const READER_EVENT = "agriva:blog-reader-change";
const MAX_READS = 40;
const KEEP_MS = 90 * 24 * 60 * 60 * 1000;

export type ReaderVisit = {href:string; category:string; words:string[]; at:number};
export type ReaderState = {enabled:boolean; visits:ReaderVisit[]};
const EMPTY:ReaderState = {enabled:false,visits:[]};
const STOP = new Set(["কৃষি","চাষ","চাষের","চাষাবাদ","বাংলাদেশ","বাংলাদেশে","পদ্ধতি","গাইড","সম্পূর্ণ","কিভাবে","কীভাবে","জন্য","এবং","করে","করার","থেকে","with","guide","bangladesh","the","and","for"]);
export function topicWords(value:string):string[] {
  return Array.from(new Set((value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[])
    .filter(word=>word.length>=3 && word.length<=40 && !STOP.has(word)))).slice(0,24);
}
function validHref(href:string){return /^\/(?:blog|learn)\/[a-z0-9][a-z0-9-]{0,160}$/.test(href);}
export function readReaderState():ReaderState {
  if(typeof window==="undefined")return EMPTY;
  try{
    const text=window.localStorage.getItem(READER_KEY);
    if(!text)return EMPTY;
    const parsed:unknown=JSON.parse(text);
    if(!parsed || typeof parsed!=="object")return EMPTY;
    const record=parsed as {enabled?:unknown;visits?:unknown};
    if(record.enabled!==true)return EMPTY;
    const now=Date.now();
    const visits=Array.isArray(record.visits)?record.visits.filter((entry):entry is ReaderVisit=>{
      if(!entry || typeof entry!=="object")return false;
      const item=entry as Partial<ReaderVisit>;
      return typeof item.href==="string" && validHref(item.href)
        && typeof item.category==="string" && item.category.length<=90
        && Array.isArray(item.words) && item.words.every(word=>typeof word==="string" && word.length<=40)
        && typeof item.at==="number" && Number.isFinite(item.at)
        && item.at<=now+60000 && item.at>now-KEEP_MS;
    }).slice(0,MAX_READS):[];
    return {enabled:true,visits};
  }catch{return EMPTY;}
}
function saveReader(state:ReaderState){
  try{
    if(!state.enabled)window.localStorage.removeItem(READER_KEY);
    else window.localStorage.setItem(READER_KEY,JSON.stringify(state));
    window.dispatchEvent(new Event(READER_EVENT));
  }catch{
    // Private browsing or full storage must not interrupt article reading.
  }
}
export function enableReader(){if(typeof window!=="undefined")saveReader({enabled:true,visits:[]});}
export function clearReader(){if(typeof window!=="undefined")saveReader(EMPTY);}
export function recordReaderVisit(href:string,category:string,title:string){
  if(typeof window==="undefined" || !validHref(href))return;
  const current=readReaderState();
  if(!current.enabled)return;
  const visit:ReaderVisit={href,category:category.slice(0,90),words:topicWords(title+" "+category),at:Date.now()};
  saveReader({enabled:true,visits:[visit,...current.visits.filter(item=>item.href!==href)].slice(0,MAX_READS)});
}
export type ReaderCandidate={href:string;category:string;title:string;excerpt:string};
export function recommendationScore(candidate:ReaderCandidate,state:ReaderState):number {
  if(!state.enabled || !state.visits.length)return 0;
  const tokens=new Set(topicWords(candidate.title+" "+candidate.category+" "+candidate.excerpt));
  const now=Date.now();
  return state.visits.reduce((score,visit,index)=>{
    if(candidate.href===visit.href)return score-3;
    const overlap=visit.words.reduce((n,word)=>n+(tokens.has(word)?1:0),0);
    const sameCategory=candidate.category===visit.category?2:0;
    const freshness=Math.max(0.2,1-(now-visit.at)/KEEP_MS);
    return score+(overlap*3+sameCategory)*freshness/(1+index*0.22);
  },0);
}

/** Article bookmarks are separately and explicitly saved by a button click.
 * No account sync or external analytics.
 */
export const BOOKMARK_KEY = "agriva:blog-bookmarks:v1";
export function readBookmarks():string[] {
  if(typeof window==="undefined")return [];
  try{
    const parsed:unknown=JSON.parse(window.localStorage.getItem(BOOKMARK_KEY)||"[]");
    return Array.isArray(parsed)?Array.from(new Set(parsed.filter((entry):entry is string=>typeof entry==="string"&&validHref(entry)))).slice(0,100):[];
  }catch{return [];}
}
export function toggleBookmark(href:string):boolean{
  if(typeof window==="undefined"||!validHref(href))return false;
  const previous=readBookmarks();
  const already=previous.includes(href);
  const next=already?previous.filter(item=>item!==href):[href,...previous].slice(0,100);
  try{
    window.localStorage.setItem(BOOKMARK_KEY,JSON.stringify(next));
    window.dispatchEvent(new Event(READER_EVENT));
    return !already;
  }catch{return already;}
}

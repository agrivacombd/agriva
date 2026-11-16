/** Per-browser preferences only. Original server-side marketplace ranking is unchanged. */
export type InterestKind = "view" | "click" | "save" | "cart";
export type Interest = { kind: InterestKind; id: string; category: string | null; subcategory: string | null; time: number };
export type Item = { id: string; category_slug?: string | null; subcategory_slug?: string | null; stock?: number | null; price?: number | string | null };
export const INTEREST_KEY = "agriva:marketplace:interest:v1";
export const INTEREST_CHANGED = "agriva:marketplace:interest-changed";
const DAY = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slug = (v: unknown) => typeof v === "string" && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v) ? v : null;
const weight: Record<InterestKind, number> = { view: 2, click: 3, save: 6, cart: 9 };

export function personalizationAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack !== "1" && nav.globalPrivacyControl !== true;
}
export function cleanHistory(raw: unknown, now = Date.now()): Interest[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-160).flatMap((x): Interest[] => {
    if (!x || !Object.prototype.hasOwnProperty.call(weight,x.kind) ||
        typeof x.time !== "number" || !Number.isFinite(x.time) ||
        x.time < now - 30*DAY || x.time > now+60000 ||
        typeof x.id !== "string" || !UUID.test(x.id)) return [];
    return [{id:x.id,kind:x.kind as InterestKind,category:slug(x.category),subcategory:slug(x.subcategory),time:x.time}];
  }).slice(-80);
}
export function readInterest(): Interest[] {
  if (!personalizationAllowed()) return [];
  try { return cleanHistory(JSON.parse(window.localStorage.getItem(INTEREST_KEY) || "[]")); }
  catch { return []; }
}
function writeInterest(events: Interest[]) {
  try {
    window.localStorage.setItem(INTEREST_KEY,JSON.stringify(events.slice(-80)));
    window.dispatchEvent(new Event(INTEREST_CHANGED));
  } catch { /* storage-disabled browsers continue with the public catalogue */ }
}
export function recordInterest(item: Item, kind: InterestKind) {
  if (!personalizationAllowed() || !UUID.test(item.id)) return;
  const now=Date.now(), category=slug(item.category_slug), subcategory=slug(item.subcategory_slug);
  const events=readInterest();
  const cooldown=kind==="view"?60*60000:kind==="save"?6*60*60000:15*60000;
  if(events.some(e=>e.kind===kind && e.id===item.id && now-e.time<cooldown))return;
  writeInterest([...events,{kind,id:item.id,category,subcategory,time:now}]);
}
export function unsaveInterest(id:string) {
  if(!personalizationAllowed())return;
  writeInterest(readInterest().filter(e=>e.id!==id || e.kind!=="save"));
}
export function clearInterest() {
  if(typeof window==="undefined")return;
  try { window.localStorage.removeItem(INTEREST_KEY); window.dispatchEvent(new Event(INTEREST_CHANGED)); } catch {}
}
/** Only a bounded preference boost is permitted; stock remains the top constraint. */
export function suggestForBrowser<T extends Item>(list:T[], history:Interest[], savedIds:string[], now=Date.now()) {
  const active=cleanHistory(history,now), saved=new Set(savedIds);
  if(!active.length && !saved.size)return {ordered:list,suggested:[] as T[]};
  const exact=new Map<string,number>(),cats=new Map<string,number>(),subs=new Map<string,number>();
  for(const e of active){
    const w=weight[e.kind]*Math.pow(0.5,(now-e.time)/(14*DAY));
    exact.set(e.id,(exact.get(e.id)||0)+w);
    if(e.category)cats.set(e.category,(cats.get(e.category)||0)+w);
    if(e.category && e.subcategory){
      const key=e.category+"/"+e.subcategory;subs.set(key,(subs.get(key)||0)+w);
    }
  }
  const score=(p:T)=>Math.min(20,(exact.get(p.id)||0)*0.65+
    (p.category_slug?cats.get(p.category_slug)||0:0)*0.55+
    (p.category_slug && p.subcategory_slug?subs.get(p.category_slug+"/"+p.subcategory_slug)||0:0)*1.05+
    (saved.has(p.id)?5:0));
  const available=(p:T)=>Number(p.stock||0)>0;
  const index=new Map(list.map((p,i)=>[p.id,i]));
  const ordered=[...list].sort((a,b)=>{
    if(available(a)!==available(b))return available(a)?-1:1;
    return (index.get(a.id)||0)-Math.min(16,score(a)*1.5)-
      ((index.get(b.id)||0)-Math.min(16,score(b)*1.5)) ||
      (index.get(a.id)||0)-(index.get(b.id)||0);
  });
  const matches=list.filter(p=>available(p) && p.price!=null && Number.isFinite(Number(p.price)) &&
    Number(p.price)>=0 && score(p)>=1.5);
  matches.sort((a,b)=>score(b)-score(a) || (index.get(a.id)||0)-(index.get(b.id)||0));
  const suggested:T[]=[];
  for(const p of matches){
    const key=(p.category_slug||"")+"/"+(p.subcategory_slug||"");
    if(matches.length>4 && suggested.filter(q=>(q.category_slug||"")+"/"+(q.subcategory_slug||"")===key).length>=2)continue;
    suggested.push(p);
    if(suggested.length===4)break;
  }
  for(const p of matches){if(suggested.length===4)break;if(!suggested.includes(p))suggested.push(p);}
  return {ordered,suggested};
}

/** Structural SEO preflight; it does not validate factual accuracy or prove search rankings. */
export type EditorialInput={title:string;metaTitle:string|null;metaDescription:string|null;keyword:string;body:string};
export type EditorialCheck={id:string;label:string;passed:boolean;guidance:string};
const dummy=/example\.(com|org|net)|\bTODO\b|\bTBD\b|lorem ipsum|যাচাই করা উত্তর লিখুন|সূত্রের নাম|লিংকের নাম|Add source-backed|Write (?:here|the)/i;
function getLinks(body:string):string[]{
  return [...body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/gi)].map(m=>m[1]);
}
export function normalizeEditorialMarkdown(input:string):string{
  const clean=String(input||"").replace(/\\(#{1,3})(?=\s)/gm,"$1").replace(/\\([*_\[\]().-])/g,"$1").replace(/\\:/g,":").replace(/\\\r?\n/g,"\n");
  return clean.replace(/<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,(_,href:string,caption:string)=>{
    const text=caption.replace(/<[^>]+>/g,"").replace(/[\[\]]/g,"").trim();
    return /^(https?:\/\/|\/(?!\/))/.test(href.trim())?"["+text+"]("+href.trim()+")":text;
  });
}
export function getEditorialChecks(input:EditorialInput):EditorialCheck[]{
  const body=normalizeEditorialMarkdown(input.body);
  const sections=[...body.matchAll(/^##\s+(.+)$/gm)];
  const faq=sections.find(m=>/FAQ|সাধারণ প্রশ্ন|জিজ্ঞাসা/i.test(m[1]));
  const source=sections.find(m=>/^(তথ্যসূত্র|উৎস|রেফারেন্স|references|sources)(\s|$)/i.test(m[1].trim()));
  const endOf=(m:RegExpMatchArray)=>sections.find(n=>(n.index||0)>(m.index||0))?.index??body.length;
  const faqBody=faq?body.slice((faq.index||0)+faq[0].length,endOf(faq)):"";
  const sources=source?body.slice((source.index||0)+source[0].length,endOf(source)):"";
  const sourceLinks=getLinks(sources).filter(l=>/^https:\/\//i.test(l)&&!dummy.test(l));
  const linked=getLinks(body).some(l=>{
    if(/^\/(blog|plant-market|marketplace|learn|tools|agriculture-calculators)(\/|$)/.test(l))return true;
    try{const u=new URL(l);return /^(www\.)?agriva\.com\.bd$/i.test(u.hostname)&&/^\/(blog|plant-market|marketplace|learn|tools|agriculture-calculators)(\/|$)/.test(u.pathname);}
    catch{return false;}
  });
  const intro=body.split(/^##\s+/m)[0].toLocaleLowerCase();
  const words=body.replace(/\[[^\]]+\]\([^)]+\)/g,"").replace(/[#*_>]/g," ").trim().split(/\s+/u).filter(Boolean).length;
  const check=(id:string,label:string,passed:boolean,guidance:string)=>({id,label,passed,guidance});
  return [
    check("structure","কমপক্ষে ৩টি H2 বিভাগ",sections.length>=3,"পরিচিতি, মূল তথ্য, ব্যবহার/পরিচর্যা, FAQ এবং সূত্র সাজান।"),
    check("keyword","ভূমিকায় Focus keyword",!!input.keyword.trim()&&intro.includes(input.keyword.trim().toLocaleLowerCase()),"প্রথম অনুচ্ছেদে মূল keyword স্বাভাবিকভাবে ব্যবহার করুন।"),
    check("length","তথ্যবহুল লেখা (৩৫০+ শব্দ)",words>=350,"প্রয়োজনীয় তথ্যপূর্ণ আলোচনা যুক্ত করুন; শুধু শব্দ বাড়াবেন না।"),
    check("internal","AGRIVA internal link",linked,"প্রাসঙ্গিক বাস্তব Product বা Blog page যুক্ত করুন।"),
    check("faq","FAQ ও কমপক্ষে ২টি উত্তর",!!faq&&[...faqBody.matchAll(/^###\s+/gm)].length>=2&&faqBody.replace(/^###.*$/gm,"").trim().length>=80,"দুটি বাস্তব প্রশ্ন ও তথ্যপূর্ণ উত্তর প্রয়োজন।"),
    check("sources","তথ্যসূত্রে অন্তত ২টি HTTPS উৎস",!!source&&new Set(sourceLinks).size>=2,"সরকারি/গবেষণা উৎস থেকে কার্যকর লিংক দিন; তথ্য নিজে যাচাই করুন।"),
    check("metaTitle","Meta title ২৫–৬৫ অক্ষর",!!input.metaTitle&&input.metaTitle.trim().length>=25&&input.metaTitle.trim().length<=65,"সংক্ষিপ্ত ও প্রাসঙ্গিক SEO title দিন।"),
    check("metaDescription","Meta description ১০০–১৮০ অক্ষর",!!input.metaDescription&&input.metaDescription.trim().length>=100&&input.metaDescription.trim().length<=180,"অর্থবহ ও আকর্ষণীয় সারাংশ দিন।"),
    check("title","পূর্ণাঙ্গ article title",!!input.title.trim()&&input.title.trim().length<=160,"একটি সুনির্দিষ্ট মূল শিরোনাম লিখুন।"),
    check("dummy","অসম্পূর্ণ placeholder নেই",!dummy.test(body),"উদাহরণ/placeholder-এর বদলে যাচাইকৃত বাস্তব তথ্য দিন।"),
  ];
}
export function editorialReady(input:EditorialInput){return getEditorialChecks(input).every(c=>c.passed);}

import type {ReactNode} from "react";

export type ArticleBlock={
  kind:"p"|"h2"|"h3"|"ul"|"ol"|"quote"|"table"|"image";
  lines:string[];
  headers?:string[];
  rows?:string[][];
  image?:{src:string;alt:string};
};
/** Markdown only. Never render raw HTML or scriptable links from article content. */
function safeUrl(value:string):string|null{
  if(value.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\"))return value;
  try{const url=new URL(value);return (url.protocol==="https:"||url.protocol==="http:")?url.href:null;}
  catch{return null;}
}
function safeImageUrl(value:string):string|null{
  const src=safeUrl(value);
  return src&&(src.startsWith("/")||src.startsWith("https://"))?src:null;
}
const inlinePattern=/(\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*)/g;
function inline(text:string,level=0):ReactNode[]{
  if(level>3)return [text];
  const children:ReactNode[]=[];let pos=0,key=0;
  for(const match of text.matchAll(inlinePattern)){
    const index=match.index??0;
    if(index>pos)children.push(text.slice(pos,index));
    if(match[2]!==undefined&&match[3]!==undefined){
      const href=safeUrl(match[3]);
      children.push(href?<a key={key++} href={href} {...(href.startsWith("http")?{rel:"noopener noreferrer",target:"_blank"}:{})}
        className="font-semibold text-emerald-800 underline underline-offset-2">{inline(match[2],level+1)}</a>:match[0]);
    }else if(match[4]!==undefined)children.push(<strong key={key++}>{inline(match[4],level+1)}</strong>);
    else if(match[5]!==undefined)children.push(<em key={key++}>{inline(match[5],level+1)}</em>);
    pos=index+match[0].length;
  }
  if(pos<text.length)children.push(text.slice(pos));
  return children.length?children:[text];
}
/** Splits Markdown pipes, except escaped \| inside table cell text. */
function cells(raw:string){
  const line=raw.trim().replace(/^\|/,"").replace(/\|$/,"");
  return line.split(/(?<!\\)\|/u).map(c=>c.replace(/\\\|/g,"|").trim());
}
function isSeparator(raw:string):boolean{
  const segments=cells(raw);
  return segments.length>=2&&segments.every(c=>/^:?-{3,}:?$/.test(c));
}
export function parseArticleMarkdown(body:string):ArticleBlock[]{
  const blocks:ArticleBlock[]=[];let paragraph:string[]=[];let current:ArticleBlock|null=null;
  const flush=()=>{if(paragraph.length)blocks.push({kind:"p",lines:[paragraph.join(" ")]});paragraph=[];};
  const rawLines=body.replace(/\r\n/g,"\n").split("\n");
  for(let i=0;i<rawLines.length;i++){
    const s=rawLines[i].trim(),next=rawLines[i+1]?.trim()||"";
    if(!s){flush();current=null;continue;}
    if(s.includes("|")&&isSeparator(next)){
      const headers=cells(s),separators=cells(next);
      if(headers.length===separators.length&&headers.every(Boolean)){
        flush();current=null;i++;
        const rows:string[][]=[];
        while(i+1<rawLines.length){
          const candidate=rawLines[i+1].trim();
          if(!candidate||!candidate.includes("|"))break;
          const cols=cells(candidate);
          if(cols.length!==headers.length)break;
          rows.push(cols);i++;
        }
        blocks.push({kind:"table",lines:[],headers,rows});continue;
      }
    }
    const image=/^!\[([^\]]+)\]\(([^)\s]+)\)$/.exec(s);
    if(image&&image[1].trim().length>=2){
      const src=safeImageUrl(image[2]);
      if(src){flush();current=null;blocks.push({kind:"image",lines:[],image:{src,alt:image[1].trim()}});continue;}
    }
    const heading=/^(#{1,3})\s+(.+)$/.exec(s);
    if(heading){flush();current=null;blocks.push({kind:heading[1].length>=3?"h3":"h2",lines:[heading[2]]});continue;}
    const ul=/^[-+*]\s+(.+)$/.exec(s),ol=/^\d+[.)]\s+(.+)$/.exec(s);
    if(ul||ol){
      flush();const kind=ul?"ul":"ol";
      if(!current||current.kind!==kind){current={kind,lines:[]};blocks.push(current);}
      current.lines.push((ul||ol)![1]);continue;
    }
    if(s.startsWith("> ")){flush();current=null;blocks.push({kind:"quote",lines:[s.slice(2)]});continue;}
    current=null;paragraph.push(s);
  }
  flush();return blocks;
}
export function ArticleMarkdown({body,headingLinks=false}:{body:string;headingLinks?:boolean}){
  return <div className="min-w-0 space-y-5 break-words [overflow-wrap:anywhere] text-[15px] leading-[1.9] text-slate-700 sm:text-[16px] sm:leading-[1.95]">
    {parseArticleMarkdown(body).map((block,i)=>{
      if(block.kind==="h2")return <h2 key={i} id={headingLinks ? `section-${i}` : undefined} className="scroll-mt-24 border-b border-slate-100 pb-3 pt-6 text-[1.3rem] font-bold leading-[1.5] text-[#173b2d] sm:text-[1.55rem]">{inline(block.lines[0])}</h2>;
      if(block.kind==="h3")return <h3 key={i} id={headingLinks ? `section-${i}` : undefined} className="scroll-mt-24 pt-3 text-lg font-bold leading-[1.5] text-[#173b2d]">{inline(block.lines[0])}</h3>;
      if(block.kind==="ul")return <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ul>;
      if(block.kind==="ol")return <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ol>;
      if(block.kind==="quote")return <blockquote key={i} className="border-l-4 border-emerald-300 bg-emerald-50 px-4 py-3 italic">{inline(block.lines[0])}</blockquote>;
      if(block.kind==="table"){
        const headers=block.headers||[];
        const rows=block.rows||[];
        const minWidth=Math.max(320,headers.length*164);
        const hintId=`article-table-hint-${i}`;
        return <figure key={i} className="my-7 min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5">
            <span className="text-sm font-extrabold text-slate-800">তথ্য সারণি</span>
            <span id={hintId} className="text-xs leading-5 text-slate-600">আরও কলাম দেখতে ডানে-বামে সরান ↔</span>
          </figcaption>
          {/* A single semantic table at every breakpoint: scrolling is isolated to this region.
              Keep the first column visible while wide tables are scrolled on small screens. */}
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain scroll-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700" role="region" aria-label="নিবন্ধের তথ্য সারণি" aria-describedby={hintId} tabIndex={0}>
            <table className="w-full border-separate border-spacing-0 text-left text-[14px] leading-6 sm:text-[15px] lg:text-base 2xl:text-lg 2xl:leading-8" style={{minWidth}}>
              <thead className="bg-emerald-50 text-emerald-950">
                <tr>{headers.map((h,j)=><th key={j} scope="col" className={`min-w-[138px] max-w-[280px] break-words border-b border-r border-emerald-100 px-3 py-3 align-top font-extrabold last:border-r-0 sm:min-w-[164px] sm:px-4 sm:py-4 2xl:px-5 ${j===0?"sticky left-0 z-20 bg-emerald-50 shadow-[2px_0_4px_-3px_rgba(15,23,42,0.45)]":""}`}>{inline(h)}</th>)}</tr>
              </thead>
              <tbody>{rows.map((row,j)=><tr key={j}>
                {headers.map((_,k)=><td key={k} className={`min-w-[138px] max-w-[360px] break-words border-b border-r border-slate-100 px-3 py-3 align-top text-slate-700 [overflow-wrap:anywhere] last:border-r-0 sm:min-w-[164px] sm:px-4 sm:py-4 2xl:px-5 ${j===rows.length-1?"border-b-0 ":""}${k===0?`sticky left-0 z-10 font-semibold shadow-[2px_0_4px_-3px_rgba(15,23,42,0.45)] ${j%2===0?"bg-white":"bg-slate-50"}`:j%2===0?"bg-white":"bg-slate-50"}`}>{inline(row[k]||"—")}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </figure>;
      }
      if(block.kind==="image"&&block.image)return <figure key={i} className="my-6 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 min-[380px]:p-2 sm:p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.image.src} alt={block.image.alt} loading="lazy" decoding="async" style={{width:"100%",height:"auto",maxHeight:"none",objectFit:"contain"}} className="mx-auto block h-auto w-full max-w-full object-contain"/>
        <figcaption className="mt-2 break-words border-t border-slate-100 px-2 py-2 text-center text-xs leading-5 text-slate-600 sm:px-4">{block.image.alt}</figcaption>
      </figure>;
      return <p key={i} className="leading-[1.9] sm:leading-[1.95]">{inline(block.lines[0])}</p>;
    })}
  </div>;
}

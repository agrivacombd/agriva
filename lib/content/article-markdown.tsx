import type {ReactNode} from "react";

export type ArticleBlock={
  kind:"p"|"h2"|"h3"|"ul"|"ol"|"task"|"quote"|"table"|"image";
  lines:string[];
  headers?:string[];
  rows?:string[][];
  image?:{src:string;alt:string};
  tasks?:{checked:boolean;text:string}[];
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
export function ArticleMarkdown({body,headingLinks=false,locale="bn"}:{body:string;headingLinks?:boolean;locale?:"bn"|"en"}){
  return <div className="min-w-0 space-y-5 break-words [overflow-wrap:anywhere] text-[15px] leading-[1.9] text-slate-700 sm:text-[16px] sm:leading-[1.95]">
    {parseArticleMarkdown(body).map((block,i)=>{
      if(block.kind==="h2")return <h2 key={i} id={headingLinks ? `section-${i}` : undefined} className="scroll-mt-24 border-b border-slate-100 pb-3 pt-6 text-[1.3rem] font-bold leading-[1.5] text-[#173b2d] sm:text-[1.55rem]">{inline(block.lines[0])}</h2>;
      if(block.kind==="h3")return <h3 key={i} id={headingLinks ? `section-${i}` : undefined} className="scroll-mt-24 pt-3 text-lg font-bold leading-[1.5] text-[#173b2d]">{inline(block.lines[0])}</h3>;
      if(block.kind==="ul")return <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ul>;
      if(block.kind==="ol")return <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ol>;
      if(block.kind==="task")return <ul key={i} className="my-2 list-none space-y-2 pl-0" aria-label={locale==="en"?"Checklist":"যাচাই তালিকা"}>{(block.tasks||[]).map((task,j)=><li key={j} className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5"><input type="checkbox" checked={task.checked} readOnly disabled aria-label={task.text} className="mt-1 h-4 w-4 shrink-0 cursor-default accent-emerald-700 disabled:opacity-100"/><span className="min-w-0">{inline(task.text)}</span></li>)}</ul>;
      if(block.kind==="quote")return <blockquote key={i} className="border-l-4 border-emerald-300 bg-emerald-50 px-4 py-3 italic">{inline(block.lines[0])}</blockquote>;
      if(block.kind==="table"){
        const headers=block.headers||[];
        const rows=block.rows||[];
        const compact=headers.length<=2;
        const hintId=`article-table-hint-${i}`;
        return <figure key={i} className="my-7 min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5">
            <span className="text-sm font-extrabold text-slate-800">{locale==="en"?"Data table":"তথ্য সারণি"}</span>
            {!compact&&<span id={hintId} className="text-xs leading-5 text-slate-600 sm:text-sm">{locale==="en"?"Scroll sideways to see all columns":"সব কলাম পড়তে টেবিলটি ডানে-বামে সরান"} <span aria-hidden="true">↔</span></span>}
          </figcaption>
          {/* One semantic data table on every device. A two-column table fits the
              available width; only wider tables get an internal scroll area.
              Sticky columns begin on large screens, where they cannot obscure the data. */}
          <div
            className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 [scrollbar-color:#94a3b8_#f1f5f9] [scrollbar-width:thin]"
            role="region" aria-label={locale==="en"?"Article data table":"নিবন্ধের তথ্য সারণি"} aria-describedby={!compact?hintId:undefined} tabIndex={0}>
            <table
              className={`w-full border-separate border-spacing-0 text-left text-[14px] leading-[1.65] sm:text-[15px] lg:text-base 2xl:text-lg 2xl:leading-[1.8] ${compact?"table-fixed":"table-auto"}`}
              style={{minWidth:compact?"100%":`${headers.length*150}px`}}>
              <thead>
                <tr>{headers.map((h,j)=><th key={j} scope="col"
                  className={`break-words border-b border-r border-emerald-200 bg-emerald-50 px-2.5 py-3 text-left align-top font-extrabold text-emerald-950 [overflow-wrap:anywhere] last:border-r-0 sm:px-4 sm:py-4 2xl:px-5 ${!compact?"min-w-[150px] max-w-[320px]":""} ${j===0&&!compact?"lg:sticky lg:left-0 lg:z-20 lg:shadow-[3px_0_5px_-4px_rgba(15,23,42,0.4)]":""}`}>{inline(h)}</th>)}</tr>
              </thead>
              <tbody>{rows.map((row,j)=><tr key={j}>
                {headers.map((_,k)=><td key={k} className={`break-words border-b border-r border-slate-100 px-2.5 py-3 align-top text-slate-800 [overflow-wrap:anywhere] last:border-r-0 sm:px-4 sm:py-4 2xl:px-5 ${j===rows.length-1?"border-b-0":""} ${!compact?"min-w-[150px] max-w-[380px]":""} ${j%2===0?"bg-white":"bg-slate-50"} ${k===0?"font-semibold":""} ${k===0&&!compact?"lg:sticky lg:left-0 lg:z-10 lg:shadow-[3px_0_5px_-4px_rgba(15,23,42,0.4)]":""}`}>{inline(row[k]??"—")}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          {!compact&&<p className="border-t border-slate-100 px-3 py-2 text-xs leading-5 text-slate-500 sm:hidden">{locale==="en"?"Tip: swipe left or right inside the table.":"টিপস: আঙুল দিয়ে টেবিলের ভেতর ডানে-বামে সোয়াইপ করুন।"}</p>}
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

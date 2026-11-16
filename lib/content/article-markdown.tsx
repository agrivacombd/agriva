import type { ReactNode } from "react";
type Block={kind:"p"|"h2"|"h3"|"ul"|"ol"|"quote"; lines:string[]};
/** React elements only: no HTML injection, and no javascript: hyperlinks. */
function safeUrl(link:string):string|null{
  if(link.startsWith("/")&&!link.startsWith("//")&&!link.includes("\\"))return link;
  try{const url=new URL(link);return url.protocol==="https:"||url.protocol==="http:"?url.href:null;}catch{return null;}
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
export function parseArticleMarkdown(body:string):Block[]{
  const blocks:Block[]=[];let paragraph:string[]=[];let current:Block|null=null;
  const flush=()=>{if(paragraph.length)blocks.push({kind:"p",lines:[paragraph.join(" ")]});paragraph=[];};
  for(const raw of body.replace(/\r\n/g,"\n").split("\n")){
    const s=raw.trim();
    if(!s){flush();current=null;continue;}
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
export function ArticleMarkdown({body}:{body:string}){
  return <div className="space-y-4 break-words text-[15px] leading-8 text-slate-700 sm:text-base">
    {parseArticleMarkdown(body).map((block,i)=>{
      if(block.kind==="h2")return <h2 key={i} className="scroll-mt-24 border-b border-slate-100 pb-2 pt-5 text-xl font-black leading-snug text-[#173b2d] sm:text-2xl">{inline(block.lines[0])}</h2>;
      if(block.kind==="h3")return <h3 key={i} className="scroll-mt-24 pt-2 text-lg font-extrabold leading-snug text-[#173b2d]">{inline(block.lines[0])}</h3>;
      if(block.kind==="ul")return <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ul>;
      if(block.kind==="ol")return <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:text-emerald-700">{block.lines.map((line,j)=><li key={j}>{inline(line)}</li>)}</ol>;
      if(block.kind==="quote")return <blockquote key={i} className="border-l-4 border-emerald-300 bg-emerald-50 px-4 py-3 italic">{inline(block.lines[0])}</blockquote>;
      return <p key={i}>{inline(block.lines[0])}</p>;
    })}
  </div>;
}

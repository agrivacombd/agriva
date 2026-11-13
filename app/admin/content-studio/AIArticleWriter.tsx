"use client";
import { useState, type FormEvent } from "react";
export default function AIArticleWriter(){
 const [keyword,setKeyword]=useState("");const [language,setLanguage]=useState("Bengali");
 const [article,setArticle]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 async function generate(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(loading)return;setLoading(true);setError("");setArticle("");
  try{const response=await fetch("/api/admin/ai-article",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword,language})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Generation failed");
   setArticle(data.article||"");
  }catch(err){setError(err instanceof Error?err.message:"Generation failed");}finally{setLoading(false);}
 }
 return <section className="mt-9 rounded-3xl border border-[#dce8d8] bg-white p-6 shadow-sm sm:p-8">
  <p className="text-xs font-bold uppercase tracking-widest text-[#a47a20]">Gemini · Admin only</p>
  <h2 className="mt-2 text-2xl font-black">AI Agriculture Article Writer</h2>
  <p className="mt-2 text-sm text-[#647468]">Generate an editable Bengali or English Markdown draft. Verify crop recommendations before publishing. No automatic publishing or database saving.</p>
  <form onSubmit={generate} className="mt-5 flex flex-wrap items-end gap-3">
   <label className="min-w-[220px] flex-1 text-sm font-semibold">Article keyword<input required maxLength={160} value={keyword} onChange={e=>setKeyword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" placeholder="যেমন: টমেটো চাষ পদ্ধতি"/></label>
   <label className="text-sm font-semibold">Language<select value={language} onChange={e=>setLanguage(e.target.value)} className="mt-2 block rounded-xl border px-4 py-3"><option value="Bengali">বাংলা</option><option value="English">English</option></select></label>
   <button disabled={loading} className="rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">{loading?"Writing…":"Generate AI draft"}</button>
  </form>
  {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  {article&&<div className="mt-6"><p className="mb-2 text-sm font-bold">Unpublished AI draft · Review required</p><textarea aria-label="Edit generated article" className="min-h-[420px] w-full rounded-xl border p-4 text-sm leading-7" value={article} onChange={e=>setArticle(e.target.value)}/><button type="button" className="mt-3 rounded-xl border px-4 py-2 text-sm font-bold" onClick={()=>navigator.clipboard.writeText(article).catch(()=>setError("Copy failed"))}>Copy edited draft</button></div>}
 </section>;
}

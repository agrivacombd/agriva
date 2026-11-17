"use client";

import { useState } from "react";
import { Share2, Link2 } from "lucide-react";

export default function PlantProductShare({ name }: { name: string }) {
  const [message,setMessage] = useState("");
  async function share() {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, url });
        setMessage("");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("পণ্যের লিংক কপি হয়েছে।");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("লিংক কপি করতে ব্রাউজারের Share বা Address Bar ব্যবহার করুন।");
    }
  }
  return <div className="mt-4 flex flex-wrap items-center gap-3">
    <button type="button" onClick={()=>void share()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50"><Share2 size={16}/>পণ্য শেয়ার করুন <Link2 size={14}/></button>
    {message && <span role="status" className="text-xs font-semibold text-emerald-800">{message}</span>}
  </div>;
}

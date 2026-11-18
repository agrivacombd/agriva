"use client";

import { useState, type ReactNode } from "react";

export function ReadingPreferences({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra">("normal");
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div>
      <div className="mb-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm min-[380px]:px-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-slate-800">পড়ার সুবিধা</span>
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-[auto_minmax(0,1fr)] sm:flex sm:flex-wrap sm:items-center">
          <div role="group" aria-label="লেখার ফন্টের আকার" className="grid min-w-0 grid-cols-3 items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button type="button" aria-pressed={fontSize === "normal"} onClick={() => setFontSize("normal")} className={`min-h-11 min-w-0 rounded-lg px-2 sm:px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${fontSize === "normal" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600"}`}>A</button>
            <button type="button" aria-pressed={fontSize === "large"} onClick={() => setFontSize("large")} className={`min-h-11 min-w-0 rounded-lg px-2 sm:px-3 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${fontSize === "large" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600"}`}>A+</button>
            <button type="button" aria-pressed={fontSize === "extra"} onClick={() => setFontSize("extra")} className={`min-h-11 min-w-0 rounded-lg px-2 sm:px-3 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${fontSize === "extra" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600"}`}>A++</button>
          </div>
          <button type="button" aria-pressed={focusMode} onClick={() => setFocusMode(value => !value)} className={`min-h-11 min-w-0 rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${focusMode ? "border-emerald-700 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{focusMode ? "স্বাভাবিক মোড" : "ফোকাস মোড"}</button>
        </div>
      </div>
      <div className={`min-w-0 ${focusMode ? "rounded-2xl bg-[#fffdf7] ring-1 ring-amber-100 [&_section]:!bg-[#fffdf7]" : ""} ${fontSize === "large" ? "[&_p]:!text-[18px] [&_li]:!text-[18px]" : fontSize === "extra" ? "[&_p]:!text-[20px] [&_li]:!text-[20px]" : ""}`}>
        {children}
      </div>
    </div>
  );
}

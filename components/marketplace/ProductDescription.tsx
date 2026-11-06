"use client";

import { useMemo, useState } from "react";

type ProductDescriptionProps = { html: string };

function normalizeDescription(input: string) {
  const cleaned = input
    // Legacy descriptions often use repeated <br> tags as visual spacing.
    // Collapse every run into a single natural space; keep real paragraphs/lists.
    .replace(/(?:\s*<br\s*\/?\s*>\s*)+/gi, " ")
    .replace(/[\t\r\n ]{2,}/g, " ")
    .trim();

  if (/<(p|h2|h3|ul|ol|blockquote)\b/i.test(cleaned)) return cleaned;
  return cleaned ? "<p>" + cleaned + "</p>" : "";
}

export default function ProductDescription({ html }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const normalized = useMemo(() => normalizeDescription(html), [html]);
  const isLong = normalized.replace(/<[^>]+>/g, "").length > 1800;

  return (
    <section aria-labelledby="description-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-4 py-4 sm:px-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-emerald-700">PRODUCT OVERVIEW</p>
        <h3 id="description-heading" className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">পণ্যের বিবরণ</h3>
        <p className="mt-1 text-sm text-slate-500">পণ্য সম্পর্কে প্রয়োজনীয় তথ্য সহজে পড়ুন</p>
      </div>
      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div
          className="product-description-content break-words text-[15px] leading-[1.9] text-slate-700 sm:text-base sm:leading-[1.9] [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_a]:font-semibold [&_a]:text-emerald-800 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-4 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400 [&_blockquote]:bg-emerald-50 [&_blockquote]:px-4 [&_blockquote]:py-3"
          dangerouslySetInnerHTML={{ __html: normalized }}
          style={isLong && !expanded ? { maxHeight: 560, overflow: "hidden" } : undefined}
        />
        {isLong && !expanded && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-14 h-20 bg-gradient-to-t from-white to-transparent" />}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-800/20 bg-emerald-50 px-4 py-2.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {expanded ? "সংক্ষিপ্ত দেখুন" : "সম্পূর্ণ বিবরণ পড়ুন"}
            <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
          </button>
        )}
      </div>
    </section>
  );
}

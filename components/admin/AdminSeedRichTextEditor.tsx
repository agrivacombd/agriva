"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeProductDescription } from "@/lib/marketplace/product-description";

const tools = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "H2", command: "formatBlock", value: "h2", title: "Heading 2" },
  { label: "H3", command: "formatBlock", value: "h3", title: "Heading 3" },
  { label: "• List", command: "insertUnorderedList", title: "Bullet list" },
  { label: "1. List", command: "insertOrderedList", title: "Numbered list" },
  { label: "Quote", command: "formatBlock", value: "blockquote", title: "Quote" },
];

export default function AdminSeedRichTextEditor({
  name,
  value,
  label,
  placeholder,
}: {
  name: string;
  value: string;
  label: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(value || "");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setHtml(value || "");
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, preview]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }

  return (
    <section className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-bold">{label}</label>
        <span className="text-xs text-[#718071]">{html.length.toLocaleString("en-US")} / 250,000 characters</span>
      </div>
      <div className="mt-1.5 overflow-hidden rounded-xl border border-[#cfdccf] bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
        <div className="flex flex-wrap items-center gap-1 border-b bg-[#f7faf6] p-2">
          {tools.map((tool) => <button key={tool.label} type="button" title={tool.title} onMouseDown={(event) => event.preventDefault()} onClick={() => run(tool.command, tool.value)} className="min-h-8 rounded-lg border border-[#e1e9df] bg-white px-2.5 text-xs font-bold text-[#244b32] hover:bg-emerald-50">{tool.label}</button>)}
          <button type="button" onClick={() => setPreview((current) => !current)} className="ml-auto min-h-8 rounded-lg bg-[#e8f2e6] px-3 text-xs font-bold text-[#17452c]">{preview ? "Edit" : "Preview"}</button>
        </div>
        {preview ? (
          <div className="prose prose-sm max-w-none min-h-40 px-4 py-3 text-sm leading-7" dangerouslySetInnerHTML={{ __html: sanitizeProductDescription(html) }} />
        ) : (
          <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true"
            onInput={(event) => setHtml(event.currentTarget.innerHTML)}
            className="prose prose-sm max-w-none min-h-40 px-4 py-3 text-sm leading-7 outline-none [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_h3]:font-bold [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:pl-3"
            data-placeholder={placeholder || "এখানে তথ্য লিখুন..."} />
        )}
      </div>
      <input type="hidden" name={name} value={html} />
    </section>
  );
}

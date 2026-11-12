import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/authz";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Unpublished editorial preview | AGRIVA",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

const draftFiles: Record<string, string> = {
  "mishti-kumra-chash-poddhoti": "001-mishti-kumra-chash-poddhoti.md",
};

function inline(value: string) {
  return value.replace(/\*\*/g, "").replace(/`/g, "");
}

function renderMarkdown(source: string) {
  const lines = source.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let key = 0;
  const flushParagraph = () => {
    if (paragraph.length) elements.push(<p key={key++} className="my-4 leading-8 text-slate-700">{inline(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushBullets = () => {
    if (bullets.length) elements.push(<ul key={key++} className="my-4 list-disc space-y-2 pl-6 text-slate-700">{bullets.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>);
    bullets = [];
  };
  for (const line of lines) {
    const value = line.trim();
    if (!value) { flushParagraph(); flushBullets(); continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(value);
    if (heading) {
      flushParagraph(); flushBullets();
      if (heading[1].length === 1) elements.push(<h1 key={key++} className="mt-8 text-3xl font-bold">{inline(heading[2])}</h1>);
      else if (heading[1].length === 2) elements.push(<h2 key={key++} className="mt-8 text-2xl font-semibold">{inline(heading[2])}</h2>);
      else elements.push(<h3 key={key++} className="mt-6 text-xl font-semibold">{inline(heading[2])}</h3>);
      continue;
    }
    if (value.startsWith("- ")) { flushParagraph(); bullets.push(value.slice(2)); continue; }
    flushBullets();
    paragraph.push(value);
  }
  flushParagraph(); flushBullets();
  return elements;
}

export default async function EditorialDraftPreview({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdminPage("content.read");
  const { slug } = await params;
  const filename = Object.hasOwn(draftFiles, slug) ? draftFiles[slug] : undefined;
  if (!filename) notFound();
  let source: string;
  try {
    source = await readFile(path.join(process.cwd(), "content", "articles", "drafts", filename), "utf8");
  } catch {
    notFound();
  }
  // Draft front matter is editorial-only. Preserve the first body paragraph.
  const articleOnly = source.replace(
    /^(#[^\n]+\n\n)(?:\*\*[^\n]+\n)+\n/,
    "$1",
  );
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>UNPUBLISHED EDITORIAL PREVIEW</strong> — Admin only. Agricultural and SEO review pending.
      </div>
      <nav className="my-6 text-sm"><Link href="/admin/articles" className="text-green-700 underline">← Article dashboard</Link></nav>
      <article className="rounded-2xl border bg-white p-6 shadow-sm md:p-10">{renderMarkdown(articleOnly)}</article>
      <p className="mt-8 text-sm text-slate-500">Hero image not yet uploaded. This preview does not publish or write to Supabase.</p>
    </main>
  );
}

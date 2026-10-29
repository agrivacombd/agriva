import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedContentLandingPageBySlug, type PublishedContentArticle } from "@/lib/content/published-articles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedContentLandingPageBySlug(slug);
  if (!page) return { title: "পেজ পাওয়া যায়নি", robots: { index: false, follow: false } };

  const title = page.meta_title || page.title;
  const description = page.meta_description || page.body_markdown?.replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim().slice(0, 320) || page.title;
  return {
    title,
    description,
    alternates: { canonical: `/landing/${page.slug}` },
    openGraph: { siteName: "AGRIVA", title, description, url: `/landing/${page.slug}`, type: "website", locale: "bn_BD" },
    twitter: { card: "summary", title, description },
  };
}

function renderLandingMarkdown(markdown: string, title: string) {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (/^#\s+/.test(block) && block.slice(2).trim() === title.trim()) return null;
    if (/^###\s+/.test(block)) return <h3 key={index} className="mt-6 text-lg font-black text-slate-900">{block.replace(/^###\s+/, "")}</h3>;
    if (/^##\s+/.test(block)) return <h2 key={index} className="mt-9 border-t border-emerald-100 pt-6 text-xl font-black text-slate-900">{block.replace(/^##\s+/, "")}</h2>;
    if (/^#\s+/.test(block)) return <h2 key={index} className="mt-8 text-2xl font-black text-slate-900">{block.replace(/^#\s+/, "")}</h2>;

    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return <ul key={index} className="mt-4 list-disc space-y-2 pl-6 text-sm leading-8 text-slate-700 sm:text-base">{lines.map((line, itemIndex) => <li key={itemIndex}>{line.replace(/^\s*[-*]\s+/, "")}</li>)}</ul>;
    }
    if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
      return <ol key={index} className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-8 text-slate-700 sm:text-base">{lines.map((line, itemIndex) => <li key={itemIndex}>{line.replace(/^\s*\d+\.\s+/, "")}</li>)}</ol>;
    }
    return <p key={index} className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-700 sm:text-base">{block}</p>;
  });
}

function LandingPageContent({ page }: { page: PublishedContentArticle }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/landing/${page.slug}`;
  const description = page.meta_description || page.body_markdown?.replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim().slice(0, 320) || page.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description,
    url: pageUrl,
    dateModified: page.updated_at,
    inLanguage: "bn-BD",
    isPartOf: { "@type": "WebSite", name: "AGRIVA", url: siteUrl },
    publisher: { "@type": "Organization", name: "AGRIVA", url: siteUrl },
  };

  return (
    <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-800">হোম</Link><span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-slate-700">{page.title}</span>
        </nav>
        <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-sm sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-800">AGRIVA · SEO Landing Page</p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{page.title}</h1>
          {description && <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{description}</p>}
        </header>
        <article className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
          {renderLandingMarkdown(page.body_markdown || description, page.title)}
          <div className="mt-10 rounded-2xl bg-emerald-950 p-5 text-white sm:p-7">
            <h2 className="text-xl font-black">AGRIVA Marketplace দেখুন</h2>
            <p className="mt-2 text-sm leading-7 text-emerald-50">পণ্যের বর্তমান মূল্য, স্টক ও বিবরণ যাচাই করে উপযুক্ত বিকল্প খুঁজুন।</p>
            <Link href="/marketplace" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-50">মার্কেটপ্লেসে যান →</Link>
          </div>
        </article>
      </div>
    </main>
  );
}

export default async function PublishedLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedContentLandingPageBySlug(slug);
  if (!page) notFound();
  return <LandingPageContent page={page} />;
}

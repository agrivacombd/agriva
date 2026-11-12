import Link from "next/link";
import ProductDescription from "@/components/marketplace/ProductDescription";

type SeedContentSection = {
  id: string;
  title: string;
  summary: string;
  content_html?: string;
};

type SeedCropGuide = {
  id: string;
  crop_name: string;
  summary: string;
  content_html?: string;
};

type SeedDetails = {
  variety_name: string;
  germination_rate: number | null;
  purity_rate: number | null;
  seed_treatment: string;
  special_warnings: string;
  seed_crop_guides: SeedCropGuide | SeedCropGuide[] | null;
};

function Field({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return <div className="grid gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-4"><dt className="text-sm font-bold text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{value}</dd></div>;
}

export default function SeedProductInformation({
  sections,
  guides = [],
  details = null,
  mode = "summary",
}: {
  sections: SeedContentSection[];
  guides?: SeedCropGuide[];
  details?: SeedDetails | null;
  mode?: "summary" | "full";
}) {
  const guideValue = details?.seed_crop_guides;
  const assignedGuide = Array.isArray(guideValue) ? guideValue[0] : guideValue;
  const hasProductFacts = Boolean(details && (
    details.variety_name || details.germination_rate !== null || details.purity_rate !== null ||
    details.seed_treatment || details.special_warnings
  ));
  const hasContent = sections.length > 0 || guides.length > 0 || assignedGuide || hasProductFacts;
  if (!hasContent) return null;

  if (mode === "full") {
    return (
      <section id="seed-guides" aria-labelledby="seed-information-title" className="mt-10 space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-[#103f2b] to-[#24734a] p-6 text-white sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-100">AGRIVA Seed Knowledge Centre</p>
          <h2 id="seed-information-title" className="mt-2 text-2xl font-black sm:text-3xl">বীজ সংরক্ষণ ও চাষাবাদ নির্দেশিকা</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/90">সাধারণ বীজ ব্যবস্থাপনা ও ফসলভিত্তিক নির্দেশনা। নির্দিষ্ট পণ্যের প্যাকেট/প্রস্তুতকারকের নির্দেশনা সবসময় অগ্রাধিকার পাবে।</p>
        </header>
        {sections.map((section) => (
          <article key={section.id} className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
            <h3 className="text-xl font-black">{section.title}</h3>
            {section.content_html && <div className="mt-3"><ProductDescription html={section.content_html} /></div>}
          </article>
        ))}
        {guides.map((guide) => (
          <article key={guide.id} id={`crop-${guide.id}`} className="scroll-mt-24 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
            <h3 className="text-xl font-black">{guide.crop_name} চাষাবাদ পদ্ধতি</h3>
            {guide.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{guide.summary}</p>}
            {guide.content_html && <div className="mt-4"><ProductDescription html={guide.content_html} /></div>}
          </article>
        ))}
      </section>
    );
  }

  return (
    <section aria-labelledby="seed-product-information-title" className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Seed knowledge centre</p>
        <h2 id="seed-product-information-title" className="mt-2 text-2xl font-black">বীজের নির্দিষ্ট তথ্য ও নির্দেশনা</h2>
      </div>
      {hasProductFacts && details && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-5">
          <h3 className="text-lg font-black">এই বীজের নির্দিষ্ট তথ্য</h3>
          <dl className="mt-3 divide-y divide-slate-100">
            <Field label="জাত / Variety" value={details.variety_name} />
            <Field label="অঙ্কুরোদগম" value={details.germination_rate === null ? "" : details.germination_rate + "%"} />
            <Field label="বিশুদ্ধতা" value={details.purity_rate === null ? "" : details.purity_rate + "%"} />
            <Field label="বীজ শোধন" value={details.seed_treatment} />
          </dl>
          {details.special_warnings && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><h4 className="font-extrabold text-amber-950">বিশেষ সতর্কতা</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">{details.special_warnings}</p></div>}
        </div>
      )}
      {assignedGuide && (
        <article className="rounded-2xl border border-emerald-100 bg-white p-5">
          <h3 className="text-lg font-black">{assignedGuide.crop_name} চাষাবাদ নির্দেশনা</h3>
          {assignedGuide.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{assignedGuide.summary}</p>}
          <Link href="/marketplace/category/seeds#seed-guides" className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-emerald-800 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">পূর্ণ চাষাবাদ গাইড দেখুন →</Link>
        </article>
      )}
      {sections.filter((section) => section.summary.trim()).length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-5">
          <h3 className="text-lg font-black">সাধারণ বীজ ব্যবস্থাপনা</h3>
          <div className="mt-3 space-y-3">{sections.filter((section) => section.summary.trim()).map((section) => <div key={section.id}><h4 className="font-bold">{section.title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{section.summary}</p></div>)}</div>
          <Link href="/marketplace/category/seeds#seed-guides" className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-emerald-800 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">সব বীজ নির্দেশনা দেখুন →</Link>
        </div>
      )}
    </section>
  );
}

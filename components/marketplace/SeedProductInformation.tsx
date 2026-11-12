import ProductDescription from "@/components/marketplace/ProductDescription";

type SeedContentSection = {
  id: string;
  title: string;
  content_html: string;
};

type SeedCropGuide = {
  id: string;
  crop_name: string;
  summary: string;
  content_html: string;
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
  details,
}: {
  sections: SeedContentSection[];
  details: SeedDetails | null;
}) {
  const guideValue = details?.seed_crop_guides;
  const guide = Array.isArray(guideValue) ? guideValue[0] : guideValue;
  const hasProductFacts = Boolean(details && (
    details.variety_name || details.germination_rate !== null || details.purity_rate !== null ||
    details.seed_treatment || details.special_warnings
  ));

  if (!sections.length && !guide && !hasProductFacts) return null;

  return (
    <section aria-labelledby="seed-information-title" className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-700">Seed knowledge centre</p>
        <h2 id="seed-information-title" className="mt-2 text-2xl font-black">বীজের ব্যবহার ও চাষাবাদ নির্দেশনা</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">এই তথ্য বীজের ক্যাটাগরি ও নির্দিষ্ট পণ্যের জন্য প্রযোজ্য তথ্য থেকে সাজানো হয়েছে। প্যাকেটের নির্দেশনা অগ্রাধিকার দিন।</p>
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

      {guide && (
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
          <h3 className="text-xl font-black">{guide.crop_name} চাষাবাদ পদ্ধতি</h3>
          {guide.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{guide.summary}</p>}
          {guide.content_html && <div className="mt-4"><ProductDescription html={guide.content_html} /></div>}
        </article>
      )}

      {sections.map((section) => (
        <article key={section.id} className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-black">{section.title}</h3>
          {section.content_html && <div className="mt-3"><ProductDescription html={section.content_html} /></div>}
        </article>
      ))}
    </section>
  );
}

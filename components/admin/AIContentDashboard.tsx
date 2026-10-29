import Link from "next/link";

const workflows = [
  {
    href: "/admin/search-intelligence",
    label: "Live Search Intelligence",
    description: "Review real, database-backed content opportunities. Approve or reject an opportunity, then create a saved draft.",
    action: "Review opportunities",
  },
  {
    href: "/admin/content-drafts",
    label: "SEO Content Drafts",
    description: "Search saved drafts, filter by workflow status and content type, inspect revision history, and use the existing review/publish workflow.",
    action: "Open saved drafts",
  },
  {
    href: "/admin/articles",
    label: "Legacy Article Drafts",
    description: "Review articles saved by the earlier editorial workflow. These records are separate from the newer SEO Content Drafts table.",
    action: "Review legacy articles",
  },
  {
    href: "/admin/opportunities",
    label: "Demand Opportunities",
    description: "Inspect the canonical opportunity queue and its recorded search-demand signals.",
    action: "View demand data",
  },
];

export default function AIContentDashboard() {
  return (
    <div className="mt-8">
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-6">
        <p className="text-xs font-black uppercase tracking-[.16em] text-amber-900">Prototype boundary</p>
        <h2 className="mt-2 text-xl font-black text-amber-950">AI generation is not connected to a persistent generation service here</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950">
          This page no longer creates fake local-only drafts or lets a demo item be marked Published. Use the saved workflows below; their records are backed by the database and publishing remains a separate, reviewed action. No AI-generated content is invented or published from this screen.
        </p>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <article key={workflow.href} className="flex flex-col rounded-3xl border border-[#dfe8dc] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">{workflow.label}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#647468]">{workflow.description}</p>
            <Link href={workflow.href} className="mt-5 inline-flex w-fit rounded-xl bg-[#17351f] px-4 py-3 text-sm font-bold text-white">
              {workflow.action} ↗
            </Link>
          </article>
        ))}
      </section>
      <p className="mt-5 text-xs leading-5 text-[#647468]">
        Draft systems are intentionally shown separately until their records are migrated to one canonical schema. Search activity and AI-generated suggestions must be factual, source-checked, and reviewed by an admin before publication.
      </p>
    </div>
  );
}

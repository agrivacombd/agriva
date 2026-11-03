import Link from "next/link";

type AdminModule = {
  number: string;
  title: string;
  links: { label: string; href: string }[];
  planned?: string[];
};

const modules: AdminModule[] = [
  { number: "01", title: "Dashboard", links: [{ label: "Overview", href: "/admin" }] },
  { number: "02", title: "Website & CMS", links: [{ label: "Articles / Blog", href: "/admin/articles" }], planned: ["Pages", "Categories & Tags", "Homepage Builder", "Navigation & Footer", "Media Library"] },
  { number: "03", title: "Marketplace", links: [{ label: "Product Editor", href: "/admin/products" }], planned: ["All Products", "Seller Submissions", "Categories", "Inventory", "Product Reviews"] },
  { number: "04", title: "Plant Market", links: [{ label: "Seller Submissions", href: "/admin/plant-market-products" }], planned: ["All Plant Products", "Plant Product Editor", "Plant Categories", "Inventory"] },
  { number: "05", title: "Sellers & Customers", links: [{ label: "Customers & Sellers", href: "/admin/users" }, { label: "Verification", href: "/admin/identity-verification" }], planned: ["Reports"] },
  { number: "06", title: "Orders & Finance", links: [{ label: "Orders", href: "/admin/orders" }], planned: ["Payments", "Refunds", "Commissions", "Payouts"] },
  { number: "07", title: "Agriculture & Services", links: [{ label: "Jobs", href: "/admin/jobs" }], planned: ["Farms & Crops", "Crop Disease", "Weather", "Market Prices", "Calculators", "Transport", "CV Management"] },
  { number: "08", title: "Green Living", links: [{ label: "Green Exchange", href: "/admin/green-exchange" }], planned: ["Green Impact"] },
  { number: "09", title: "AI Management", links: [], planned: ["AI Assistant", "Prompts", "Models & Providers", "Usage & Costs"] },
  { number: "10", title: "SEO & Marketing", links: [], planned: ["SEO Settings", "Redirect Manager", "Sitemap", "SEO Audit"] },
  { number: "11", title: "System & Security", links: [], planned: ["Users & Roles", "Permissions", "Audit Logs", "Site Settings", "System Health"] },
];

export default function AdminControlCenterNav() {
  return (
    <nav aria-label="AGRIVA Admin modules" className="border-b border-[#dce7d8] bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#a47b20]">AGRIVA CONTROL CENTER</p>
            <p className="mt-1 text-sm font-semibold text-[#17351f]">Module navigation</p>
          </div>
          <p className="text-xs text-[#718071]">Planned items are shown without links until their workflows are implemented.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <section key={module.number} aria-labelledby={`admin-module-${module.number}`} className="rounded-xl border border-[#e4ebe1] bg-[#fbfcfa] p-3">
              <h2 id={`admin-module-${module.number}`} className="flex items-center gap-2 text-sm font-extrabold text-[#17351f]">
                <span className="text-xs font-black text-[#a47b20]">{module.number}</span>
                {module.title}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {module.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="inline-flex rounded-lg bg-[#eaf2e6] px-2.5 py-1.5 text-xs font-bold text-[#17452c] transition hover:bg-[#dcebd5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17452c]">
                      {item.label}
                    </Link>
                  </li>
                ))}
                {module.planned?.map((item) => (
                  <li key={item} className="rounded-lg border border-dashed border-[#dce4d8] px-2.5 py-1.5 text-xs text-[#8a9689]">
                    {item} · Planned
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </nav>
  );
}

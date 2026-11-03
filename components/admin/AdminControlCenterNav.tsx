import { getAvailableAdminCapabilities, type AdminCapability } from "@/lib/admin/authz";
import AdminControlCenterShell, { type AdminShellModule } from "@/components/admin/AdminControlCenterShell";

type AdminModule = AdminShellModule & { capabilities: AdminCapability[] };

const modules: AdminModule[] = [
  { id: "dashboard", title: "Dashboard", icon: "dashboard", links: [{ label: "Overview", href: "/admin" }], capabilities: ["dashboard.read"] },
  { id: "cms", title: "Website & CMS", icon: "cms", links: [{ label: "Articles & Blog", href: "/admin/articles" }], planned: ["Pages", "Homepage builder", "Navigation & footer", "Media library"], capabilities: ["content.read"] },
  { id: "marketplace", title: "Marketplace", icon: "marketplace", links: [{ label: "Overview", href: "/admin/marketplace" }, { label: "Products & editor", href: "/admin/products" }, { label: "Categories", href: "/admin/categories" }, { label: "Seller applications", href: "/admin/seller-applications" }], planned: ["Slug redirects", "Admin image upload", "Bulk inventory"], capabilities: ["catalog.read"] },
  { id: "plant", title: "Plant Market", icon: "plant", links: [{ label: "Moderation queue", href: "/admin/plant-market-products" }], planned: ["Dedicated editor", "Plant SEO", "Inventory"], capabilities: ["catalog.moderate"] },
  { id: "people", title: "Sellers & Customers", icon: "people", links: [{ label: "Customers & sellers", href: "/admin/users" }, { label: "Identity verification", href: "/admin/identity-verification" }], planned: ["Customer support", "Seller reports"], capabilities: ["users.read", "identity.review"] },
  { id: "orders", title: "Orders & Finance", icon: "orders", links: [{ label: "Orders", href: "/admin/orders" }, { label: "COD & payouts", href: "/admin" }], planned: ["Refunds", "Finance reconciliation"], capabilities: ["orders.read"] },
  { id: "agriculture", title: "Agriculture & Services", icon: "agriculture", links: [{ label: "Jobs", href: "/admin/jobs" }, { label: "Harvest listings", href: "/admin/harvest" }, { label: "Transport", href: "/admin/transport" }], planned: ["Farms & crops", "Crop disease", "Market prices"], capabilities: ["jobs.read", "harvest.read", "transport.read"] },
  { id: "green", title: "Green Living", icon: "green", links: [{ label: "Green Exchange", href: "/admin/green-exchange" }], planned: ["Green Impact analytics"], capabilities: ["settings.read"] },
  { id: "ai", title: "AI Management", icon: "ai", links: [{ label: "AI content", href: "/admin/ai-content" }, { label: "Search intelligence", href: "/admin/search-intelligence" }, { label: "Demand opportunities", href: "/admin/opportunities" }], planned: ["Provider settings", "Usage & costs"], capabilities: ["content.read"] },
  { id: "marketing", title: "SEO & Marketing", icon: "marketing", links: [{ label: "Content studio", href: "/admin/content-studio" }, { label: "Content drafts", href: "/admin/content-drafts" }, { label: "Reports", href: "/admin/reports" }], planned: ["Redirect manager", "SEO audit", "Campaigns"], capabilities: ["content.read", "reports.export"] },
  { id: "security", title: "System & Security", icon: "security", links: [{ label: "Audit log", href: "/admin/audit" }, { label: "Settings", href: "/admin/settings" }], planned: ["Role management", "Permission editor", "System health"], capabilities: ["audit.read", "settings.read"] },
];

export default async function AdminControlCenterNav({ children }: { children: React.ReactNode }) {
  const requested = [...new Set(modules.flatMap((module) => module.capabilities))];
  const available = new Set(await getAvailableAdminCapabilities(requested));
  const visibleModules: AdminShellModule[] = modules.map(({ capabilities, ...module }) => ({
    ...module,
    links: module.links.filter(() => capabilities.some((capability) => available.has(capability))),
  })).filter((module) => module.links.length > 0 || Boolean(module.planned?.length));
  return <AdminControlCenterShell modules={visibleModules}>{children}</AdminControlCenterShell>;
}

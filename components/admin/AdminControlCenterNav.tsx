import { getAvailableAdminCapabilities, type AdminCapability } from "@/lib/admin/authz";
import AdminControlCenterShell, { type AdminShellModule } from "@/components/admin/AdminControlCenterShell";

type AdminModule = AdminShellModule & { capabilities: AdminCapability[] };

const modules: AdminModule[] = [
  { id: "dashboard", title: "Command Center", icon: "dashboard", links: [{ label: "Operational overview", href: "/admin", capability: "dashboard.read" }], capabilities: ["dashboard.read"] },
  { id: "marketplace", title: "Marketplace", icon: "marketplace", links: [{ label: "Overview", href: "/admin/marketplace", capability: "catalog.read" }, { label: "Products & editor", href: "/admin/products", capability: "catalog.read" }, { label: "Categories", href: "/admin/categories", capability: "catalog.edit" }, { label: "Seller applications", href: "/admin/seller-applications", capability: "identity.review" }], planned: ["Product SEO controls", "Admin image upload", "Bulk inventory"], capabilities: ["catalog.read", "catalog.edit", "identity.review"] },
  { id: "plant", title: "Plant Market", icon: "plant", links: [{ label: "Plant catalogue", href: "/admin/plant-market", capability: "catalog.edit" }, { label: "Moderation queue", href: "/admin/plant-market-products", capability: "catalog.moderate" }], planned: ["Plant care knowledge base", "Plant SEO", "Inventory insights"], capabilities: ["catalog.edit", "catalog.moderate"] },
  { id: "orders", title: "Orders & Finance", icon: "orders", links: [{ label: "Orders & delivery", href: "/admin/orders", capability: "orders.read" }], planned: ["COD collection & reconciliation", "Commissions", "Payouts", "Refunds"], capabilities: ["orders.read"] },
  { id: "people", title: "People & Trust", icon: "people", links: [{ label: "Customers & sellers", href: "/admin/users", capability: "users.read" }, { label: "Identity verification", href: "/admin/identity-verification", capability: "identity.review" }], planned: ["Customer support", "Seller trust & reports", "Access review"], capabilities: ["users.read", "roles.grant", "identity.review"] },
  { id: "agriculture", title: "Agriculture & Services", icon: "agriculture", links: [{ label: "Jobs", href: "/admin/jobs", capability: "jobs.moderate" }, { label: "Harvest listings", href: "/admin/harvest", capability: "harvest.read" }, { label: "Transport", href: "/admin/transport", capability: "transport.moderate" }, { label: "Green Exchange", href: "/admin/green-exchange", capability: "settings.read" }], planned: ["Farms & crops", "Crop disease & advisory", "Market prices", "Green Exchange insights"], capabilities: ["jobs.moderate", "harvest.read", "transport.moderate", "settings.read"] },
  { id: "marketing", title: "Growth, SEO & Analytics", icon: "marketing", links: [{ label: "Search intelligence", href: "/admin/search-intelligence", capability: "content.read" }, { label: "Content studio", href: "/admin/content-studio", capability: "content.read" }, { label: "Articles & blog", href: "/admin/articles", capability: "content.read" }, { label: "Content drafts", href: "/admin/content-drafts", capability: "content.read" }, { label: "Reports & analytics", href: "/admin/reports", capability: "reports.export" }], planned: ["Technical SEO audit", "Redirect manager", "Campaigns", "AI content prototype (not persisted)"], capabilities: ["content.read", "reports.export"] },
  { id: "security", title: "System & Security", icon: "security", links: [{ label: "Audit log", href: "/admin/audit", capability: "audit.read" }, { label: "Settings & integrations", href: "/admin/settings", capability: "settings.read" }], planned: ["Role management", "Permission editor", "System health & integrations"], capabilities: ["audit.read", "settings.write"] },
];

export default async function AdminControlCenterNav({ children }: { children: React.ReactNode }) {
  const requested = [...new Set(modules.flatMap((module) => module.capabilities))];
  const available = new Set<string>(await getAvailableAdminCapabilities(requested));
  const visibleModules: AdminShellModule[] = modules.map(({ capabilities, ...module }) => ({
    ...module,
    links: module.links.filter((link) => available.has(link.capability ?? capabilities[0])),
  })).filter((module) => module.links.length > 0 || Boolean(module.planned?.length));
  return <AdminControlCenterShell modules={visibleModules}>{children}</AdminControlCenterShell>;
}

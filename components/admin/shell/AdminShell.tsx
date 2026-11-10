"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, ArrowUpRight, Banknote, BookOpen, Boxes, BriefcaseBusiness,
  ClipboardCheck, FileText, FlaskConical, FolderKanban, Handshake,
  LayoutDashboard, Leaf, Menu, Package, Search, Settings, ShieldCheck,
  ShoppingCart, Sprout, Truck, Users, Wallet, X, ChevronRight,
  type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Module directory", href: "/super-admin", icon: Boxes },
  ]},
  { label: "Marketplace", items: [
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderKanban },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Harvest", href: "/admin/harvest", icon: Sprout },
    { label: "Plant Market", href: "/admin/plant-market-products", icon: Leaf },
    { label: "Green Exchange", href: "/admin/green-exchange", icon: Leaf },
  ]},
  { label: "People & operations", items: [
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Identity verification", href: "/admin/identity-verification", icon: ShieldCheck },
    { label: "Seller applications", href: "/admin/seller-applications", icon: ClipboardCheck },
    { label: "Transport", href: "/admin/transport", icon: Truck },
    { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  ]},
  { label: "Finance", items: [
    { label: "Finance overview", href: "/admin/finance", icon: Wallet },
    { label: "Reports", href: "/admin/reports", icon: Banknote },
  ]},
  { label: "Content & growth", items: [
    { label: "Articles", href: "/admin/articles", icon: BookOpen },
    { label: "Content Studio", href: "/admin/content-studio", icon: FlaskConical },
    { label: "AI Content", href: "/admin/ai-content", icon: Activity },
    { label: "Content drafts", href: "/admin/content-drafts", icon: FileText },
    { label: "SEO pages", href: "/admin/seo-pages", icon: Search },
    { label: "Search intelligence", href: "/admin/search-intelligence", icon: Search },
    { label: "Opportunities", href: "/admin/opportunities", icon: Handshake },
  ]},
  { label: "System & governance", items: [
    { label: "Access control", href: "/admin/access-control", icon: ShieldCheck },
    { label: "Audit log", href: "/admin/audit", icon: ClipboardCheck },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]},
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({ onNavigate, pathname, compact = false }: { onNavigate?: () => void; pathname: string; compact?: boolean }) {
  return (
    <nav aria-label="Admin navigation" className="space-y-6">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/55 xl:text-[11px] ${compact ? "hidden xl:block" : ""}`}>{group.label}</h2>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={item.label}
                    className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${active ? "bg-lime-300 text-[#173b2d] shadow-sm" : "text-emerald-50/85 hover:bg-white/10 hover:text-white"}`}>
                    <Icon aria-hidden="true" size={18} className="shrink-0" />
                    <span className={compact ? "hidden min-w-0 flex-1 truncate xl:block" : "min-w-0 flex-1 truncate"}>{item.label}</span>
                    {active && <ChevronRight aria-hidden="true" size={15} className="hidden xl:block" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export default function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentItem = groups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));
  const pageTitle = currentItem?.label ?? "Admin workspace";

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-[#173b2d]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-white/10 bg-[#123b2d] text-white lg:flex xl:w-[264px]">
        <Link href="/admin" className="flex h-[76px] items-center justify-center border-b border-white/10 px-4 xl:justify-start xl:px-6" aria-label="AGRIVA Admin home">
          <span className="text-xl font-black tracking-[0.14em] text-white">AG<span className="text-lime-300">R</span>IVA</span>
          <span className="ml-2 hidden text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/65 xl:block">Admin</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-5 xl:px-3"><Navigation pathname={pathname} compact /></div>
        <div className="border-t border-white/10 p-3">
          <Link href="/dashboard" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-emerald-50/80 hover:bg-white/10 hover:text-white xl:justify-start xl:text-sm">
            <ArrowUpRight size={17} /><span className="hidden xl:inline">User dashboard</span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[76px] xl:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e2e9df] bg-white/95 backdrop-blur">
          <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open admin navigation" aria-expanded={drawerOpen}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e0e8dd] text-[#17452f] hover:bg-[#f1f6ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 lg:hidden">
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-[#829084] sm:block">AGRIVA / ADMIN</p>
                <h1 className="truncate text-sm font-bold text-[#173b2d] sm:mt-0.5 sm:text-base">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/dashboard" className="hidden min-h-10 items-center gap-2 rounded-xl border border-[#e0e8dd] px-3 text-xs font-semibold text-[#365747] hover:bg-[#f4f7f2] sm:inline-flex">User dashboard <ArrowUpRight size={14} /></Link>
              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#f2f6ef] px-2.5 py-2 sm:px-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dcebd8] text-xs font-black text-[#17452f]">{adminName.trim().charAt(0).toUpperCase() || "A"}</span>
                <span className="hidden max-w-36 truncate text-xs font-semibold text-[#365747] sm:block">{adminName}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-68px)] min-w-0">{children}</div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-[#0b2118]/60" />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-[#123b2d] text-white shadow-2xl">
            <div className="flex h-[68px] items-center justify-between border-b border-white/10 px-5">
              <Link href="/admin" onClick={() => setDrawerOpen(false)} className="text-xl font-black tracking-[0.14em]">AG<span className="text-lime-300">R</span>IVA <span className="text-xs font-bold tracking-normal text-emerald-100/70">Admin</span></Link>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5"><Navigation pathname={pathname} onNavigate={() => setDrawerOpen(false)} /></div>
            <div className="border-t border-white/10 p-4">
              <p className="truncate text-xs font-semibold text-emerald-100/75">{adminName}</p>
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="mt-2 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white hover:bg-white/10"><ArrowUpRight size={17} /> User dashboard</Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

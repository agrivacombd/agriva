"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import OrderNotificationBell from "./OrderNotificationBell";
import SignOutButton from "@/components/SignOutButton";
import {
  Activity, ArrowUpRight, Banknote, BookOpen, Boxes, BriefcaseBusiness,
  ClipboardCheck, FileText, FlaskConical, FolderKanban, Handshake,
  LayoutDashboard, Leaf, Menu, Package, Search, Settings, ShieldCheck,
  ShoppingCart, Sprout, TrendingUp, Truck, Users, Wallet, X, ChevronRight,
  type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Command Center", href: "/admin/command-center", icon: Activity },
    { label: "Demand & RFQ", href: "/admin/demand-intelligence", icon: Handshake },
    { label: "Module directory", href: "/super-admin", icon: Boxes },
  ]},
  { label: "Marketplace", items: [
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderKanban },
    { label: "Seed information", href: "/admin/seed-information", icon: Sprout },
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
    { label: "Growth Intelligence", href: "/admin/growth-intelligence", icon: TrendingUp },
    { label: "SEO Dashboard", href: "/admin/seo", icon: Search },
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

function Navigation({ onNavigate, pathname, query }: { onNavigate?: () => void; pathname: string; query: string }) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !normalizedQuery || item.label.toLocaleLowerCase().includes(normalizedQuery) || group.label.toLocaleLowerCase().includes(normalizedQuery)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Admin navigation" className="space-y-6">
      {visibleGroups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-100/45">{group.label}</h2>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={item.label}
                    className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${active ? "bg-lime-300 text-[#173b2d] shadow-[0_5px_18px_rgba(190,242,100,0.12)]" : "text-emerald-50/75 hover:bg-white/[0.08] hover:text-white"}`}>
                    {active && <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#173b2d]" />}
                    <Icon aria-hidden="true" size={17} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight aria-hidden="true" size={15} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {visibleGroups.length === 0 && <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-xs leading-5 text-emerald-50/65">কোনো matching page পাওয়া যায়নি। অন্য নামে search করুন।</p>}
    </nav>
  );
}

export default function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const currentItem = useMemo(() => groups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href)), [pathname]);
  const currentGroup = groups.find((group) => group.items.some((item) => item.href === currentItem?.href));
  const pageTitle = currentItem?.label ?? "Admin workspace";

  const sidebarContent = (mobile = false) => (
    <>
      <div className="border-b border-white/[0.08] px-4 pb-4 pt-5">
        <Link href="/admin" onClick={mobile ? () => setDrawerOpen(false) : undefined} className="flex items-center gap-3" aria-label="AGRIVA Admin home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-sm font-black tracking-tight text-[#173b2d] shadow-sm">A</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-black tracking-[0.12em] text-white">AGRIVA</span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-100/45">Admin workspace</span>
          </span>
        </Link>
      </div>
      <div className="px-3 pb-3 pt-4">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-emerald-100/55 focus-within:border-lime-300/60 focus-within:ring-2 focus-within:ring-lime-300/15">
          <Search size={15} aria-hidden="true" />
          <input value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder="Find a page..." aria-label="Search admin pages"
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-emerald-100/40" />
          
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-2">
        <Navigation pathname={pathname} query={navQuery} onNavigate={mobile ? () => setDrawerOpen(false) : undefined} />
      </div>
      <div className="border-t border-white/[0.08] p-3">
        <Link href="/dashboard" onClick={mobile ? () => setDrawerOpen(false) : undefined} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-emerald-50/70 transition hover:bg-white/[0.08] hover:text-white">
          <ArrowUpRight size={16} /> User dashboard <span className="ml-auto text-emerald-100/35">↗</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-[#173b2d]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/[0.08] bg-[#102f25] text-white shadow-[8px_0_32px_rgba(16,47,37,0.06)] lg:flex">
        {sidebarContent()}
      </aside>

      <div className="min-w-0 lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-[#e4ebe1] bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open admin navigation" aria-expanded={drawerOpen}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e0e8dd] text-[#17452f] transition hover:bg-[#f1f6ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 lg:hidden">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <p className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#91a094] sm:flex">
                  <span>AGRIVA</span><ChevronRight size={11}/><span>{currentGroup?.label ?? "Workspace"}</span>
                </p>
                <h1 className="truncate text-[15px] font-extrabold tracking-tight text-[#173b2d] sm:mt-1 sm:text-[17px]">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <OrderNotificationBell />
              <div className="hidden h-8 w-px bg-[#e7ede4] sm:block" />
              <div className="flex items-center gap-2 rounded-xl border border-[#e8eee5] bg-[#f8faf6] px-2 py-1.5 sm:px-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcebd8] text-xs font-black text-[#17452f]">{adminName.trim().charAt(0).toUpperCase() || "A"}</span>
                <span className="hidden max-w-36 truncate text-xs font-bold text-[#365747] sm:block">{adminName}</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-72px)] min-w-0">{children}</div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-[#0b2118]/65 backdrop-blur-[2px]" />
          <aside className="relative flex h-full w-[min(88vw,340px)] flex-col bg-[#102f25] text-white shadow-2xl">
            <div className="absolute right-3 top-5 z-10">
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><X size={18} /></button>
            </div>
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </div>
  );
}

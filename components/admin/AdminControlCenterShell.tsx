"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PanelsTopLeft, Store, Sprout, Users, ShoppingBag,
  Wheat, Leaf, Bot, Megaphone, ShieldCheck, Search, ChevronRight,
  Menu, X, Home, ExternalLink, Command, ArrowUpRight,
} from "lucide-react";

export type AdminShellLink = { label: string; href: string; capability?: string };
export type AdminShellModule = {
  id: string;
  title: string;
  icon: string;
  links: AdminShellLink[];
  planned?: string[];
};

type Props = { modules: AdminShellModule[]; children: ReactNode };

const iconMap = {
  dashboard: LayoutDashboard,
  cms: PanelsTopLeft,
  marketplace: Store,
  plant: Sprout,
  people: Users,
  orders: ShoppingBag,
  agriculture: Wheat,
  green: Leaf,
  ai: Bot,
  marketing: Megaphone,
  security: ShieldCheck,
} as const;

const primaryIds = ["dashboard", "orders", "marketplace", "plant"];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function ModuleLinks({
  module,
  pathname,
  onNavigate,
  compact = false,
}: {
  module: AdminShellModule;
  pathname: string;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const Icon = iconMap[module.icon as keyof typeof iconMap] ?? LayoutDashboard;
  const active = module.links.some((link) => isActive(pathname, link.href));

  return (
    <section className={compact ? "space-y-1" : "space-y-1.5"} aria-label={module.title}>
      <div className={`flex items-center gap-2 px-3 ${compact ? "pb-1" : "pb-1.5"}`}>
        <Icon size={15} aria-hidden="true" className={active ? "text-emerald-700" : "text-slate-400"} />
        <h2 className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">{module.title}</h2>
        {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" /> : null}
      </div>
      {module.links.map((link) => {
        const selected = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={selected ? "page" : undefined}
            className={`group flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected ? "bg-emerald-50 text-emerald-950 shadow-[inset_3px_0_0_#15803d]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
          >
            <span className="truncate">{link.label}</span>
            {selected ? <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Open</span> : <ChevronRight size={14} aria-hidden="true" className="text-slate-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />}
          </Link>
        );
      })}
      {module.planned?.length ? (
        <details className="group px-3 pb-1 pt-0.5">
          <summary className="cursor-pointer list-none text-[11px] font-medium text-slate-400 marker:hidden hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
            Roadmap · {module.planned.length}
          </summary>
          <ul className="mt-2 space-y-1 border-l border-dashed border-slate-200 pl-3">
            {module.planned.map((item) => <li key={item} className="text-[11px] leading-5 text-slate-400">{item}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export default function AdminControlCenterShell({ modules, children }: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileSearchRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        desktopSearchRef.current?.focus();
      }
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName ?? "")) {
        event.preventDefault();
        desktopSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredModules = useMemo(() => modules.map((module) => ({
    ...module,
    links: module.links.filter((link) => !normalizedQuery || (module.title + " " + link.label).toLocaleLowerCase().includes(normalizedQuery)),
    planned: module.planned?.filter((item) => !normalizedQuery || item.toLocaleLowerCase().includes(normalizedQuery)),
  })).filter((module) => module.links.length > 0 || Boolean(module.planned?.length)), [modules, normalizedQuery]);

  const primaryModules = primaryIds.map((id) => modules.find((module) => module.id === id)).filter((module): module is AdminShellModule => Boolean(module));
  const activeModule = modules.find((module) => module.links.some((link) => isActive(pathname, link.href)));
  const activeLink = activeModule?.links.find((link) => isActive(pathname, link.href));
  const dashboardLink = modules.find((module) => module.id === "dashboard")?.links[0];

  const closeMore = () => setMoreOpen(false);
  const renderModules = (compact = false) => (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {filteredModules.map((module) => <ModuleLinks key={module.id} module={module} pathname={pathname} onNavigate={closeMore} compact={compact} />)}
      {!filteredModules.length ? <p className="px-3 py-6 text-sm text-slate-500">No matching admin pages.</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f8f5] text-slate-900">
      <a href="#admin-main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[286px] flex-col border-r border-[#e3ebe3] bg-white lg:flex">
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17452f] text-white shadow-sm"><Sprout size={22} aria-hidden="true" /></div>
          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-tight text-[#173b2c]">AGRIVA</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">Super Admin Workspace</p>
          </div>
          <span className="ml-auto rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">Admin</span>
        </div>

        <div className="border-b border-slate-100 p-3">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
            <Search size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
            <input ref={desktopSearchRef} aria-label="Search admin navigation" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a page or module..." className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-slate-400" />
            {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button> : <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400">⌘ K</kbd>}
          </label>
        </div>

        <nav aria-label="Admin navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {renderModules()}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <Link href="/dashboard" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
            <Home size={15} aria-hidden="true"/> User dashboard <ExternalLink size={12} aria-hidden="true" className="ml-auto"/>
          </Link>
          <p className="px-3 pt-2 text-[10px] leading-4 text-slate-400">Every page and privileged action is authorized on the server.</p>
        </div>
      </aside>

      <div className="lg:pl-[286px]">
        <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between gap-3 border-b border-[#e3ebe3] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#17452f] text-white lg:hidden"><Sprout size={19} aria-hidden="true"/></div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#173b2c]">AGRIVA Control Center</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{activeModule?.title ?? "Workspace"}{activeLink && activeLink.label !== "Overview" ? ` / ${activeLink.label}` : ""}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/> Protected workspace</span>
            <Link href="/dashboard" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50">
              <ArrowUpRight size={13} aria-hidden="true"/> <span className="hidden sm:inline">User site</span><span className="sm:hidden">Site</span>
            </Link>
          </div>
        </header>

        <main id="admin-main-content" tabIndex={-1} className="min-h-[calc(100vh-68px)] pb-24 outline-none lg:pb-8">
          {children}
        </main>
      </div>

      <nav aria-label="Mobile admin navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dce6da] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_24px_rgba(20,50,30,.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primaryModules.map((module) => {
            const link = module.links[0];
            const Icon = iconMap[module.icon as keyof typeof iconMap] ?? LayoutDashboard;
            const selected = module.links.some((item) => isActive(pathname, item.href));
            return link ? (
              <Link key={module.id} href={link.href} aria-current={selected ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${selected ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"}`}>
                <Icon size={18} aria-hidden="true"/><span>{module.id === "dashboard" ? "Home" : module.id === "orders" ? "Orders" : module.id === "marketplace" ? "Market" : "Plants"}</span>
              </Link>
            ) : null;
          })}
          <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-controls="admin-mobile-more" className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${moreOpen ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"}`}>
            <Menu size={18} aria-hidden="true"/><span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/40 p-2 backdrop-blur-[2px] lg:hidden" onClick={closeMore}>
          <section
            id="admin-mobile-more"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-more-title"
            className="mx-auto mb-[calc(64px+env(safe-area-inset-bottom))] max-h-[min(76vh,680px)] w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div><p id="admin-mobile-more-title" className="text-sm font-black text-slate-900">All admin modules</p><p className="mt-0.5 text-[11px] text-slate-500">Search and open a workspace</p></div>
              <button type="button" onClick={closeMore} aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><X size={17}/></button>
            </div>
            <div className="border-b border-slate-100 p-3">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                <Search size={15} aria-hidden="true" className="text-slate-400"/>
                <input ref={mobileSearchRef} aria-label="Search admin modules" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and modules..." className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>
                {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button> : null}
              </label>
            </div>
            <div className="max-h-[calc(min(76vh,680px)-140px)] space-y-4 overflow-y-auto overscroll-contain p-3">
              {renderModules(true)}
              <Link href="/dashboard" onClick={closeMore} className="flex min-h-11 items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500"><Home size={15}/> User dashboard</Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

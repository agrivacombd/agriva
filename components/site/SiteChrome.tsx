"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUp, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const bnLinks = [
  { href: "/", label: "হোম" },
  { href: "/#services", label: "সেবাসমূহ" },
  { href: "/agriculture-calculators", label: "কৃষি ক্যালকুলেটর" },
  { href: "/crop-calendar", label: "ফসল ক্যালেন্ডার" },
  { href: "/learn", label: "কৃষি গাইড" },
  { href: "/marketplace", label: "মার্কেটপ্লেস" },
  { href: "/blog", label: "কৃষি ব্লগ" },
];

const enLinks = [
  { href: "/en", label: "Home" },
  { href: "/en/agriculture-calculators", label: "Calculators" },
  { href: "/en/crop-calendar", label: "Crop calendar" },
];

const bnToEn: Record<string, string> = {
  "/": "/en",
  "/tools": "/en/agriculture-calculators",
  "/krishi-calculator": "/en/agriculture-calculators",
  "/agriculture-calculators": "/en/agriculture-calculators",
  "/fertilizer-calculator": "/en/fertilizer-calculator",
  "/seed-rate-calculator": "/en/seed-rate-calculator",
  "/farming-cost-profit-calculator": "/en/farming-cost-profit-calculator",
  "/crop-calendar": "/en/crop-calendar",
  "/soil-fertilizer": "/en/soil-fertilizer",
  "/crop-choice": "/en/crop-choice",
};
const enToBn: Record<string, string> = Object.fromEntries(Object.entries(bnToEn).map(([bn, en]) => [en, bn]));

function isEnglishPath(path: string) {
  return path === "/en" || path.startsWith("/en/");
}

export default function SiteChrome() {
  const pathname = usePathname() || "/";
  const english = isEnglishPath(pathname);
  const privateRoute = /^\/(admin|dashboard|auth|login|signup|garden|profile|orders)(\/|$)/.test(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.documentElement.lang = english ? "en" : "bn";
    setMenuOpen(false);
  }, [english, pathname]);

  useEffect(() => {
    let previousY = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0);
      setShowTop(y > 520);
      if (y < 90 || y < previousY - 4) setVisible(true);
      else if (y > previousY + 8 && y > 150) setVisible(false);
      previousY = y;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  if (privateRoute) return null;

  const languageTarget = english ? (enToBn[pathname] || "/") : (bnToEn[pathname] || "/en");
  const links = english ? enLinks : bnLinks;

  return (
    <>
      <div aria-hidden="true" className="fixed left-0 top-0 z-[70] h-1 bg-emerald-600 transition-[width] duration-100" style={{ width: progress + "%" }} />
      <header className={"sticky top-0 z-[60] border-b border-emerald-100/80 bg-white/95 shadow-sm backdrop-blur transition-transform duration-200 motion-reduce:transition-none " + (visible ? "translate-y-0" : "-translate-y-full")}>
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={english ? "/en" : "/"} className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" aria-label="AGRIVA home">
            <Image src="/agriva-logo.svg" alt="AGRIVA" width={320} height={85} priority sizes="(max-width: 640px) 176px, 208px" className="h-10 w-40 object-contain object-left sm:w-48" />
          </Link>
          <nav aria-label={english ? "Main navigation" : "প্রধান নেভিগেশন"} className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={"rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-emerald-50 hover:text-emerald-900 " + (pathname === link.href ? "bg-emerald-50 text-emerald-900" : "text-slate-700")}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={languageTarget} lang={english ? "bn" : "en"} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" aria-label={english ? "Switch language to Bangla" : "Switch language to English"}>
              <Globe2 size={17} />
              <span>{english ? "বাংলা" : "English"}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </Link>
            <div className="hidden items-center gap-2 sm:flex"><Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50">{english ? "Log in" : "লগইন"}</Link><Link href="/dashboard" className="rounded-xl bg-emerald-800 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-950">{english ? "Open app" : "অ্যাপ খুলুন"}</Link></div>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 lg:hidden" aria-label={menuOpen ? (english ? "Close menu" : "মেনু বন্ধ করুন") : (english ? "Open menu" : "মেনু খুলুন")} aria-expanded={menuOpen}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && <nav aria-label={english ? "Mobile navigation" : "মোবাইল নেভিগেশন"} className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 hover:bg-emerald-50">{link.label}</Link>)}
          </div>
        </nav>}
      </header>
      {showTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-emerald-800 text-white shadow-lg transition hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2" aria-label={english ? "Back to top" : "উপরে যান"}><ArrowUp size={21} /></button>}
    </>
  );
}

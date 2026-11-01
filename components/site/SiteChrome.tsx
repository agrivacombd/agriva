"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUp,
  Calculator,
  CalendarDays,
  ChevronDown,
  Globe2,
  LogIn,
  Menu,
  Search,
  Sprout,
  X,
undefinedundefined} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const bnPrimaryLinks = [
  { href: "/tools", label: "কৃষি টুলস" },
  { href: "/marketplace", label: "মার্কেটপ্লেস" },
  { href: "/plant-market", label: "গাছ ও বাগান" },
  { href: "/sell-harvest", label: "ফসল বিক্রি" },
  { href: "/buyer-demands", label: "চাহিদা বোর্ড" },
  { href: "/blog", label: "কৃষি ব্লগ" },
  { href: "/farms", label: "খামার ব্যবস্থাপনা" },
  { href: "/jobs", label: "কৃষি কাজ ও চাকরি" },
  { href: "/transport", label: "কৃষি পরিবহন" },
];

const enPrimaryLinks = [
  { href: "/en", label: "Home" },
  { href: "/en/tools", label: "Tools" },
  { href: "/en/agriculture-calculators", label: "Calculators" },
  { href: "/en/crop-calendar", label: "Crop calendar" },
];

const bnToEn: Record<string, string> = {
  "/": "/en",
  "/tools": "/en/tools",
  "/krishi-calculator": "/en/agriculture-calculators",
  "/agriculture-calculators": "/en/agriculture-calculators",
  "/fertilizer-calculator": "/en/fertilizer-calculator",
  "/seed-rate-calculator": "/en/seed-rate-calculator",
  "/farming-cost-profit-calculator": "/en/farming-cost-profit-calculator",
  "/crop-calendar": "/en/crop-calendar",
  "/soil-fertilizer": "/en/soil-fertilizer",
  "/crop-choice": "/en/crop-choice",
};

const enToBn: Record<string, string> = {
  "/en": "/",
  "/en/tools": "/tools",
  "/en/agriculture-calculators": "/agriculture-calculators",
  "/en/fertilizer-calculator": "/fertilizer-calculator",
  "/en/seed-rate-calculator": "/seed-rate-calculator",
  "/en/farming-cost-profit-calculator": "/farming-cost-profit-calculator",
  "/en/crop-calendar": "/crop-calendar",
  "/en/soil-fertilizer": "/soil-fertilizer",
  "/en/crop-choice": "/crop-choice",
};

function isEnglishPath(path: string) {
  return path === "/en" || path.startsWith("/en/");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function SearchForm({ english }: { english: boolean }) {
  return (
    <form
      action="/marketplace"
      method="get"
      role="search"
      className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
    >
      <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        name="q"
        placeholder={english ? "Search products, seeds and supplies..." : "পণ্য, বীজ, সার বা কৃষি উপকরণ খুঁজুন..."}
        aria-label={english ? "Search marketplace" : "মার্কেটপ্লেসে পণ্য খুঁজুন"}
        className="h-11 min-w-0 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      <button type="submit" className="sr-only">{english ? "Search" : "খুঁজুন"}</button>
    </form>
  );
}

export default function SiteChrome() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const english = isEnglishPath(pathname);
  const privateRoute = /^\/(admin|dashboard|auth|login|signup|garden|profile|orders)(\/|$)/.test(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (active) {
          setSignedIn(Boolean(user));
          setAuthReady(true);
        }
      }).catch(() => {
        if (active) setAuthReady(true);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setSignedIn(Boolean(session?.user));
          setAuthReady(true);
        }
      });
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      setAuthReady(true);
    }
  }, []);

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) return;
      setSignedIn(false);
      setMenuOpen(false);
      router.push(english ? "/en" : "/");
      router.refresh();
    } catch {
      // Keep the session UI intact if sign-out cannot be confirmed.
    }
  }

  useEffect(() => {
    document.documentElement.lang = english ? "en" : "bn";
    setMenuOpen(false);
  }, [english, pathname]);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0);
      setShowTop(y > 520);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>(focusableSelector) || [])
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
    getFocusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  if (privateRoute) return null;

  const languageTarget = english ? (enToBn[pathname] || "/") : (bnToEn[pathname] || "/en");
  const primaryLinks = english ? enPrimaryLinks : bnPrimaryLinks;
  return (
    <>
      <div aria-hidden="true" className="fixed left-0 top-0 z-[80] h-1 bg-emerald-600 transition-[width] duration-100" style={{ width: progress + "%" }} />
      <header className="sticky top-0 z-[70] border-b border-emerald-100/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-3 px-3 sm:gap-5 sm:px-6 lg:px-8">
          <Link href={english ? "/en" : "/"} className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2" aria-label="AGRIVA home">
            <Image src="/agriva-logo.svg" alt="AGRIVA" width={320} height={85} priority sizes="(max-width: 640px) 152px, 192px" className="h-9 w-36 object-contain object-left sm:h-10 sm:w-48" />
          </Link>

          <div className="hidden min-w-0 flex-1 md:block md:max-w-xl lg:mx-5">
            <SearchForm english={english} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href={languageTarget} lang={english ? "bn" : "en"} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-white px-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:gap-1.5 sm:px-3 sm:text-sm" aria-label={english ? "Switch language to Bangla" : "Switch language to English"}>
              <Globe2 size={16} aria-hidden="true" />
              <span>{english ? "বাংলা" : "English"}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              {authReady && (signedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">{english ? "Dashboard" : "ড্যাশবোর্ড"}</Link>
                  <button type="button" onClick={signOut} className="min-h-10 rounded-xl px-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">{english ? "Log out" : "লগআউট"}</button>
                </>
              ) : (
                <Link href="/login" className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"><LogIn size={16} />{english ? "Log in" : "লগইন"}</Link>
              ))}
            </div>

            <Link href="/sell-harvest" className="hidden min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:inline-flex">
              <Sprout size={16} aria-hidden="true" />{english ? "Sell your harvest" : "বিক্রি শুরু করুন"}
            </Link>

            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 xl:hidden" aria-label={menuOpen ? (english ? "Close menu" : "মেনু বন্ধ করুন") : (english ? "Open menu" : "মেনু খুলুন")} aria-expanded={menuOpen} aria-controls="agriva-mobile-navigation" aria-haspopup="dialog" ref={menuButtonRef}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="mx-auto hidden max-w-7xl items-center gap-1 px-3 pb-2 sm:px-6 lg:px-8 xl:flex">
          <nav aria-label={english ? "Main navigation" : "প্রধান নেভিগেশন"} className="flex min-w-0 flex-1 items-center gap-0.5">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={isActivePath(pathname, link.href) ? "page" : undefined} className={"whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold leading-5 transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (isActivePath(pathname, link.href) ? "bg-emerald-50 text-emerald-900" : "text-slate-700")}>
                {link.label}
              </Link>
            ))}

          </nav>
        </div>

        <div className="border-t border-slate-100 px-3 py-2 md:hidden">
          <SearchForm english={english} />
        </div>


      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[90] xl:hidden" id="agriva-mobile-navigation">
          <button type="button" aria-label={english ? "Close navigation menu" : "মেনু বন্ধ করুন"} onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-slate-950/40" />
          <nav ref={drawerRef} role="dialog" aria-modal="true" aria-label={english ? "Mobile navigation" : "মোবাইল নেভিগেশন"} className="absolute inset-y-0 right-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex min-h-16 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-base font-extrabold text-slate-900">{english ? "Explore AGRIVA" : "AGRIVA মেনু"}</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" aria-label={english ? "Close menu" : "মেনু বন্ধ করুন"}><X size={21} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="grid gap-1">
                {primaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} aria-current={isActivePath(pathname, link.href) ? "page" : undefined} className={"flex min-h-12 items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " + (isActivePath(pathname, link.href) ? "bg-emerald-50 text-emerald-900" : "text-slate-800 hover:bg-slate-50")}>
                    <span>{link.label}</span>
                    {link.href === "/marketplace" && !english && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">বাজার</span>}
                  </Link>
                ))}
              </div>

              <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4">
                <Link href={english ? "/en" : "/sell-harvest"} onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
                  <Sprout size={18} aria-hidden="true" />{english ? "Start selling" : "বিক্রি শুরু করুন"}
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href={languageTarget} lang={english ? "bn" : "en"} onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-bold text-emerald-900"><Globe2 size={16} />{english ? "বাংলা" : "English"}</Link>
                {authReady && (signedIn ? (
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white">{english ? "Dashboard" : "ড্যাশবোর্ড"}</Link>
                    <button type="button" onClick={signOut} className="min-h-10 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:bg-white">{english ? "Log out" : "লগআউট"}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-sm font-bold text-emerald-800"><LogIn size={16} />{english ? "Log in" : "লগইন"}</Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white">{english ? "Sign up" : "নিবন্ধন"}</Link>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}

      {showTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-emerald-800 text-white shadow-lg transition hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2" aria-label={english ? "Back to top" : "উপরে যান"}><ArrowUp size={21} /></button>}
    </>
  );
}

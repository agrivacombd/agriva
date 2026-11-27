"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { hasAnalyticsConsent } from "@/lib/analytics";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = "agriva_privacy_consent_v1";

type Consent = { analytics: boolean; marketing: boolean; updatedAt: string };
const validMeasurementId = Boolean(measurementId && /^G-[A-Z0-9]+$/.test(measurementId));

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Consent>;
    if (typeof value.analytics !== "boolean" || typeof value.marketing !== "boolean") return null;
    return { analytics: value.analytics, marketing: value.marketing, updatedAt: String(value.updatedAt ?? "") };
  } catch {
    return null;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [ready, setReady] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      const saved = readConsent();
      setConsent(saved);
      setAnalyticsChoice(Boolean(saved?.analytics));
      setMarketingChoice(Boolean(saved?.marketing));
      setConsentChecked(true);
    };
    const openPreferences = () => {
      const saved = readConsent();
      setAnalyticsChoice(Boolean(saved?.analytics));
      setMarketingChoice(Boolean(saved?.marketing));
      setShowPreferences(true);
    };

    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener("agriva:open-cookie-settings", openPreferences);
    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener("agriva:open-cookie-settings", openPreferences);
    };
  }, []);

  // Respect changes made in another tab (or after revoking consent).
  // Once loaded, a Google tag stays on the page even when its Script unmounts.
  useEffect(() => {
    if (!ready || typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      analytics_storage: consent?.analytics ? "granted" : "denied",
      ad_storage: consent?.marketing ? "granted" : "denied",
      ad_user_data: consent?.marketing ? "granted" : "denied",
      ad_personalization: consent?.marketing ? "granted" : "denied",
    });
  }, [consent?.analytics, consent?.marketing, ready]);

  useEffect(() => {
    if (!consent?.analytics || !hasAnalyticsConsent() || !ready || !pathname || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [consent?.analytics, ready, pathname]);

  function savePreferences(analytics: boolean, marketing: boolean) {
    const next: Consent = { analytics, marketing, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    } catch {
      // If browser storage is unavailable, do not enable optional tracking.
      setConsent(null);
      setShowPreferences(false);
      return;
    }
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: analytics ? "granted" : "denied",
        ad_storage: marketing ? "granted" : "denied",
        ad_user_data: marketing ? "granted" : "denied",
        ad_personalization: marketing ? "granted" : "denied",
      });
    }
    setConsent(next);
    window.dispatchEvent(new Event("agriva:consent-changed"));
    setAnalyticsChoice(analytics);
    setMarketingChoice(marketing);
    setShowPreferences(false);
  }

  // Do not render the banner until the saved choice has been read. This prevents
  // a consent prompt flash on every reload for returning visitors.
  const showBanner = consentChecked && consent === null;

  return (
    <>
      {consent?.analytics && validMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="agriva-google-analytics" strategy="afterInteractive" onReady={() => setReady(true)}>
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = function(){window.dataLayer.push(arguments);};
              window.gtag('js', new Date());
              // Basic Consent Mode v2: defaults first, then the stored opt-in.
              // No Google tag is loaded at all for visitors who denied analytics.
              window.gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              window.gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: '${consent?.marketing ? "granted" : "denied"}',
                ad_user_data: '${consent?.marketing ? "granted" : "denied"}',
                ad_personalization: '${consent?.marketing ? "granted" : "denied"}'
              });
              window.gtag('config', '${measurementId}', {
                anonymize_ip: true,
                send_page_view: false
              });
            `}
          </Script>
        </>
      )}

      {(showBanner || showPreferences) && (
        <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-[#d7e2d5] bg-white p-4 text-[#193b27] shadow-2xl sm:inset-x-5 sm:bottom-5 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="agriva-consent-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#9b7625]">Your privacy matters</p>
              <h2 id="agriva-consent-title" className="mt-1 text-lg font-black">কুকি ও গোপনীয়তা পছন্দ</h2>
            </div>
            {!showBanner && <button type="button" onClick={() => setShowPreferences(false)} className="rounded-lg px-2 py-1 text-sm font-bold text-[#5c6e60]" aria-label="Close preferences">✕</button>}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#647267]">প্রয়োজনীয় storage সাইট চালাতে ব্যবহৃত হয়। Analytics ও marketing প্রযুক্তি চালু হবে কেবল আপনার অনুমতি দিলে। যেকোনো সময় পছন্দ পরিবর্তন করতে পারবেন।</p>
          {showPreferences && (
            <div className="mt-4 space-y-3 rounded-xl bg-[#f5f8f3] p-3">
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">প্রয়োজনীয়</p><p className="text-xs text-[#6b786d]">নিরাপত্তা ও মূল সাইট কার্যক্রম</p></div><span className="text-xs font-extrabold text-[#287044]">Always on</span></div>
              <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-sm font-bold">Analytics</span><span className="block text-xs text-[#6b786d]">GA4 ও ব্যবহার পরিসংখ্যান</span></span><input type="checkbox" checked={analyticsChoice} onChange={e => setAnalyticsChoice(e.target.checked)} className="h-5 w-5 accent-[#17452c]"/></label>
              <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-sm font-bold">Marketing</span><span className="block text-xs text-[#6b786d]">Ads pixel ও campaign measurement</span></span><input type="checkbox" checked={marketingChoice} onChange={e => setMarketingChoice(e.target.checked)} className="h-5 w-5 accent-[#17452c]"/></label>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {showPreferences ? (
              <button type="button" onClick={() => savePreferences(analyticsChoice, marketingChoice)} className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">পছন্দ সংরক্ষণ</button>
            ) : (
              <>
                <button type="button" onClick={() => savePreferences(false, false)} className="rounded-xl border border-[#d4dfd2] px-4 py-2.5 text-sm font-bold">শুধু প্রয়োজনীয়</button>
                <button type="button" onClick={() => setShowPreferences(true)} className="rounded-xl border border-[#d4dfd2] px-4 py-2.5 text-sm font-bold">পছন্দ নির্ধারণ</button>
                <button type="button" onClick={() => savePreferences(true, true)} className="rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">সব অনুমতি দিন</button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#647267]">অনুমতি না দিলেও AGRIVA ব্যবহার করতে পারবেন। <Link href="/privacy-policy" className="font-bold text-emerald-800 underline underline-offset-2">গোপনীয়তা নীতি</Link> ও <Link href="/cookie-policy" className="font-bold text-emerald-800 underline underline-offset-2">Cookie Policy</Link>-তে বিস্তারিত দেখুন।</p>
        </div>
      )}


    </>
  );
}

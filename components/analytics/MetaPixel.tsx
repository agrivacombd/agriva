"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { hasMarketingConsent, trackMetaEvent } from "@/lib/meta-pixel";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const validPixelId = Boolean(pixelId && /^\d{10,25}$/.test(pixelId));

/** Meta Pixel only loads after explicit marketing consent; there is no tracking by default. */
export default function MetaPixel() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncConsent = () => setAllowed(hasMarketingConsent());
    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener("agriva:consent-changed", syncConsent);
    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener("agriva:consent-changed", syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof window.fbq !== "function") return;
    window.fbq("consent", allowed ? "grant" : "revoke");
  }, [allowed, ready]);

  // Notify product detail listeners only after the consent-gated Pixel is ready.
  useEffect(() => {
    if (!ready || !allowed) return;
    window.dispatchEvent(new Event("agriva:meta-pixel-ready"));
  }, [allowed, ready]);

  useEffect(() => {
    if (!ready || !allowed || !pathname) return;
    trackMetaEvent("PageView");
  }, [allowed, ready, pathname]);

  if (!validPixelId || !allowed) return null;

  return (
    <Script id="agriva-meta-pixel" strategy="afterInteractive" onReady={() => setReady(true)}>
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
        t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
      `}
    </Script>
  );
}

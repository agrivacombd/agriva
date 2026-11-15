"use client";

import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/lib/analytics";
import { hasMarketingConsent } from "@/lib/meta-pixel";

/**
 * Privacy-first Clarity loader. Never loads Clarity before analytics opt-in.
 * If GTM or another integration already initialized Clarity, reuse it instead
 * of injecting a second SDK.
 */
export default function MicrosoftClarityClient({ projectId }: { projectId: string }) {
  useEffect(() => {
    if (!/^[a-z0-9]{6,24}$/i.test(projectId)) return;
    let previouslyAllowed = false;

    const syncConsent = () => {
      const allowed = hasAnalyticsConsent();
      if (!allowed) {
        if (typeof window.clarity === "function") {
          window.clarity("consentv2", {
            ad_Storage: "denied",
            analytics_Storage: "denied",
          });
        }
        if (previouslyAllowed) {
          // Unload the SDK after a withdrawal: Clarity's own no-consent mode
          // may continue receiving cookieless page events until a hard reload.
          window.location.reload();
          return;
        }
        previouslyAllowed = false;
        return;
      }

      previouslyAllowed = true;
      if (typeof window.clarity !== "function") {
        const queued: unknown[][] = [];
        const stub: ((...args: unknown[]) => void) & { q?: unknown[][] } =
          (...args: unknown[]) => { queued.push(args); };
        stub.q = queued;
        window.clarity = stub;
      }

      window.clarity("consentv2", {
        ad_Storage: hasMarketingConsent() ? "granted" : "denied",
        analytics_Storage: "granted",
      });

      if (!document.querySelector('script[src*="clarity.ms/tag/"]')) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.clarity.ms/tag/" + projectId;
        script.dataset.agrivaClarity = "true";
        document.head.appendChild(script);
      }
    };

    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener("agriva:consent-changed", syncConsent);
    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener("agriva:consent-changed", syncConsent);
    };
  }, [projectId]);

  return null;
}

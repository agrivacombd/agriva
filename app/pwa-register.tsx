"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "agriva-pwa-install-dismissed-until";
const DELAY_MS = 45_000;
const BANNER_MS = 6_000;
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export default function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("AGRIVA service worker registration failed:", error);
        }
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    let deferredPrompt: InstallPromptEvent | null = null;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as InstallPromptEvent;
      setInstallEvent(deferredPrompt);

      if (isStandalone()) return;
      try {
        const dismissedUntil = Number(localStorage.getItem(DISMISSED_KEY) || "0");
        if (dismissedUntil > Date.now()) return;
      } catch {}

      // Wait for meaningful engagement, not just the initial page load.
      delayTimer = setTimeout(() => {
        if (document.visibilityState === "visible" && deferredPrompt) {
          setShowInstall(true);
          hideTimer = setTimeout(() => setShowInstall(false), BANNER_MS);
        }
      }, DELAY_MS);
    };

    const onInstalled = () => {
      setShowInstall(false);
      setInstallEvent(null);
      deferredPrompt = null;
      if (delayTimer) clearTimeout(delayTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (delayTimer) clearTimeout(delayTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const dismissInstall = () => {
    setShowInstall(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now() + COOLDOWN_MS));
    } catch {}
  };

  const installApp = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    setShowInstall(false);
    if (choice.outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {}
    }
  };

  return (
    <>
      {showInstall && installEvent && (
        <aside
          role="dialog"
          aria-label="AGRIVA অ্যাপ ইনস্টল করুন"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-gray-900 shadow-xl"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">
            🌱
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">AGRIVA ফোনে ইনস্টল করুন</p>
            <p className="text-sm text-gray-600">দ্রুত খুলুন, সহজে কৃষি তথ্য পান।</p>
          </div>
          <button
            type="button"
            onClick={installApp}
            className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            ইনস্টল
          </button>
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="বন্ধ করুন"
            className="shrink-0 rounded-lg px-2 py-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </aside>
      )}
    </>
  );
}

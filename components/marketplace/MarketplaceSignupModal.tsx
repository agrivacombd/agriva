"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import SignupExperience from "@/components/auth/SignupExperience";

export default function MarketplaceSignupModal({
  returnTo,
  onClose,
}: {
  returnTo: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      // Keep keyboard focus within the dialog while it is open.
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        if (!dialog) return;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        )).filter(item => item.getClientRects().length > 0);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="AGRIVA-তে অ্যাকাউন্ট তৈরি করুন"
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Signup popup বন্ধ করুন"
          className="sticky right-3 top-3 z-10 ml-auto mr-3 mt-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200">
          <X size={20} />
        </button>
        <div className="-mt-6">
          <SignupExperience embedded returnTo={returnTo} />
        </div>
      </div>
    </div>
  );
}
